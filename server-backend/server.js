const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const itemsRoutes = require('./routes/items');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Use API routes
app.use('/api', itemsRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
