// Generates the social card for every public route: `npm run og`.
//
// Why a script instead of a design tool: the cards are built from the same data the pages render —
// an employee's name, role and tagline, a guide's title and reading time, a route's title and
// description — so a rename cannot leave a card showing the old copy. The output is committed under
// `public/og/`, which means the Vercel build never needs the rasteriser or the fonts.
//
// Requirements: `sharp` (devDependency, prebuilt binary). Fonts live in `scripts/og/fonts` and are
// registered through a generated fontconfig file, because librsvg resolves families through
// fontconfig rather than from the SVG.
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fontsDir = path.join(root, 'scripts/og/fonts');

// Point fontconfig at the two brand faces before sharp spins up its renderer.
const confPath = path.join(root, 'scripts/og/.fonts.conf');
await writeFile(
  confPath,
  `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${fontsDir}</dir>
  <cachedir>${path.join(root, 'scripts/og/.fontcache')}</cachedir>
</fontconfig>
`,
);
process.env.FONTCONFIG_FILE = confPath;

const { default: sharp } = await import('sharp');
const { publicRoutes } = await import('../src/data/routes.ts');
const { employees } = await import('../src/data/employees.ts');
const { guides } = await import('../src/data/resources.ts');

const W = 1200;
const H = 630;
const PAD = 72;

const INK = '#051718';
const WHITE = '#eef7f5';
const MUTED = '#b9c9cf';
const MINT = '#9df7c2';
const EMERALD = '#0bd39a';

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Approximate advance width in em, by character class. Exact metrics would mean shipping a text
 * shaper; this is close enough that the fit lines break where a designer would break them, and every
 * card is eyeballed once after generation.
 */
function advance(ch) {
  if (ch === ' ') return 0.27;
  if ('iljt.,;:\'!|'.includes(ch)) return 0.28;
  if ('fr()[]-"'.includes(ch)) return 0.36;
  if ('mwMW@%'.includes(ch)) return 0.86;
  if (ch >= 'A' && ch <= 'Z') return 0.68;
  if (ch >= '0' && ch <= '9') return 0.62;
  return 0.53;
}

/**
 * Per-family safety factor on the estimate above. Calibrated by rendering sample lines with sharp,
 * trimming to the ink box and comparing: Sora's geometric caps run ~7–13% wider than the table
 * predicts, Inter ~7%. Erring wide costs an early line break; erring narrow puts text off the card,
 * which is how the first version of the guide card shipped a cropped headline.
 */
const SAFETY = { Sora: 1.14, Inter: 1.09 };

const widthOf = (text, size, tracking = 0, family = 'Inter') =>
  ([...text].reduce((sum, ch) => sum + advance(ch) * size, 0) + tracking * [...text].length) *
  (SAFETY[family] ?? 1.1);

function wrap(text, maxWidth, size, tracking = 0, family = 'Inter') {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (widthOf(candidate, size, tracking, family) <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Shrinks until the text fits both the width and the line budget, then wraps for good. */
function fit(text, { maxWidth, maxLines, size, minSize = 34, tracking = 0, family = 'Inter' }) {
  let current = size;
  let lines = wrap(text, maxWidth, current, tracking, family);

  while (
    (lines.length > maxLines || lines.some((l) => widthOf(l, current, tracking, family) > maxWidth)) &&
    current > minSize
  ) {
    current -= 2;
    lines = wrap(text, maxWidth, current, tracking, family);
  }
  if (lines.length > maxLines) lines = lines.slice(0, maxLines);
  return { size: current, lines };
}

const textRow = (lines, { x, y, size, lineHeight, fill, family = 'Inter', weight = 400, tracking = 0 }) =>
  lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * lineHeight}" font-family="${family}" font-weight="${weight}" ` +
        `font-size="${size}" fill="${fill}"${tracking ? ` letter-spacing="${tracking}"` : ''}>${escapeXml(line)}</text>`,
    )
    .join('\n  ');

/** Canvas, grid, glow and the NEXORA mark — shared by every card. */
function backdrop() {
  return `
  <defs>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    </pattern>
    <radialGradient id="glow" cx="82%" cy="6%" r="72%">
      <stop offset="0%" stop-color="${EMERALD}" stop-opacity="0.30"/>
      <stop offset="45%" stop-color="${EMERALD}" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="${EMERALD}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="4%" cy="98%" r="60%">
      <stop offset="0%" stop-color="#12e3c0" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#12e3c0" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${EMERALD}"/>
      <stop offset="100%" stop-color="${EMERALD}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${INK}"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" fill="url(#glow2)"/>
  <rect y="${H - 4}" width="${W}" height="4" fill="url(#rule)" opacity="0.5"/>`;
}

const wordmark = (y) =>
  `<text x="${PAD}" y="${y}" font-family="Sora" font-weight="600" font-size="19" ` +
  `fill="${MINT}" letter-spacing="6.5">NEXORA</text>`;

const eyebrow = (y, text) =>
  `<text x="${PAD}" y="${y}" font-family="Inter" font-weight="400" font-size="17" ` +
  `fill="${MUTED}" letter-spacing="3.2">${escapeXml(text.toUpperCase())}</text>`;

/** Height of the ink in a text block, measured from the first line's cap to the last baseline. */
const inkHeight = (lines, size, leading) => (lines - 1) * size * leading + size * 0.82;

/** The area a card's copy may occupy: clear of the wordmark above and the rule below. */
const REGION = { top: 150, bottom: 570 };

/** Slack to put above a block of `height`, so the composition sits in the middle of REGION. */
const centredTop = (height) => REGION.top + Math.max(0, (REGION.bottom - REGION.top - height) / 2);

function defaultCard(entry) {
  const title = fit(entry.title, { maxWidth: W - PAD * 2, maxLines: 3, size: 84, minSize: 46, family: 'Sora' });
  const body = fit(entry.description, { maxWidth: W - PAD * 2 - 60, maxLines: 2, size: 27, minSize: 22 });

  // The wordmark sits at the top and the rule at the bottom, so the text block is centred in what
  // is left. Top-aligning it left a third of the card empty underneath, which read as a mistake.
  const titleHeight = inkHeight(title.lines.length, title.size, 1.16);
  const bodyHeight = inkHeight(body.lines.length, body.size, 1.5);
  const gap = 44;
  const blockTop = centredTop(titleHeight + gap + bodyHeight);

  const titleY = Math.round(blockTop + title.size * 0.82);
  const bodyY = Math.round(titleY + (title.lines.length - 1) * title.size * 1.16 + gap + body.size * 0.82);

  return `${backdrop()}
  ${wordmark(104)}
  ${textRow(title.lines, {
    x: PAD,
    y: titleY,
    size: title.size,
    lineHeight: title.size * 1.16,
    fill: WHITE,
    family: 'Sora',
    weight: 600,
    tracking: -0.5,
  })}
  ${textRow(body.lines, { x: PAD, y: bodyY, size: body.size, lineHeight: body.size * 1.5, fill: MUTED })}`;
}

function employeeCard(entry, employee) {
  const portrait = 372;
  const px = W - PAD - portrait;
  const py = (H - portrait) / 2;
  const textWidth = px - PAD - 56;

  const name = fit(employee.name, { maxWidth: textWidth, maxLines: 1, size: 82, minSize: 46, family: 'Sora' });
  const role = fit(employee.role, { maxWidth: textWidth, maxLines: 2, size: 32, minSize: 22 });
  const tagline = fit(employee.tagline, { maxWidth: textWidth, maxLines: 2, size: 25, minSize: 20 });

  const nameY = 262;
  const roleY = nameY + name.size * 0.98 + 14;
  const taglineY = roleY + (role.lines.length - 1) * role.size * 1.28 + role.size * 0.98 + 26;

  return `${backdrop()}
  <circle cx="${px + portrait / 2}" cy="${py + portrait / 2}" r="${portrait / 2 + 14}" fill="none" stroke="${EMERALD}" stroke-opacity="0.28" stroke-width="1.5"/>
  <circle cx="${px + portrait / 2}" cy="${py + portrait / 2}" r="${portrait / 2}" fill="none" stroke="${MINT}" stroke-opacity="0.5" stroke-width="2"/>
  ${wordmark(104)}
  ${eyebrow(150, `AI employee · ${employee.department}`)}
  ${textRow(name.lines, {
    x: PAD,
    y: nameY,
    size: name.size,
    lineHeight: name.size * 1.12,
    fill: WHITE,
    family: 'Sora',
    weight: 600,
    tracking: -0.5,
  })}
  ${textRow(role.lines, { x: PAD, y: roleY, size: role.size, lineHeight: role.size * 1.32, fill: MINT })}
  ${textRow(tagline.lines, { x: PAD, y: taglineY, size: tagline.size, lineHeight: tagline.size * 1.45, fill: MUTED })}
  ${entry ? '' : ''}`;
}

function guideCard(entry, guide) {
  const title = fit(entry.title, { maxWidth: W - PAD * 2, maxLines: 3, size: 62, minSize: 38, family: 'Sora' });
  const summary = fit(entry.description, { maxWidth: W - PAD * 2 - 80, maxLines: 2, size: 26, minSize: 20 });

  // The category/read-time line belongs to the title, so the block starts at the eyebrow.
  const eyebrowGap = 64;
  const titleHeight = inkHeight(title.lines.length, title.size, 1.16);
  const summaryHeight = inkHeight(summary.lines.length, summary.size, 1.5);
  const gap = 40;
  const eyebrowY = Math.round(centredTop(eyebrowGap + titleHeight + gap + summaryHeight));
  const titleY = eyebrowY + eyebrowGap;
  const summaryY = Math.round(titleY + (title.lines.length - 1) * title.size * 1.16 + gap + summary.size * 0.82);

  return `${backdrop()}
  ${wordmark(104)}
  ${eyebrow(eyebrowY, `${guide.category} · ${guide.readTime}`)}
  ${textRow(title.lines, {
    x: PAD,
    y: titleY,
    size: title.size,
    lineHeight: title.size * 1.16,
    fill: WHITE,
    family: 'Sora',
    weight: 600,
    tracking: -0.4,
  })}
  ${textRow(summary.lines, { x: PAD, y: summaryY, size: summary.size, lineHeight: summary.size * 1.5, fill: MUTED })}`;
}

/** Every card fragment is the inside of one 1200x630 SVG; this wraps it. */
const page = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`;

const bySlug = new Map(employees.map((employee) => [employee.slug, employee]));
const guideBySlug = new Map(guides.map((guide) => [guide.slug, guide]));

const outDir = path.join(root, 'public/og');
await mkdir(outDir, { recursive: true });

let written = 0;

for (const entry of publicRoutes) {
  let svg;
  let portrait = null;

  if (entry.card === 'employee') {
    const employee = bySlug.get(entry.path.split('/').pop());
    if (!employee) throw new Error(`No employee for ${entry.path}`);
    svg = employeeCard(entry, employee);
    portrait = path.join(root, 'public', employee.avatar.replace(/^\//, ''));
  } else if (entry.card === 'guide') {
    const guide = guideBySlug.get(entry.path.split('/').pop());
    if (!guide) throw new Error(`No guide for ${entry.path}`);
    svg = guideCard(entry, guide);
  } else {
    svg = defaultCard(entry);
  }

  let image = sharp(Buffer.from(page(svg)));

  if (portrait) {
    const size = 372;
    const mask = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
    );
    const photo = await sharp(portrait)
      .resize(size, size, { fit: 'cover', position: 'attention' })
      .composite([{ input: mask, blend: 'dest-in' }])
      .png()
      .toBuffer();

    image = image.composite([
      { input: photo, top: Math.round((H - size) / 2), left: W - PAD - size },
    ]);
  }

  const file = path.join(root, 'public', entry.image.replace(/^\//, ''));
  await mkdir(path.dirname(file), { recursive: true });
  await image.png({ compressionLevel: 9, palette: true }).toFile(file);
  written += 1;
}

console.log(`og: ${written} cards written to public/og/`);
