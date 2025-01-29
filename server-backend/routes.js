const express = require("express");
const router = express.Router();
const userController = require("./controllers/userController");

// Authentication Routes
router.post("/register", userController.register);
router.post("/login", userController.login);

// AI API Proxy Route
router.post("/ai/analyze", async (req, res) => {
  try {
    const response = await axios.post(process.env.AI_API_URL + "/analyze", req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "AI API request failed" });
  }
});

module.exports = router;
