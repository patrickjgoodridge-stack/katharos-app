export const config = { maxDuration: 60 };

const DATA_SOURCES = [
  // Sanctions & Watchlists
  { id: 'ofac', name: 'OFAC SDN List', url: 'https://sanctionslistservice.ofac.treas.gov/api/PublicationDate', category: 'Sanctions' },
  { id: 'ofacConsolidated', name: 'OFAC Consolidated List', url: 'https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/CONS_PRIM.CSV', category: 'Sanctions' },
  { id: 'ofacRecentActions', name: 'OFAC Recent Actions', url: 'https://ofac.treasury.gov/recent-actions/rss.xml', category: 'Sanctions' },
  { id: 'openSanctions', name: 'OpenSanctions', url: 'https://api.opensanctions.org/search/default?q=test&limit=1', category: 'Sanctions' },
  { id: 'openSanctionsPep', name: 'OpenSanctions PEP', url: 'https://api.opensanctions.org/search/peps?q=test&limit=1', category: 'PEP' },
  { id: 'unSanctions', name: 'UN Sanctions List', url: 'https://scsanctions.un.org/resources/xml/en/consolidated.xml', category: 'Sanctions' },
  { id: 'euSanctions', name: 'EU Sanctions List', url: 'https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content', category: 'Sanctions' },
  { id: 'interpol', name: 'INTERPOL Red Notices', url: 'https://ws-public.interpol.int/notices/v1/red?resultPerPage=1', category: 'Sanctions' },

  // Investigative Databases
  { id: 'icij', name: 'ICIJ Offshore Leaks', url: 'https://offshoreleaks.icij.org/api/v1/search?q=test&limit=1', category: 'Investigative' },
  { id: 'occrp', name: 'OCCRP Aleph', url: 'https://aleph.occrp.org/api/2/entities?q=test&limit=1', category: 'Investigative' },

  // Regulatory & Enforcement
  { id: 'sec', name: 'SEC EDGAR', url: 'https://efts.sec.gov/LATEST/search-index?q=test&forms=10-K', category: 'Regulatory' },
  { id: 'secEnforcement', name: 'SEC Enforcement', url: 'https://efts.sec.gov/LATEST/search-index?q=test&forms=LR,AAER,AP', category: 'Regulatory' },
  { id: 'doj', name: 'DOJ Press Releases', url: 'https://www.justice.gov/api/v1/press-releases.json?pagesize=1', category: 'Regulatory' },
  { id: 'fbi', name: 'FBI Most Wanted', url: 'https://api.fbi.gov/wanted/v1/list', category: 'Regulatory' },
  { id: 'cfpb', name: 'CFPB Complaints', url: 'https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/?size=1', category: 'Regulatory' },
  { id: 'ftc', name: 'FTC Enforcement', url: 'https://www.ftc.gov/legal-library/browse/cases-proceedings?search_api_fulltext=test', category: 'Regulatory' },
  { id: 'fdic', name: 'FDIC BankFind', url: 'https://banks.data.fdic.gov/api/financials?limit=1', category: 'Regulatory' },
  { id: 'fca', name: 'FCA Warning List', url: 'https://register.fca.org.uk/services/V0.1/Warnings?q=test', category: 'Regulatory' },
  { id: 'finra', name: 'FINRA BrokerCheck', url: 'https://api.brokercheck.finra.org/search/individual?query=test&hl=true&nrows=1', category: 'Regulatory' },

  // Corporate & Ownership
  { id: 'openCorporates', name: 'OpenCorporates', url: 'https://api.opencorporates.com/v0.4/companies/search?q=test', category: 'Corporate' },
  { id: 'ukCompanies', name: 'UK Companies House', url: 'https://api.company-information.service.gov.uk/search/companies?q=test', category: 'Corporate' },

  // International Institutions
  { id: 'worldBank', name: 'World Bank Debarment', url: 'https://apigwext.worldbank.org/dvsvc/v1.0/json/APPLICATION/ADOBE_EXPRNC/FIRM_LIST', category: 'International' },
  { id: 'comtrade', name: 'UN Comtrade', url: 'https://comtradeapi.un.org/public/v1/preview/C/A/HS/ALL/ALL?period=2023', category: 'Trade' },

  // Judicial & Court Records
  { id: 'courtListener', name: 'CourtListener', url: 'https://www.courtlistener.com/api/rest/v4/search/?q=test&type=o', category: 'Judicial' },
  { id: 'courtListenerDockets', name: 'CourtListener Dockets', url: 'https://www.courtlistener.com/api/rest/v4/search/?q=test&type=r', category: 'Judicial' },

  // Blockchain & Crypto
  { id: 'etherscan', name: 'Etherscan (Ethereum)', url: 'https://api.etherscan.io/api?module=stats&action=ethprice', category: 'Blockchain' },
  { id: 'blockchain', name: 'Blockchain.info (Bitcoin)', url: 'https://blockchain.info/ticker', category: 'Blockchain' },
  { id: 'bscscan', name: 'BSCScan (BNB Chain)', url: 'https://api.bscscan.com/api?module=stats&action=bnbprice', category: 'Blockchain' },
  { id: 'polygonscan', name: 'PolygonScan', url: 'https://api.polygonscan.com/api?module=stats&action=maticprice', category: 'Blockchain' },
  { id: 'blockchair', name: 'Blockchair', url: 'https://api.blockchair.com/bitcoin/stats', category: 'Blockchain' },
  { id: 'tronscan', name: 'TronScan', url: 'https://apilist.tronscanapi.com/api/system/status', category: 'Blockchain' },
  { id: 'solscan', name: 'Solscan (Solana)', url: 'https://public-api.solscan.io/chaininfo', category: 'Blockchain' },
  { id: 'ofacCrypto', name: 'OFAC Sanctioned Addresses', url: 'https://raw.githubusercontent.com/0xB10C/ofac-sanctioned-digital-currency-addresses/lists/sanctioned_addresses_ETH.txt', category: 'Blockchain' },

  // Shipping & Trade Intelligence
  { id: 'ituMars', name: 'ITU MARS Ship Registry', url: 'https://webapp.itu.int/MARS/api/ship?shipName=test', category: 'Shipping' },
  { id: 'marineTraffic', name: 'MarineTraffic', url: 'https://services.marinetraffic.com/api/exportvessel/v:5', category: 'Shipping' },

  // Media & Adverse News
  { id: 'newsapi', name: 'NewsAPI', url: 'https://newsapi.org/v2/everything?q=test&pageSize=1', category: 'Media' },
  { id: 'gdelt', name: 'GDELT', url: 'https://api.gdeltproject.org/api/v2/doc/doc?query=test&mode=artlist&maxrecords=1&format=json', category: 'Media' },
  { id: 'googleNews', name: 'Google News', url: 'https://news.google.com/rss/search?q=test&hl=en-US&gl=US&ceid=US:en', category: 'Media' },
  { id: 'bingNews', name: 'Bing News', url: 'https://api.bing.microsoft.com/v7.0/news/search?q=test&count=1&mkt=en-US', category: 'Media' },

  // Reference & PEP
  { id: 'wikidata', name: 'Wikidata', url: 'https://www.wikidata.org/w/api.php?action=wbsearchentities&search=test&language=en&limit=1&format=json', category: 'Reference' },
  { id: 'wikidataSparql', name: 'Wikidata SPARQL (PEP)', url: 'https://query.wikidata.org/sparql?query=SELECT%20%3Fitem%20WHERE%20%7B%20%3Fitem%20wdt%3AP31%20wd%3AQ5%20%7D%20LIMIT%201&format=json', category: 'PEP' },
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
    case 'courtListenerDockets':
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
    case 'openSanctionsPep':
      if (process.env.OPENSANCTIONS_API_KEY) {
        headers['Authorization'] = `ApiKey ${process.env.OPENSANCTIONS_API_KEY}`;
      }
      break;
    case 'bingNews':
      if (process.env.BING_NEWS_API_KEY) {
        headers['Ocp-Apim-Subscription-Key'] = process.env.BING_NEWS_API_KEY;
      }
      break;
    case 'marineTraffic':
      // MarineTraffic uses path-based API key, handled in getUrl
      break;
    case 'sec':
    case 'secEnforcement':
      headers['User-Agent'] = 'Katharos Compliance App support@marlowe.app';
      break;
  }

  return headers;
};

// Add API keys to URLs where needed (for APIs that use query param auth)
const getUrl = (source) => {
  if (source.id === 'etherscan' && process.env.ETHERSCAN_API_KEY) {
    return source.url + `&apikey=${process.env.ETHERSCAN_API_KEY}`;
  }
  if (source.id === 'bscscan' && process.env.BSCSCAN_API_KEY) {
    return source.url + `&apikey=${process.env.BSCSCAN_API_KEY}`;
  }
  if (source.id === 'polygonscan' && process.env.POLYGONSCAN_API_KEY) {
    return source.url + `&apikey=${process.env.POLYGONSCAN_API_KEY}`;
  }
  if (source.id === 'marineTraffic' && process.env.MARINE_TRAFFIC_API_KEY) {
    return source.url + `/${process.env.MARINE_TRAFFIC_API_KEY}/protocol:jsono`;
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
