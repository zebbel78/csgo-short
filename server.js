const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ensure data folder
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dataFile = path.join(dataDir, 'toernooi_data.json');

app.post('/save', async (req, res) => {
  try {
    const payload = req.body || {};
    payload.serverTimestamp = new Date().toISOString();
    await fs.promises.writeFile(dataFile, JSON.stringify(payload, null, 2), 'utf8');
    res.json({ ok: true, path: '/data/toernooi_data.json' });
  } catch (err) {
    console.error('Save error', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/data/toernooi_data.json', (req, res) => {
  if (fs.existsSync(dataFile)) return res.sendFile(dataFile);
  return res.status(404).json({ ok: false, error: 'No data yet' });
});

app.get('/', (req, res) => res.redirect('/toernooi.html'));

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
