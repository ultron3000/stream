const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/extract', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('Missing ?url=');

  const browser = await puppeteer.launch({
    headless: false, // Use headless: 'new' or false to appear real
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = await browser.newPage();

  // Make it look like a regular browser
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36");

  const videoLinks = new Set();

  // Capture all network requests for .mp4 or .m3u8 files
  page.on('request', req => {
    const url = req.url();
    if (url.match(/\\.m3u8|\\.mp4|\\.m4v/i)) {
      videoLinks.add(url);
    }
  });

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(5000); // wait for any delayed streams to load
    await browser.close();
    res.json([...videoLinks]);
  } catch (err) {
    await browser.close();
    res.status(500).send('Failed to extract: ' + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Extractor running at http://localhost:${PORT}`));
