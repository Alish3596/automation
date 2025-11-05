import { chromium } from "@playwright/test";

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage();
  await page.goto("https://dash.ledgers.cloud");

  const inputs = await page.$$eval("input", els =>
    els.map(e => ({
      placeholder: e.getAttribute("placeholder"),
      name: e.getAttribute("name"),
      id: e.id,
      type: e.type
    }))
  );

  console.log("🧩 Input elements found:", inputs);
})();
