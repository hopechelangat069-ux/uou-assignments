const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { currentStreak } = require('./lib/streak');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'habits.json');
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');

const load = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const save = (habits) => fs.writeFileSync(DATA_FILE, JSON.stringify(habits, null, 2));

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/habits', (req, res) => {
  const today = DATE_RE.test(req.query.today) ? req.query.today : new Date().toISOString().slice(0, 10);
  res.json(load().map((h) => ({ ...h, streak: currentStreak(h.dates, today) })));
});

app.post('/api/habits', (req, res) => {
  const name = String(req.body.name || '').trim().slice(0, 60);
  if (!name) return res.status(400).json({ error: 'Give the habit a name.' });
  const habits = load();
  const habit = { id: crypto.randomUUID(), name, dates: [] };
  habits.push(habit);
  save(habits);
  res.status(201).json(habit);
});

app.post('/api/habits/:id/toggle', (req, res) => {
  const { date } = req.body;
  if (!DATE_RE.test(date)) return res.status(400).json({ error: 'Date must look like YYYY-MM-DD.' });
  const habits = load();
  const habit = habits.find((h) => h.id === req.params.id);
  if (!habit) return res.status(404).json({ error: 'Habit not found.' });
  habit.dates = habit.dates.includes(date)
    ? habit.dates.filter((d) => d !== date)
    : [...habit.dates, date];
  save(habits);
  res.json(habit);
});

app.delete('/api/habits/:id', (req, res) => {
  const habits = load();
  const next = habits.filter((h) => h.id !== req.params.id);
  if (next.length === habits.length) return res.status(404).json({ error: 'Habit not found.' });
  save(next);
  res.status(204).end();
});

app.listen(PORT, () => console.log(`Streaks running at http://localhost:${PORT}`));