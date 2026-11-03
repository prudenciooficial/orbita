const { chromium } = require('playwright');
const mark = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${32 + 2 * pad} ${32 + 2 * pad}"><defs>
<linearGradient id="g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#8c7bff"/><stop offset=".5" stop-color="#5b4cf0"/><stop offset="1" stop-color="#22b8ec"/></linearGradient>
<linearGradient id="c" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse" gradientTransform="rotate(24 16 16)"><stop offset="0" stop-color="#8c7bff"/><stop offset=".5" stop-color="#5b4cf0"/><stop offset="1" stop-color="#22b8ec"/></linearGradient>
<linearGradient id="p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#d9d4ff"/></linearGradient></defs>
<rect width="32" height="32" rx="9.5" fill="url(#g)"/>
<g transform="rotate(-24 16 16)"><path d="M4.8,16 A11.2,3.7 0 0 1 27.2,16" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.6"/></g>
<circle cx="16" cy="16" r="5.8" fill="url(#p)"/>
<g transform="rotate(-24 16 16)"><path d="M4.8,16 A11.2,3.7 0 0 0 27.2,16" fill="none" stroke="url(#c)" stroke-width="3.8"/><path d="M4.8,16 A11.2,3.7 0 0 0 27.2,16" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><circle cx="4.97" cy="16.64" r="1.9" fill="#fff"/></g></svg>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const out = [[16, 'favicon-16x16.png', 0], [32, 'favicon-32x32.png', 0], [48, 'ico-48.png', 0], [192, 'android-chrome-192x192.png', 3], [512, 'android-chrome-512x512.png', 3], [303, 'favicon-303x303.png', 2.5]];
  for (const [size, name, pad] of out) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<html><body style="margin:0;background:transparent">${mark(pad).replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
    await p.screenshot({ path: '/out/' + name, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  }
  require('fs').writeFileSync('/out/orbita-mark.svg', mark(0));
  await b.close(); console.log('icons ok');
})();
