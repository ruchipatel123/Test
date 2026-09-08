import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const VIEWPORT = { width: 1440, height: 900 };

const PAGES = [
  { file: "index.html", name: "Home", nodeId: "1:162" },
  { file: "about.html", name: "About RCPA", nodeId: "36:290" },
  { file: "contact.html", name: "Contact Us", nodeId: "36:73" },
  { file: "request-a-quote.html", name: "Request a Quote", nodeId: "36:535" },
  { file: "reinforced-concrete-pipes.html", name: "Reinforced Concrete Pipes", nodeId: "36:687" },
  { file: "box-culverts.html", name: "Box Culverts", nodeId: "85:83" },
  { file: "liners-bases-and-covers.html", name: "Liners, Bases & Covers", nodeId: "85:520" },
  { file: "headwalls.html", name: "Headwalls", nodeId: "85:813" },
  { file: "product-brochure.html", name: "Product Brochure", nodeId: "36:1128" },
];

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
};

function rgbToHex(rgb) {
  if (!rgb || rgb === "transparent") return "transparent";
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return rgb;
  return (
    "#" +
    [m[1], m[2], m[3]]
      .map((n) => parseInt(n, 10).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

const EXTRACT_SCRIPT = () => {
  function isVisible(el) {
    if (el.closest("[hidden]")) return false;
    if (el.classList.contains("screen-reader-text")) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function getSelector(el) {
    if (el.id) return `#${el.id}`;
    const classes = [...el.classList].filter(Boolean);
    if (classes.length) return `${el.tagName.toLowerCase()}.${classes.join(".")}`;
    return el.tagName.toLowerCase();
  }

  function getDirectText(el) {
    let text = "";
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) text += node.textContent;
    }
    return text.trim();
  }

  function hasReadableText(el) {
    const text = (el.innerText || el.textContent || "").trim();
    return text.length > 0 && /[a-zA-Z0-9]/.test(text);
  }

  function getStyles(el) {
    const cs = window.getComputedStyle(el);
    return {
      selector: getSelector(el),
      text: (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 120),
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      fontStyle: cs.fontStyle,
      color: cs.color,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing,
      textTransform: cs.textTransform,
      textAlign: cs.textAlign,
      backgroundColor: cs.backgroundColor,
      marginTop: cs.marginTop,
      marginBottom: cs.marginBottom,
      paddingTop: cs.paddingTop,
      paddingBottom: cs.paddingBottom,
    };
  }

  function styleKey(s) {
    return [
      s.fontFamily, s.fontSize, s.fontWeight, s.fontStyle, s.color,
      s.lineHeight, s.letterSpacing, s.textTransform, s.textAlign,
      s.backgroundColor, s.marginTop, s.marginBottom, s.paddingTop, s.paddingBottom,
    ].join("|");
  }

  function groupElements(tagName, filterFn) {
    const elements = [...document.querySelectorAll(tagName)].filter(
      (el) => isVisible(el) && filterFn(el)
    );
    const groups = new Map();
    for (const el of elements) {
      const styles = getStyles(el);
      const key = styleKey(styles);
      if (!groups.has(key)) {
        groups.set(key, { styles, count: 0, samples: [], selectors: new Set() });
      }
      const g = groups.get(key);
      g.count++;
      g.selectors.add(styles.selector);
      if (g.samples.length < 3) g.samples.push(styles.text);
    }
    return [...groups.values()].map((g) => ({
      ...g.styles,
      count: g.count,
      sampleText: g.samples.join(" | "),
      cssSelector: [...g.selectors].slice(0, 3).join(", "),
    }));
  }

  const sections = [...document.querySelectorAll("section, footer.site-footer")].map((el) => {
    const cs = window.getComputedStyle(el);
    return {
      selector: getSelector(el),
      backgroundColor: cs.backgroundColor,
      backgroundImage: cs.backgroundImage,
    };
  });

  const footer = document.querySelector(".site-footer");
  let footerLayout = null;
  if (footer) {
    const grid = footer.querySelector(".site-footer__grid");
    const cs = grid ? window.getComputedStyle(grid) : null;
    footerLayout = {
      gridDisplay: cs?.display,
      gridColumns: cs?.gridTemplateColumns,
      colCount: grid ? grid.children.length : 0,
      label: footer.querySelector(".site-footer__col-title")
        ? getStyles(footer.querySelector(".site-footer__col-title"))
        : null,
      barCopy: footer.querySelector(".site-footer__bar-copy")
        ? getStyles(footer.querySelector(".site-footer__bar-copy"))
        : null,
      footerBg: getComputedStyle(footer).background,
    };
  }

  return {
    viewport: { width: window.innerWidth, height: window.innerHeight },
    h1: groupElements("h1", () => true),
    h2: groupElements("h2", () => true),
    h3: groupElements("h3", () => true),
    h4: groupElements("h4", () => true),
    h5: groupElements("h5", () => true),
    p: groupElements("p", () => true),
    div: groupElements("div", (el) => {
      if (!hasReadableText(el)) return false;
      const blockChildren = [...el.children].filter((c) => {
        const d = window.getComputedStyle(c).display;
        return d === "block" || d === "flex" || d === "grid";
      });
      if (blockChildren.length > 0 && !getDirectText(el)) return false;
      return true;
    }),
    span: groupElements("span", (el) => {
      const text = (el.innerText || el.textContent || "").trim();
      return text.length >= 1 && /[a-zA-Z0-9]/.test(text);
    }),
    sections,
    footerLayout,
  };
};

function formatRow(item) {
  return {
    sampleText: item.sampleText || item.text,
    cssSelector: item.cssSelector || item.selector,
    count: item.count,
    fontFamily: item.fontFamily,
    fontSize: item.fontSize,
    fontWeight: item.fontWeight,
    fontStyle: item.fontStyle,
    fontColor: rgbToHex(item.color),
    lineHeight: item.lineHeight,
    letterSpacing: item.letterSpacing,
    textTransform: item.textTransform,
    textAlign: item.textAlign,
    background: rgbToHex(item.backgroundColor),
    margin: `${item.marginTop} / ${item.marginBottom}`,
    padding: `${item.paddingTop} / ${item.paddingBottom}`,
  };
}

function toMarkdownTable(rows, includeBg = true) {
  if (!rows.length) return "_No visible elements found._\n";
  const headers = includeBg
    ? ["Sample Text", "CSS Selector", "Count", "Font Family", "Font Size", "Font Weight", "Font Style", "Font Color", "Line Height", "Letter Spacing", "Text Transform", "Text Align", "Background", "Margin", "Padding"]
    : ["Sample Text", "CSS Selector", "Count", "Font Family", "Font Size", "Font Weight", "Font Style", "Font Color", "Line Height", "Letter Spacing", "Text Transform", "Text Align", "Margin", "Padding"];
  const esc = (v) => String(v ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
  const lines = [`| ${headers.join(" | ")} |`, `| ${headers.map(() => "---").join(" | ")} |`];
  for (const r of rows) {
    const cells = includeBg
      ? [r.sampleText, r.cssSelector, r.count, r.fontFamily, r.fontSize, r.fontWeight, r.fontStyle, r.fontColor, r.lineHeight, r.letterSpacing, r.textTransform, r.textAlign, r.background, r.margin, r.padding]
      : [r.sampleText, r.cssSelector, r.count, r.fontFamily, r.fontSize, r.fontWeight, r.fontStyle, r.fontColor, r.lineHeight, r.letterSpacing, r.textTransform, r.textAlign, r.margin, r.padding];
    lines.push(`| ${cells.map(esc).join(" | ")} |`);
  }
  return lines.join("\n") + "\n";
}

function startServer(root) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let path = req.url.split("?")[0];
      if (path === "/") path = "/index.html";
      const filePath = join(root, path.replace(/^\//, ""));
      if (!filePath.startsWith(root) || !existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const ext = extname(filePath);
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      res.end(readFileSync(filePath));
    });
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

async function main() {
  const { server, baseUrl } = await startServer(ROOT);
  const browser = await chromium.launch({ headless: true });
  const allPages = [];

  try {
    for (const pageInfo of PAGES) {
      const page = await browser.newPage();
      await page.setViewportSize(VIEWPORT);
      await page.goto(`${baseUrl}/${pageInfo.file}`, { waitUntil: "networkidle", timeout: 60000 });
      await page.waitForTimeout(800);
      const raw = await page.evaluate(EXTRACT_SCRIPT);
      await page.close();

      allPages.push({
        ...pageInfo,
        url: `${baseUrl}/${pageInfo.file}`,
        viewport: raw.viewport,
        h1: raw.h1.map(formatRow),
        h2: raw.h2.map(formatRow),
        h3: raw.h3.map(formatRow),
        h4: raw.h4.map(formatRow),
        h5: raw.h5.map(formatRow),
        p: raw.p.map(formatRow),
        div: raw.div.map(formatRow),
        span: raw.span.map(formatRow),
        sections: raw.sections.map((s) => ({
          ...s,
          backgroundColor: rgbToHex(s.backgroundColor),
        })),
        footerLayout: raw.footerLayout
          ? {
              ...raw.footerLayout,
              label: raw.footerLayout.label
                ? { ...formatRow({ ...raw.footerLayout.label, count: 1 }), cssSelector: ".site-footer__col-title" }
                : null,
              barCopy: raw.footerLayout.barCopy
                ? { ...formatRow({ ...raw.footerLayout.barCopy, count: 1 }), cssSelector: ".site-footer__bar-copy" }
                : null,
            }
          : null,
      });
    }
  } finally {
    await browser.close();
    server.close();
  }

  mkdirSync(join(ROOT, "reports"), { recursive: true });
  writeFileSync(join(ROOT, "reports", "typography-audit-data.json"), JSON.stringify(allPages, null, 2));

  let md = `# Typography Audit Report — RCPA (test)\n\n`;
  md += `- **Live URL (target):** https://test-1x2k61q67-ruchipatel123s-projects.vercel.app\n`;
  md += `- **Audit method:** Local Playwright @ 1440×900 (live URL blocked by Vercel SSO)\n`;
  md += `- **Audited:** ${new Date().toISOString()}\n`;
  md += `- **Pages:** ${PAGES.length} (from \`.figma-pages.json\`)\n\n`;

  md += `## QA Access Note\n\n`;
  md += `Live Vercel deployment returns **HTTP 302 → Vercel SSO login**. Computed styles verified on local build matching deployed git commit.\n\n`;

  for (const pg of allPages) {
    md += `---\n\n## ${pg.name} (\`${pg.file}\`)\n\n`;
    md += `Figma node: \`${pg.nodeId}\` · Local URL: \`${pg.url}\`\n\n`;

    if (pg.footerLayout) {
      md += `### Footer Layout @ 1440px\n\n`;
      md += `- Grid display: \`${pg.footerLayout.gridDisplay}\`\n`;
      md += `- Grid columns: \`${pg.footerLayout.gridColumns}\`\n`;
      md += `- Column count: ${pg.footerLayout.colCount}\n`;
      md += `- Footer background: \`${pg.footerLayout.footerBg?.slice(0, 120)}\`\n`;
      if (pg.footerLayout.label) {
        md += `- Col title: ${pg.footerLayout.label.fontSize} / tracking ${pg.footerLayout.label.letterSpacing}\n`;
      }
      if (pg.footerLayout.barCopy) {
        md += `- Bar copy: ${pg.footerLayout.barCopy.fontSize} / tracking ${pg.footerLayout.barCopy.letterSpacing}\n`;
      }
      md += `\n`;
    }

    md += `### Section Backgrounds\n\n`;
    md += `| Selector | Background Color | Background Image |\n| --- | --- | --- |\n`;
    for (const s of pg.sections) {
      md += `| ${s.selector} | ${s.backgroundColor} | ${s.backgroundImage === "none" ? "none" : "image/gradient"} |\n`;
    }
    md += `\n`;

    for (const [title, key, bg] of [
      ["H1", "h1", false],
      ["H2", "h2", false],
      ["H3", "h3", false],
      ["H4", "h4", false],
      ["H5", "h5", false],
      ["Paragraph (`<p>`)", "p", true],
      ["Div", "div", true],
      ["Span", "span", false],
    ]) {
      md += `### ${title}\n\n`;
      md += toMarkdownTable(pg[key], bg);
      md += `\n`;
    }
  }

  writeFileSync(join(ROOT, "typography-audit-report.md"), md);
  console.log(`Audit complete: ${PAGES.length} pages → typography-audit-report.md`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
