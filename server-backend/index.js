const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

// To parse JSON bodies
app.use(express.json());

// Basic endpoint for the application API
app.get("/", (req, res) => {
  res.json({ message: "Hello from Express App API!" });
});

// Example endpoint that connects to the FastAPI AI API
app.get("/ai-data", async (req, res) => {
  try {
    // Call the FastAPI service running on port 8000
    const response = await axios.get('http://localhost:8000/');
    res.json(response.data);
  } catch (error) {
    console.error("Error calling the AI API:", error.message);
    res.status(500).json({ error: "Failed to connect to AI API" });
  }
});

app.listen(port, () => {
  console.log(`Express server is running on http://localhost:${port}`);
});
