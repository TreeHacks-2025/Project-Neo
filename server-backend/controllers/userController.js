const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  // Store in DB (Example)
  res.json({ message: "User registered" });
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  // Fetch user from DB (Example)
  const isMatch = await bcrypt.compare(password, "stored_hashed_password");
  if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ username }, process.env.JWT_SECRET);
  res.json({ token });
};
