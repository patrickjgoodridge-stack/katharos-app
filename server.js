const express = require('express');
const cors = require('cors');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const { screenEntity, analyzeOwnership, getOwnershipNetwork, SANCTIONED_INDIVIDUALS, SANCTIONED_ENTITIES } = require('./risk-screener');
const { AdverseMediaService } = require('./services/adverseMedia');
const { DataSourceManager } = require('./services/dataSources');
const { CourtRecordsService } = require('./services/courtRecords');
const { CompaniesHouseStreamService } = require('./services/companiesHouseStream');
const { UKCompaniesHouseService } = require('./services/ukCompaniesHouse');
const { OCCRPAlephService } = require('./services/occrpAleph');
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

// Adverse media screening endpoint
const adverseMediaService = new AdverseMediaService();
app.post('/api/screening/adverse-media', async (req, res) => {
  try {
    const { name, type, country, additionalTerms } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const result = await adverseMediaService.screen(name, type || 'INDIVIDUAL', { country, additionalTerms });
    res.json(result);
  } catch (error) {
    console.error('Adverse media screening error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Multi-source data screening endpoint
const dataSourceManager = new DataSourceManager();
app.post('/api/screening/data-sources', async (req, res) => {
  try {
    const { name, type, options } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const result = await dataSourceManager.screenEntity(name, type || 'INDIVIDUAL', options || {});
    res.json(result);
  } catch (error) {
    console.error('Data source screening error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Court records screening endpoint
const courtRecordsService = new CourtRecordsService();
app.post('/api/screening/court-records', async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const result = await courtRecordsService.screenEntity({ name, type: type || 'individual' });
    res.json(result);
  } catch (error) {
    console.error('Court records screening error:', error);
    res.status(500).json({ error: error.message });
  }
});

// UK Companies House REST screening endpoint
const ukCompaniesHouseService = new UKCompaniesHouseService();
app.post('/api/screening/uk-companies', async (req, res) => {
  try {
    const { companyNumber, companyName } = req.body;
    if (!companyNumber && !companyName) {
      return res.status(400).json({ error: 'companyNumber or companyName required' });
    }
    const result = await ukCompaniesHouseService.screenCompany({ companyNumber, companyName });
    res.json(result);
  } catch (error) {
    console.error('UK Companies House screening error:', error);
    res.status(500).json({ error: error.message });
  }
});

// OCCRP Aleph screening endpoints
const occrpAlephService = new OCCRPAlephService();
app.post('/api/screening/occrp-aleph', async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await occrpAlephService.screenEntity({ name, type: type || 'individual' });
    res.json(result);
  } catch (error) {
    console.error('OCCRP Aleph screening error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/screening/occrp-aleph/xref', async (req, res) => {
  try {
    const result = await occrpAlephService.crossReference(req.body);
    res.json(result);
  } catch (error) {
    console.error('OCCRP Aleph cross-reference error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/screening/occrp-aleph/network/:entityId', async (req, res) => {
  try {
    const { depth } = req.query;
    const result = await occrpAlephService.expandNetwork(req.params.entityId, parseInt(depth) || 1);
    res.json(result);
  } catch (error) {
    console.error('OCCRP Aleph network error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Companies House streaming service
const chStreamService = new CompaniesHouseStreamService();

app.get('/api/streaming/companies-house/status', (req, res) => {
  res.json(chStreamService.getStatus());
});

app.get('/api/streaming/companies-house/alerts', (req, res) => {
  const { severity, companyNumber, limit, offset } = req.query;
  const alerts = chStreamService.getAlerts({
    severity,
    companyNumber,
    limit: parseInt(limit) || 50,
    offset: parseInt(offset) || 0
  });
  res.json({ alerts, counts: chStreamService.getAlertCounts() });
});

app.get('/api/streaming/companies-house/watchlist', (req, res) => {
  res.json({ watchlist: chStreamService.getWatchlist() });
});

app.post('/api/streaming/companies-house/watchlist', (req, res) => {
  const { companyNumber } = req.body;
  if (!companyNumber) return res.status(400).json({ error: 'companyNumber is required' });
  chStreamService.addToWatchlist(companyNumber);
  res.json({ success: true, watchlistSize: chStreamService.getWatchlist().length });
});

app.delete('/api/streaming/companies-house/watchlist/:companyNumber', (req, res) => {
  chStreamService.removeFromWatchlist(req.params.companyNumber);
  res.json({ success: true, watchlistSize: chStreamService.getWatchlist().length });
});

app.post('/api/streaming/companies-house/connect', (req, res) => {
  chStreamService.connectAllStreams();
  res.json({ success: true, status: chStreamService.getStatus() });
});

app.post('/api/streaming/companies-house/disconnect', (req, res) => {
  chStreamService.disconnectAll();
  res.json({ success: true });
});

app.get('/api/streaming/companies-house/check-officer', (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const match = chStreamService.checkDisqualifiedOfficer(name);
  res.json({ match: match || null, isDisqualified: !!match });
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

// Streaming proxy endpoint for Anthropic API (both paths for compatibility)
const streamHandler = async (req, res) => {
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
};

// Register stream handler on both paths for local/production compatibility
app.post('/api/stream', streamHandler);
app.post('/api/messages/stream', streamHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Marlowe backend server running on http://localhost:${PORT}`);
  console.log(`✅ API key configured: ${ANTHROPIC_API_KEY ? 'Yes' : 'No'}`);
  console.log(`✅ Ready to proxy requests to Anthropic API`);
  if (process.env.COMPANIES_HOUSE_STREAM_KEY) {
    chStreamService.connectAllStreams();
    console.log(`✅ Companies House streaming initialized`);
  } else {
    console.log(`ℹ️  Companies House streaming disabled (no COMPANIES_HOUSE_STREAM_KEY)`);
  }
});
