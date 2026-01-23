const express = require('express');
const cors = require('cors');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const { screenEntity, analyzeOwnership, getOwnershipNetwork, SANCTIONED_INDIVIDUALS, SANCTIONED_ENTITIES } = require('./sanctions-screener');
require('dotenv').config();

const app = express();

// Enable CORS for the React app
app.use(cors({
  origin: 'http://localhost:3000'
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.raw({ type: 'application/pdf', limit: '50mb' }));

const ANTHROPIC_API_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY;

// Real sanctions screening endpoint
app.post('/api/screen-sanctions', (req, res) => {
  try {
    const { name, type } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const screening = screenEntity(name, type || 'INDIVIDUAL');
    res.json(screening);
  } catch (error) {
    console.error('Sanctions screening error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ownership analysis endpoint
app.post('/api/analyze-ownership', (req, res) => {
  try {
    const { entityName, ownershipStructure } = req.body;

    if (!entityName) {
      return res.status(400).json({ error: 'Entity name is required' });
    }

    const analysis = analyzeOwnership(entityName, ownershipStructure);
    res.json(analysis);
  } catch (error) {
    console.error('Ownership analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get complete ownership network
app.post('/api/ownership-network', (req, res) => {
  try {
    const { name, type } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const network = getOwnershipNetwork(name, type || 'INDIVIDUAL');
    res.json(network);
  } catch (error) {
    console.error('Ownership network error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all sanctioned individuals and entities
app.get('/api/sanctions-database', (req, res) => {
  res.json({
    individuals: SANCTIONED_INDIVIDUALS,
    entities: SANCTIONED_ENTITIES
  });
});

// PDF extraction endpoint
app.post('/api/extract-pdf', async (req, res) => {
  try {
    const pdfBuffer = req.body;

    if (!pdfBuffer || pdfBuffer.length === 0) {
      return res.status(400).json({ error: 'No PDF data provided' });
    }

    const data = await pdfParse(pdfBuffer);

    res.json({
      text: data.text,
      pages: data.numpages,
      info: data.info
    });
  } catch (error) {
    console.error('PDF extraction error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint for Anthropic API (non-streaming)
app.post('/api/messages', async (req, res) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Streaming proxy endpoint for Anthropic API
app.post('/api/messages/stream', async (req, res) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({ ...req.body, stream: true })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      return res.status(response.status).json(errorData);
    }

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Pipe the stream from Anthropic to the client
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);
    }

    res.end();
  } catch (error) {
    console.error('Streaming error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Marlowe backend server running on http://localhost:${PORT}`);
  console.log(`✅ API key configured: ${ANTHROPIC_API_KEY ? 'Yes' : 'No'}`);
  console.log(`✅ Ready to proxy requests to Anthropic API`);
});
