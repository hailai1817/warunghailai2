import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "out");

function inlineFonts(css, cssFile) {
  const cssDir = dirname(cssFile);
  return css.replace(/url\(\s*['"]?([^'")]+\.woff2)['"]?\s*\)/g, (_m, p) => {
    const file = resolve(cssDir, p);
    if (!existsSync(file)) return _m;
    const b64 = readFileSync(file).toString("base64");
    return `url(data:font/woff2;base64,${b64})`;
  });
}

function processHtml(htmlFile) {
  let html = readFileSync(htmlFile, "utf8");

  // Inline stylesheets so fonts (embedded as data: URIs) load on file://.
  html = html.replace(/<link[^>]*rel="stylesheet"[^>]*>/g, (linkTag) => {
    const m = linkTag.match(/href="([^"]+)"/);
    if (!m) return linkTag;
    const cssPath = resolve(dirname(htmlFile), m[1]);
    if (!existsSync(cssPath)) return linkTag;
    const css = inlineFonts(readFileSync(cssPath, "utf8"), cssPath);
    return `<style>${css}</style>`;
  });

  // Chrome blocks cross-origin (crossorigin) subresources on file://. The app
  // scripts load fine as plain classic scripts, so drop the attribute.
  html = html.replace(/\s+crossorigin(?:="")?/gi, "");

  // Fonts are now inline; remove redundant (and CORS-failing) preloads.
  html = html.replace(/<link[^>]*rel="preload"[^>]*as="font"[^>]*>/g, "");

  // Favicon must be relative or it resolves to the filesystem root.
  if (existsSync(join(out, "favicon.ico"))) {
    html = html.replace(/href="\/favicon\.ico[^"]*"/g, 'href="./favicon.ico"');
    html = html.replace(
      /\\"href\\":\\"\/favicon\.ico[^"]*\\"/g,
      '\\"href\\":\\"./favicon.ico\\"'
    );
  }

  writeFileSync(htmlFile, html);
  console.log("portable-export:", htmlFile.replace(root + "\\", ""));
}

for (const f of readdirSync(out)) {
  if (f.endsWith(".html")) processHtml(join(out, f));
}
console.log("portable-export: done");
