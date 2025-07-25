const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// Upravený helmet s CSP s povoleným 'unsafe-eval' (pre WebAssembly)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
  "'self'",
  "'unsafe-eval'",
  "blob:",
  "https://www.statcounter.com"
],

        connectSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://c.statcounter.com"
        ],
        workerSrc: [
          "'self'",
          "blob:"
        ],
        imgSrc: ["'self'", "data:", "blob:"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'self'", "blob:"],
      },
    },
  })
);


app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

// Pripojenie k MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB Atlas pripojené!');
  })
  .catch((err) => {
    console.error('Chyba pripojenia k MongoDB Atlas:', err);
  });

// ===== SERVOVANIE FRONTENDU =====
app.use(express.static(path.join(__dirname, 'dist')));

// ===== API ENDPOINTY =====
app.get('/api/test', (req, res) => {
  res.json({ message: 'API funguje!' });
});

app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Vyplňte všetky polia.' });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: 'Používateľ s týmto emailom už existuje.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'Registrácia úspešná! Môžete sa prihlásiť.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Chyba servera.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Vyplňte všetky polia.' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Nesprávny email alebo heslo.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Nesprávny email alebo heslo.' });
    }
    res.status(200).json({ message: 'Prihlásenie úspešné!', name: user.name });
  } catch (err) {
    res.status(500).json({ message: 'Chyba servera.' });
  }
});

// ===== SPA FALLBACK =====
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server beží na porte ${PORT}`);
});
