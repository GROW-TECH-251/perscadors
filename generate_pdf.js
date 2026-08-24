const fs = require("fs");
const path = require("path");
(async function () {
  try {
    const files = [
      "vercel_deployments_list.html",
      "vercel_deployment_detail.html",
      "vercel_build_logs.html",
      "vercel_api_test.html",
    ];
    let combined = `<!doctype html><html><head><meta charset="utf-8"><title>Vercel Audit PDF</title><style>body{font-family:Inter,Arial,Helvetica,sans-serif;margin:0;padding:0} .page{padding:24px;box-sizing:border-box;width:100%;height:297mm;} .page + .page{page-break-before:always}</style></head><body>`;
    for (const f of files) {
      const p = path.join(__dirname, f);
      if (!fs.existsSync(p)) {
        combined += `<div class="page"><h2>Missing file: ${f}</h2></div>`;
        continue;
      }
      const html = fs.readFileSync(p, "utf8");
      const m = html.match(/<body[^>]*>((.|\n|\r)*)<\/body>/i);
      const inner = m ? m[1] : html;
      combined += `<div class="page">${inner}</div>`;
    }
    combined += "</body></html>";
    const outPath = path.join(__dirname, "vercel_audit_combined.html");
    fs.writeFileSync(outPath, combined, "utf8");

    const puppeteer = require("puppeteer");
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto("file://" + outPath.replace(/\\/g, "/"), {
      waitUntil: "networkidle0",
    });
    const pdfPath = path.join(__dirname, "vercel_audit.pdf");
    await page.pdf({ path: pdfPath, format: "A4", printBackground: true });
    await browser.close();
    console.log("PDF generated at", pdfPath);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
