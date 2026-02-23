export const config = { maxDuration: 60 };

const DATA_SOURCES = [
  // Sanctions
  { id: 'ofac', name: 'OFAC SDN List', url: 'https://sanctionslistservice.ofac.treas.gov/api/PublicationDate', category: 'Sanctions' },
  { id: 'openSanctions', name: 'OpenSanctions', url: 'https://api.opensanctions.org/search/default?q=test&limit=1', category: 'Sanctions' },

  // Investigative
  { id: 'icij', name: 'ICIJ Offshore Leaks', url: 'https://offshoreleaks.icij.org/api/v1/search?q=test&limit=1', category: 'Investigative' },
  { id: 'occrp', name: 'OCCRP Aleph', url: 'https://aleph.occrp.org/api/2/entities?q=test&limit=1', category: 'Investigative' },

  // Regulatory
  { id: 'sec', name: 'SEC EDGAR', url: 'https://efts.sec.gov/LATEST/search-index?q=test&forms=10-K', category: 'Regulatory' },
  { id: 'doj', name: 'DOJ Press Releases', url: 'https://www.justice.gov/api/v1/press-releases.json?pagesize=1', category: 'Regulatory' },
  { id: 'cfpb', name: 'CFPB', url: 'https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/?size=1', category: 'Regulatory' },
  { id: 'fdic', name: 'FDIC BankFind', url: 'https://banks.data.fdic.gov/api/financials?limit=1', category: 'Regulatory' },

  // Corporate
  { id: 'openCorporates', name: 'OpenCorporates', url: 'https://api.opencorporates.com/v0.4/companies/search?q=test', category: 'Corporate' },
  { id: 'ukCompanies', name: 'UK Companies House', url: 'https://api.company-information.service.gov.uk/search/companies?q=test', category: 'Corporate' },

  // International
  { id: 'worldBank', name: 'World Bank Debarment', url: 'https://apigwext.worldbank.org/dvsvc/v1.0/json/APPLICATION/ADOBE_EXPRNC/FIRM_LIST', category: 'International' },
  { id: 'comtrade', name: 'UN Comtrade', url: 'https://comtradeapi.un.org/public/v1/preview/C/A/HS/ALL/ALL?period=2023', category: 'Trade' },

  // Judicial
  { id: 'courtListener', name: 'CourtListener', url: 'https://www.courtlistener.com/api/rest/v4/search/?q=test&type=o', category: 'Judicial' },

  // Blockchain
  { id: 'etherscan', name: 'Etherscan', url: 'https://api.etherscan.io/api?module=stats&action=ethprice', category: 'Blockchain' },
  { id: 'blockchain', name: 'Blockchain.info', url: 'https://blockchain.info/ticker', category: 'Blockchain' },

  // Media
  { id: 'newsapi', name: 'NewsAPI', url: 'https://newsapi.org/v2/everything?q=test&pageSize=1', category: 'Media' },
  { id: 'gdelt', name: 'GDELT', url: 'https://api.gdeltproject.org/api/v2/doc/doc?query=test&mode=artlist&maxrecords=1&format=json', category: 'Media' },
  { id: 'googleNews', name: 'Google News', url: 'https://news.google.com/rss/search?q=test&hl=en-US&gl=US&ceid=US:en', category: 'Media' },

  // Reference
  { id: 'wikidata', name: 'Wikidata', url: 'https://www.wikidata.org/w/api.php?action=wbsearchentities&search=test&language=en&limit=1&format=json', category: 'Reference' },
];

// Build auth headers from environment variables
const getHeaders = (source) => {
  const headers = { 'User-Agent': 'Katharos-HealthCheck/1.0' };

  switch (source.id) {
    case 'ukCompanies':
      if (process.env.UK_COMPANIES_HOUSE_API_KEY) {
        headers['Authorization'] = 'Basic ' + Buffer.from(process.env.UK_COMPANIES_HOUSE_API_KEY + ':').toString('base64');
      }
      break;
    case 'courtListener':
      if (process.env.COURT_LISTENER_API_KEY) {
        headers['Authorization'] = `Token ${process.env.COURT_LISTENER_API_KEY}`;
      }
      break;
    case 'newsapi':
      if (process.env.NEWS_API_KEY) {
        headers['X-Api-Key'] = process.env.NEWS_API_KEY;
      }
      break;
    case 'openSanctions':
      if (process.env.OPENSANCTIONS_API_KEY) {
        headers['Authorization'] = `ApiKey ${process.env.OPENSANCTIONS_API_KEY}`;
      }
      break;
    case 'occrp':
      if (process.env.OCCRP_API_KEY) {
        headers['Authorization'] = `ApiKey ${process.env.OCCRP_API_KEY}`;
      }
      break;
  }

  return headers;
};

// Add API keys to URLs where needed (for APIs that use query param auth)
const getUrl = (source) => {
  if (source.id === 'etherscan' && process.env.ETHERSCAN_API_KEY) {
    return source.url + `&apikey=${process.env.ETHERSCAN_API_KEY}`;
  }
  return source.url;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results = await Promise.all(
    DATA_SOURCES.map(async (source) => {
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const resp = await fetch(getUrl(source), {
          method: 'GET',
          signal: controller.signal,
          headers: getHeaders(source),
        });

        clearTimeout(timeout);
        const responseTime = Date.now() - start;

        // Any HTTP response means the API is reachable (even 401/403 = server is up)
        // Only mark as degraded if response is very slow (>3s)
        const status = responseTime < 3000 ? 'connected' : 'degraded';

        return {
          id: source.id,
          name: source.name,
          category: source.category,
          status,
          responseTime,
          httpStatus: resp.status,
          lastChecked: new Date().toISOString(),
        };
      } catch (err) {
        return {
          id: source.id,
          name: source.name,
          category: source.category,
          status: 'disconnected',
          responseTime: Date.now() - start,
          error: err.name === 'AbortError' ? 'Timeout (15s)' : err.message,
          lastChecked: new Date().toISOString(),
        };
      }
    })
  );

  res.json({ sources: results, checkedAt: new Date().toISOString() });
}
