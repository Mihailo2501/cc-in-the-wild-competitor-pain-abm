// build-account-site.js
// Renders a self-contained, brand-themed mini-site (one HTML file) per account from
// <client>-account.json. Replaces the one-pager PDF. Follows the html-craft house style:
// OKLCH tokens, real brand kit (extracted via Potter inspect_styles), Emil-grade motion,
// focus-visible, reduced-motion, no em dashes, real images embedded as base64.
//
// Usage:  node scripts/build-account-site.js loop
//         node scripts/build-account-site.js loop planhat
//         OUT_DIR="/path/to/output" node scripts/build-account-site.js loop
//
// Reads:  <OUT_DIR>/<client>/<client>-account.json  and  <OUT_DIR>/<client>/evidence-*.png
// Writes: <OUT_DIR>/<client>/<client>-site.html

import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OUT_DIR =
  process.env.OUT_DIR ||
  path.join(__dirname, "..", "..", "CC in the Wild Demo Output");

// ---------------------------------------------------------------------------
// Brand kits, extracted live from each company site via Potter inspect_styles.
// Colours are OKLCH (html-craft canonical). Brand font is listed first so a
// machine that has it uses it; the free Google alternative is the real fallback.
// ---------------------------------------------------------------------------
const BRAND_KITS = {
  loop: {
    label: "Loop",
    googleFonts:
      "https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=Hanken+Grotesk:wght@400;500;600;700&display=swap",
    displayFont: "'Ginto', 'Archivo', system-ui, sans-serif",
    bodyFont: "'Matter', 'Hanken Grotesk', system-ui, sans-serif",
    heroDark: false,
    tokens: {
      brand: "oklch(0.585 0.205 258)", // #056EF5 electric blue
      brandStrong: "oklch(0.50 0.20 258)",
      onBrand: "oklch(1 0 0)",
      ink: "oklch(0.22 0.025 110)", // #20210F warm near-black
      inkSoft: "oklch(0.44 0.02 110)",
      inkFaint: "oklch(0.50 0.016 110)",
      brandText: "oklch(0.47 0.19 258)", // dark blue, >=4.5:1 on the warm bg
      bg: "oklch(0.992 0.006 85)", // #FFFCF7 warm off-white (brand identity)
      surface: "oklch(0.978 0.008 85)",
      surface2: "oklch(0.958 0.011 85)",
      hairline: "oklch(0.45 0.02 110 / 0.16)",
      accent: "oklch(0.82 0.09 232)", // #8CD3FA light blue, sparingly
      heroText: "oklch(0.22 0.025 110)",
      radiusCard: "14px",
      radiusBtn: "999px",
      shadow: "0 14px 40px oklch(0.22 0.04 110 / 0.10)",
    },
    // Role tone = brand-cohesive (blue + neutrals), not a 5-colour rainbow.
    roleTone: {
      CHAMPION: "oklch(0.48 0.19 258)", // brand blue, text-safe
      PRIMARY: "oklch(0.43 0.19 258)", // deeper blue (the owner)
      OPS: "oklch(0.42 0.02 110)", // neutral mid
      ECONOMIC: "oklch(0.30 0.025 110)", // neutral dark
      ESCALATION: "oklch(0.47 0.016 110)", // faint, text-safe
    },
  },
  planhat: {
    label: "Planhat",
    googleFonts:
      "https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap",
    displayFont:
      "'Geigy LL Duplex Var Variable Reg', 'Familjen Grotesk', system-ui, sans-serif",
    bodyFont: "'Inter', system-ui, sans-serif", // Planhat brand identity
    heroDark: true,
    tokens: {
      brand: "oklch(0.22 0.008 265)", // near-black (Planhat primary is monochrome)
      brandStrong: "oklch(0.14 0.008 265)",
      onBrand: "oklch(1 0 0)",
      ink: "oklch(0.18 0.006 265)",
      inkSoft: "oklch(0.42 0.006 265)",
      inkFaint: "oklch(0.50 0.006 265)",
      brandText: "oklch(0.22 0.008 265)", // near-black, high contrast on white
      bg: "oklch(1 0 0)", // white
      surface: "oklch(0.976 0.003 265)",
      surface2: "oklch(0.952 0.004 265)",
      hairline: "oklch(0.45 0.006 265 / 0.16)",
      accent: "oklch(0.30 0.01 265)",
      heroBg: "oklch(0.17 0.008 265)", // dark hero, matches planhat.com
      heroText: "oklch(0.97 0.002 265)",
      radiusCard: "16px",
      radiusBtn: "19px",
      shadow: "0 10px 30px oklch(0.18 0.01 265 / 0.12)",
    },
    // Monochrome tiers (faithful to Planhat's editorial mono brand).
    roleTone: {
      CHAMPION: "oklch(0.30 0.006 265)",
      PRIMARY: "oklch(0.18 0.006 265)", // darkest = the owner
      OPS: "oklch(0.46 0.006 265)",
      ECONOMIC: "oklch(0.38 0.006 265)",
      ESCALATION: "oklch(0.50 0.006 265)", // text-safe on white
    },
  },
};

// Fallback kit for any client without a hand-tuned BRAND_KITS entry or a <client>-brand.json.
// Clean product register: white body, dark hero, one blue accent, contrast-tuned tones.
const NEUTRAL_DEFAULT = {
  label: "default",
  googleFonts:
    "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap",
  displayFont: "'Hanken Grotesk', system-ui, sans-serif",
  bodyFont: "'Hanken Grotesk', system-ui, sans-serif",
  heroDark: true,
  tokens: {
    brand: "oklch(0.55 0.15 250)", brandStrong: "oklch(0.47 0.15 250)", onBrand: "oklch(1 0 0)",
    brandText: "oklch(0.47 0.15 250)",
    ink: "oklch(0.20 0.01 260)", inkSoft: "oklch(0.44 0.008 260)", inkFaint: "oklch(0.50 0.008 260)",
    bg: "oklch(1 0 0)", surface: "oklch(0.975 0.004 260)", surface2: "oklch(0.95 0.005 260)",
    hairline: "oklch(0.45 0.008 260 / 0.16)", accent: "oklch(0.70 0.13 250)",
    heroBg: "oklch(0.18 0.012 260)", heroText: "oklch(0.97 0.003 260)",
    radiusCard: "14px", radiusBtn: "999px",
    shadow: "0 12px 32px oklch(0.20 0.02 260 / 0.10)",
  },
  roleTone: {
    CHAMPION: "oklch(0.50 0.14 250)", PRIMARY: "oklch(0.44 0.15 250)",
    OPS: "oklch(0.46 0.008 260)", ECONOMIC: "oklch(0.34 0.01 260)", ESCALATION: "oklch(0.50 0.008 260)",
  },
};

// Resolve a client's brand kit: a <client>-brand.json override wins, then a built-in BRAND_KITS
// entry, then the neutral default. Extract a kit for a new client with Potter inspect_styles.
function resolveKit(client, dir) {
  const brandPath = path.join(dir, `${client}-brand.json`);
  if (fs.existsSync(brandPath)) {
    try {
      const k = JSON.parse(fs.readFileSync(brandPath, "utf8"));
      console.log(`[${client}] brand kit from ${client}-brand.json`);
      return k;
    } catch (e) {
      console.warn(`[${client}] ${client}-brand.json unreadable (${e.message}); falling back`);
    }
  }
  if (BRAND_KITS[client]) return BRAND_KITS[client];
  console.warn(
    `[${client}] no brand kit; using the neutral default. For an on-brand site, extract the kit with Potter ` +
      `(potter_browser_inspect_styles) into ${client}-brand.json, or add a BRAND_KITS entry.`
  );
  return NEUTRAL_DEFAULT;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function initials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function fileToDataUri(p) {
  try {
    const buf = fs.readFileSync(p);
    const ext = path.extname(p).slice(1).toLowerCase();
    const mime = ext === "jpg" ? "jpeg" : ext;
    return `data:image/${mime};base64,${buf.toString("base64")}`;
  } catch (e) {
    console.warn(`  ! could not read image ${p}: ${e.message}`);
    return null;
  }
}

function fetchDataUri(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
        },
        timeout: 15000,
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return resolve(fetchDataUri(res.headers.location));
        }
        if (res.statusCode !== 200) {
          console.warn(`  ! photo ${res.statusCode} for ${url.slice(0, 60)}...`);
          res.resume();
          return resolve(null);
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          const mime = (res.headers["content-type"] || "image/jpeg").split(";")[0];
          resolve(`data:${mime};base64,${buf.toString("base64")}`);
        });
      }
    );
    req.on("timeout", () => {
      req.destroy();
      console.warn(`  ! photo timeout for ${url.slice(0, 60)}...`);
      resolve(null);
    });
    req.on("error", (e) => {
      console.warn(`  ! photo error: ${e.message}`);
      resolve(null);
    });
  });
}

// ---------------------------------------------------------------------------
// Section renderers
// ---------------------------------------------------------------------------
function avatar(member) {
  if (member._photo) {
    return `<img class="face" src="${member._photo}" alt="${esc(member.name)}" loading="lazy" width="64" height="64">`;
  }
  return `<span class="face face--initials" aria-hidden="true">${esc(initials(member.name))}</span>`;
}

function memberCard(m, i) {
  return `
    <article class="member" data-role="${esc(m.role)}" style="--tone:${m._tone}" data-reveal>
      <header class="member__head">
        <a class="member__face-link" href="${esc(m.linkedin)}" target="_blank" rel="noopener" aria-label="${esc(m.name)} on LinkedIn">
          ${avatar(m)}
        </a>
        <div class="member__id">
          <span class="role-tag">${esc(m.role)}</span>
          <a class="member__name" href="${esc(m.linkedin)}" target="_blank" rel="noopener">${esc(m.name)}</a>
          <p class="member__title">${esc(m.title)}</p>
          <p class="member__send">${esc(m.send)}</p>
        </div>
      </header>
    </article>`;
}

function tierBlock(title, members) {
  return `
    <div class="tier">
      <span class="tier__label">${esc(title)}</span>
      <div class="tier__cards">${members.map(memberCard).join("")}</div>
    </div>`;
}

function gate(text) {
  return `<p class="gate" data-reveal><span class="gate__arrow" aria-hidden="true">&#8595;</span>${esc(text)}</p>`;
}

function painCard(p) {
  return `
    <article class="pain" data-reveal>
      <h3 class="pain__theme">${esc(p.theme.replace(/^#\d+\s*/, ""))}</h3>
      <blockquote class="pain__quote">${esc(p.quote)}</blockquote>
      <p class="pain__source">Source: ${esc(p.source)}</p>
      <p class="pain__fit">${esc(p.fit)}</p>
    </article>`;
}

function evidenceCard(shot) {
  if (!shot._img) return "";
  return `
    <figure class="shot" data-reveal>
      <img src="${shot._img}" alt="Loom player embedded on ${esc(shot.caption)}" loading="lazy">
      <figcaption>${esc(shot.caption)}</figcaption>
    </figure>`;
}

function stepRow(s) {
  return `<li class="step"><span class="step__day">${esc(s.day)}</span><span class="step__text">${esc(s.text)}</span></li>`;
}

function phaseBlock(ph) {
  if (ph.branch) {
    return `
      <section class="phase phase--branch" data-reveal>
        <h3 class="phase__name">${esc(ph.phase)}</h3>
        <div class="branch">
          <div class="branch__arm branch__arm--if">
            <span class="branch__tag">IF</span>
            <p class="branch__cond">${esc(ph.branch.if)}</p>
            <p class="branch__do">${esc(ph.branch.then)}</p>
          </div>
          <div class="branch__arm branch__arm--else">
            <span class="branch__tag branch__tag--else">ELSE</span>
            <p class="branch__do">${esc(ph.branch.else)}</p>
          </div>
        </div>
      </section>`;
  }
  return `
    <section class="phase" data-reveal>
      <h3 class="phase__name">${esc(ph.phase)}</h3>
      <ol class="steps">${ph.steps.map(stepRow).join("")}</ol>
    </section>`;
}

function dmCard(m, idx) {
  return `
    <article class="dm" style="--tone:${m._tone}" data-reveal>
      <header class="dm__head">
        <span class="dm__num" aria-hidden="true">${idx + 1}</span>
        ${avatar(m)}
        <div class="dm__who">
          <span class="dm__name">${esc(m.name)}</span>
          <span class="dm__meta"><span class="role-tag role-tag--sm">${esc(m.role)}</span> ${esc(m.send)}</span>
        </div>
      </header>
      <p class="dm__body">${esc(m.dm)}</p>
    </article>`;
}

// ---------------------------------------------------------------------------
// Page template
// ---------------------------------------------------------------------------
function renderHtml(a, kit) {
  const t = kit.tokens;
  const byRole = (r) => a.committee.filter((m) => m.role === r);
  const entry = [...byRole("CHAMPION"), ...byRole("PRIMARY")];
  const escalate = [...byRole("OPS"), ...byRole("ECONOMIC")];
  const last = byRole("ESCALATION");
  const dmsInOrder = [...a.committee].sort((x, y) => (x.order || 0) - (y.order || 0));

  const css = `
  :root {
    --brand:${t.brand}; --brand-strong:${t.brandStrong}; --on-brand:${t.onBrand}; --brand-text:${t.brandText};
    --ink:${t.ink}; --ink-soft:${t.inkSoft}; --ink-faint:${t.inkFaint};
    --bg:${t.bg}; --surface:${t.surface}; --surface-2:${t.surface2}; --hairline:${t.hairline};
    --accent:${t.accent};
    --radius-card:${t.radiusCard}; --radius-btn:${t.radiusBtn};
    --shadow:${t.shadow};
    --measure:60ch;
    --ease:cubic-bezier(0.16,1,0.3,1);
    --z-sticky:20;
    --display:${kit.displayFont}; --body:${kit.bodyFont};
    color-scheme: light;
  }
  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body {
    margin: 0; background: var(--bg); color: var(--ink);
    font-family: var(--body); font-weight: 400; line-height: 1.6;
    font-size: 17px; -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  .wrap { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
  a { color: inherit; }
  h1,h2,h3 { font-family: var(--display); line-height: 1.06; margin: 0; text-wrap: balance; letter-spacing: -0.02em; }
  p { margin: 0; }

  /* Hero */
  .hero {
    ${kit.heroDark ? `background:${t.heroBg}; color:${t.heroText};` : `background:var(--bg); color:${t.heroText};`}
    padding: clamp(56px, 9vw, 104px) 0 clamp(40px, 6vw, 64px);
    ${kit.heroDark ? "" : "border-bottom: 1px solid var(--hairline);"}
  }
  .hero h1 { font-size: clamp(2.6rem, 6vw, 4.4rem); font-weight: 800; }
  .hero__tagline { margin-top: 14px; font-size: clamp(1.05rem, 2vw, 1.3rem); max-width: 40ch;
    color: ${kit.heroDark ? "oklch(0.82 0.01 265)" : "var(--ink-soft)"}; }
  .hero__evidence {
    margin-top: 28px; display: inline-flex; align-items: baseline; gap: 10px; flex-wrap: wrap; max-width: 54ch;
    font-family: var(--body); font-size: 0.95rem;
    color: ${kit.heroDark ? "oklch(0.78 0.01 265)" : "var(--ink-soft)"};
    border-top: 1px solid ${kit.heroDark ? "oklch(0.82 0.01 265 / 0.2)" : "var(--hairline)"};
    padding-top: 18px;
  }
  .hero__evidence b { color: ${kit.heroDark ? "var(--on-brand)" : "var(--ink)"}; font-weight: 600; }

  section.band { padding: clamp(48px, 7vw, 88px) 0; }
  .band--alt { background: var(--surface); }
  .eyebrow { font-family: var(--body); font-size: 0.8rem; font-weight: 600; letter-spacing: 0.02em;
    color: var(--brand-text); text-transform: none; margin-bottom: 14px; }
  .section-title { font-size: clamp(1.7rem, 3.4vw, 2.4rem); font-weight: 700; max-width: 22ch; }
  .section-intro { margin-top: 12px; color: var(--ink-soft); max-width: var(--measure); }

  /* Pains */
  .pains { margin-top: 36px; display: grid; gap: 20px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr)); }
  .pain { background: var(--bg); border: 1px solid var(--hairline); border-radius: var(--radius-card);
    padding: 28px; }
  .band--alt .pain { background: var(--bg); }
  .pain__theme { font-family: var(--body); font-size: 1.12rem; font-weight: 700; color: var(--ink); }
  .pain__quote { margin: 14px 0 0; padding-left: 16px; border-left: 2px solid var(--brand);
    font-style: italic; color: var(--ink); }
  .pain__source { margin-top: 10px; font-size: 0.82rem; color: var(--ink-faint); }
  .pain__fit { margin-top: 16px; color: var(--ink-soft); font-size: 0.96rem; }

  /* Evidence */
  .shots { margin-top: 36px; display: grid; gap: 22px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); }
  .shot { margin: 0; background: var(--bg); border: 1px solid var(--hairline); border-radius: var(--radius-card);
    overflow: hidden; }
  .shot img { display: block; width: 100%; height: auto; border-bottom: 1px solid var(--hairline); }
  .shot figcaption { padding: 12px 16px; font-size: 0.8rem; color: var(--ink-faint);
    font-family: var(--body); word-break: break-word; }

  /* Committee thread flow */
  .flow { margin-top: 40px; display: flex; flex-direction: column; align-items: stretch; gap: 8px; }
  .tier { }
  .tier__label { display: block; font-size: 0.78rem; font-weight: 600; letter-spacing: 0.06em;
    text-transform: uppercase; color: var(--ink-faint); margin: 0 0 12px 2px; }
  .tier__cards { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); }
  .member { position: relative; background: var(--surface); border: 1px solid var(--hairline);
    border-radius: var(--radius-card); padding: 18px 18px 18px 22px;
    box-shadow: inset 4px 0 0 0 var(--tone);
    transition: transform var(--dur,220ms) var(--ease), box-shadow var(--dur,220ms) var(--ease); }
  .band--alt .member { background: var(--bg); }
  @media (hover:hover) and (pointer:fine) { .member:hover { transform: translateY(-2px); box-shadow: inset 4px 0 0 0 var(--tone), var(--shadow); } }
  .member__head { display: flex; gap: 14px; align-items: flex-start; }
  .face { width: 56px; height: 56px; border-radius: 999px; object-fit: cover; display: block;
    border: 2px solid var(--bg); box-shadow: 0 0 0 1px var(--hairline); }
  .face--initials { width: 56px; height: 56px; border-radius: 999px; display: grid; place-items: center;
    background: var(--tone); color: var(--on-brand); font-family: var(--display); font-weight: 700; font-size: 1.1rem; }
  .member__face-link { display: block; flex: none; border-radius: 999px; }
  .member__face-link:focus-visible { outline: 2px solid var(--brand); outline-offset: 3px; }
  .member__id { min-width: 0; }
  .role-tag { display: inline-block; font-size: 0.66rem; font-weight: 700; letter-spacing: 0.05em;
    color: var(--tone); border: 1px solid color-mix(in oklch, var(--tone) 35%, transparent);
    border-radius: 999px; padding: 2px 9px; margin-bottom: 7px; }
  .role-tag--sm { margin: 0; }
  .member__name { display: block; font-family: var(--display); font-size: 1.16rem; font-weight: 700;
    color: var(--ink); text-decoration: none; }
  .member__name:hover { text-decoration: underline; text-underline-offset: 3px; }
  .member__title { margin-top: 3px; font-size: 0.9rem; color: var(--ink-soft); }
  .member__send { margin-top: 8px; font-size: 0.8rem; color: var(--ink-faint); }
  .gate { display: flex; align-items: center; justify-content: center; gap: 10px; text-align: center;
    margin: 6px auto; padding: 10px 18px; font-size: 0.9rem; color: var(--ink-soft);
    font-family: var(--body); max-width: 60ch; }
  .gate__arrow { color: var(--brand-text); font-size: 1.1rem; }

  /* Sequence */
  .seq { margin-top: 36px; display: grid; gap: 16px; }
  .phase { background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--radius-card); padding: 22px 24px; }
  .band--alt .phase { background: var(--bg); }
  .phase__name { font-family: var(--display); font-size: 1.05rem; font-weight: 700; color: var(--ink); margin-bottom: 14px; }
  .steps { margin: 0; padding: 0; list-style: none; display: grid; gap: 12px; }
  .step { display: grid; grid-template-columns: 96px 1fr; gap: 16px; align-items: baseline; }
  .step__day { font-family: var(--body); font-weight: 600; font-size: 0.82rem; color: var(--brand-text); }
  .step__text { color: var(--ink-soft); max-width: var(--measure); }
  .phase--branch { background: var(--surface-2); }
  .band--alt .phase--branch { background: var(--surface); }
  .branch { display: grid; gap: 16px; grid-template-columns: 1fr 1fr; }
  .branch__arm { background: var(--bg); border: 1px solid var(--hairline); border-radius: 12px; padding: 16px 18px; }
  .branch__tag { display: inline-block; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em;
    color: var(--on-brand); background: var(--brand-strong); border-radius: 6px; padding: 2px 8px; }
  .branch__tag--else { background: var(--ink-faint); }
  .branch__cond { margin-top: 10px; font-weight: 600; color: var(--ink); }
  .branch__do { margin-top: 8px; color: var(--ink-soft); font-size: 0.95rem; }

  /* DMs */
  .dms { margin-top: 36px; display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr)); }
  .dm { background: var(--bg); border: 1px solid var(--hairline); border-radius: var(--radius-card); padding: 22px 24px;
    box-shadow: inset 4px 0 0 0 var(--tone); }
  .band--alt .dm { background: var(--surface); }
  .dm__head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
  .dm__num { width: 26px; height: 26px; flex: none; border-radius: 999px; display: grid; place-items: center;
    background: var(--tone); color: var(--on-brand); font-weight: 700; font-size: 0.82rem; font-family: var(--body); }
  .dm .face, .dm .face--initials { width: 40px; height: 40px; font-size: 0.85rem; }
  .dm__who { display: grid; }
  .dm__name { font-family: var(--display); font-weight: 700; font-size: 1.02rem; }
  .dm__meta { font-size: 0.78rem; color: var(--ink-faint); display: inline-flex; gap: 7px; align-items: center; margin-top: 2px; }
  .dm__body { color: var(--ink); line-height: 1.62; max-width: var(--measure); }

  /* Footer */
  .foot { padding: 48px 0 64px; border-top: 1px solid var(--hairline); color: var(--ink-faint); font-size: 0.86rem; }
  .foot p { max-width: 60ch; margin-bottom: 10px; }
  .foot b { color: var(--ink-soft); font-weight: 600; }

  /* Motion: scroll reveal as a pure enhancement. Content is visible by default; the
     hide-then-reveal only applies once JS adds .reveal-on (and never under reduced motion),
     so headless renderers, no-JS clients, and hidden tabs still see every section. */
  .reveal-on [data-reveal] { opacity: 0; transform: translateY(14px); }
  .reveal-on [data-reveal].revealed { opacity: 1; transform: none;
    transition: opacity 560ms var(--ease), transform 560ms var(--ease); }
  @media (prefers-reduced-motion: reduce) {
    .reveal-on [data-reveal] { opacity: 1; transform: none; transition: none; }
    .member { transition: none; }
  }

  @media (max-width: 720px) {
    .step { grid-template-columns: 1fr; gap: 2px; }
    .branch { grid-template-columns: 1fr; }
  }`;

  const js = `
  (function(){
    var els = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach(function(el){ el.classList.add('revealed'); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function(el){ io.observe(el); });
  })();`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(a.account)} : buyer-committee ABM play</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${kit.googleFonts}">
<style>${css}</style>
<script>if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('reveal-on');}</script>
</head>
<body>
<header class="hero">
  <div class="wrap">
    <h1>${esc(a.account)}</h1>
    <p class="hero__tagline">${esc(a.tagline)}</p>
    <p class="hero__evidence">${esc(a.evidence)}</p>
  </div>
</header>

<section class="band">
  <div class="wrap">
    <p class="eyebrow">Matched Loom pain, industry context</p>
    <h2 class="section-title">Where ${esc(a.account)} is exposed</h2>
    <p class="section-intro">General, public Loom complaints, cited as industry context and never as words put in anyone's mouth.</p>
    <div class="pains">${a.pains.map(painCard).join("")}</div>
  </div>
</section>

<section class="band band--alt">
  <div class="wrap">
    <p class="eyebrow">Proof, Loom in the help center</p>
    <h2 class="section-title">Real embeds, captured live</h2>
    <div class="shots">${a.evidenceShots.map(evidenceCard).join("")}</div>
  </div>
</section>

<section class="band">
  <div class="wrap">
    <p class="eyebrow">Buyer committee, ${esc(a.csTerm)}</p>
    <h2 class="section-title">A 30-day, signal-driven multi-thread</h2>
    <p class="section-intro">Champion first, escalate only on a real signal, CEO last. Faces link to LinkedIn.</p>
    <div class="flow">
      ${tierBlock("Entry, where the play starts", entry)}
      ${gate("Escalate only on a reply or clear engagement (Week 3)")}
      ${tierBlock("Escalate, only on a signal", escalate)}
      ${gate("Only if a thread is genuinely warm (Week 4)")}
      ${tierBlock("Last, escalation only", last)}
    </div>
  </div>
</section>

<section class="band band--alt">
  <div class="wrap">
    <p class="eyebrow">The play, day by day</p>
    <h2 class="section-title">30-day sequence</h2>
    ${a.sequenceNote ? `<p class="section-intro">${esc(a.sequenceNote)}</p>` : ""}
    <div class="seq">${a.sequence.map(phaseBlock).join("")}</div>
  </div>
</section>

<section class="band">
  <div class="wrap">
    <p class="eyebrow">The messages, draft only, in send order</p>
    <h2 class="section-title">Tailored DMs</h2>
    <p class="section-intro">Plain text, nothing sent, nothing enrolled. Each opens on the matched pain as industry context and pitches the alternative.</p>
    <div class="dms">${dmsInOrder.map(dmCard).join("")}</div>
  </div>
</section>

<footer class="foot">
  <div class="wrap">
    <p>Committee mapped with <b>potter_find_decision_maker</b> across three role lenses, deduped, classified by title. The actor returns the top 25 employees per company, so for orgs above roughly 1,000 headcount widen with web search before trusting completeness.</p>
    <p>${a.rules.map((r) => esc(r)).join(" &middot; ")}</p>
    <p><b>Read-only research. Draft only. Nothing is sent, nothing is enrolled.</b></p>
  </div>
</footer>
<script>${js}</script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function buildOne(client) {
  const dir = path.join(OUT_DIR, client);
  fs.mkdirSync(dir, { recursive: true });
  const kit = resolveKit(client, dir);
  const frozenClient = path.join(__dirname, "..", "frozen", client);
  let jsonPath = path.join(dir, `${client}-account.json`);
  if (!fs.existsSync(jsonPath) && fs.existsSync(path.join(frozenClient, "account.json"))) {
    jsonPath = path.join(frozenClient, "account.json");
    console.log(`[${client}] using frozen account.json (deterministic, no live data)`);
  }
  const a = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  console.log(`[${client}] embedding ${a.committee.length} photos + ${a.evidenceShots.length} evidence shots...`);
  for (const m of a.committee) {
    m._tone = kit.roleTone[m.role] || kit.tokens.inkSoft;
    m._photo = await fetchDataUri(m.photo);
  }
  for (const s of a.evidenceShots) {
    let p = path.join(dir, s.file);
    if (!fs.existsSync(p)) {
      const fp = path.join(frozenClient, s.file);
      if (fs.existsSync(fp)) p = fp;
    }
    s._img = fileToDataUri(p);
  }

  const html = renderHtml(a, kit);
  const outPath = path.join(dir, `${client}-site.html`);
  fs.writeFileSync(outPath, html);
  const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
  console.log(`[${client}] DONE -> ${outPath} (${kb} KB)`);
}

(async () => {
  const clients = process.argv.slice(2);
  if (!clients.length) {
    console.error("usage: node scripts/build-account-site.js <client> [client...]");
    process.exit(1);
  }
  for (const c of clients) {
    try {
      await buildOne(c);
    } catch (e) {
      console.error(`[${c}] FAILED: ${e.message}`);
      process.exit(1);
    }
  }
})();
