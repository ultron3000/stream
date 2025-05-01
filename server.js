const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/extract', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('Missing ?url=');

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
  );

  const videoLinks = new Set();

  page.on('request', req => {
    const url = req.url();
    console.log('Request:', url); // Debug log
    if (url.match(/\\.m3u8|\\.mp4|\\.m4v/i)) {
      videoLinks.add(url);
    }
  });

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Try to interact with a video element (if one exists)
    try {
  await page.mouse.click(100, 100); // click somewhere to trigger play/init
  console.log('Simulated click at (100, 100)');
  await page.waitForTimeout(5000);
} catch (err) {
  console.log('Click simulation failed:', err.message);
}

    await page.waitForTimeout(3000); // final wait to catch late requests
    await browser.close();
    res.json([...videoLinks]);
  } catch (err) {
    await browser.close();
    res.status(500).send('Failed to extract: ' + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Extractor running at http://localhost:${PORT}`));
