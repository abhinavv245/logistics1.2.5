const express = require('express');
const fs = require('fs');
const path = require('path');
const { adaptPayload } = require('./adaptor');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// API endpoint to convert payload
app.post('/convert', (req, res) => {
    const payloadV1 = req.body;

    try {
        const payloadV2 = adaptPayload(payloadV1);
        res.json(payloadV2);
    } catch (error) {
        console.error('Error during payload conversion:', error);
        res.status(500).send('Error during payload conversion');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
