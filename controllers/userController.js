const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Vyplňte všetky polia.' });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Používateľ s týmto emailom už existuje.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });
    await user.save();
    res.status(201).json({ message: 'Registrácia úspešná! Môžete sa prihlásiť.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Chyba servera.' });
  }
};

exports.login = async (req, res) => {
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
};
