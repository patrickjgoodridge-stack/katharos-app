export const config = { maxDuration: 60 };

const DATA_SOURCES = [
  { id: 'ofac', name: 'OFAC SDN List', url: 'https://sanctionslistservice.ofac.treas.gov/api/PublicationDate', category: 'Sanctions' },
  { id: 'icij', name: 'ICIJ Offshore Leaks', url: 'https://offshoreleaks.icij.org/api/v1/search?q=test&limit=1', category: 'Investigative' },
  { id: 'sec', name: 'SEC EDGAR', url: 'https://efts.sec.gov/LATEST/search-index?q=test&forms=10-K', category: 'Regulatory' },
  { id: 'worldBank', name: 'World Bank Debarment', url: 'https://apigwext.worldbank.org/dvsvc/v1.0/json/APPLICATION/ADOBE_EXPRNC/FIRM_LIST', category: 'International' },
  { id: 'occrp', name: 'OCCRP Aleph', url: 'https://aleph.occrp.org/api/2/entities?q=test&limit=1', category: 'Investigative' },
  { id: 'openCorporates', name: 'OpenCorporates', url: 'https://api.opencorporates.com/v0.4/companies/search?q=test', category: 'Corporate' },
  { id: 'ukCompanies', name: 'UK Companies House', url: 'https://api.company-information.service.gov.uk/search/companies?q=test', category: 'Corporate' },
  { id: 'courtListener', name: 'CourtListener', url: 'https://www.courtlistener.com/api/rest/v3/search/?q=test&type=o', category: 'Judicial' },
  { id: 'etherscan', name: 'Etherscan', url: 'https://api.etherscan.io/api?module=stats&action=ethprice', category: 'Blockchain' },
  { id: 'newsapi', name: 'NewsAPI', url: 'https://newsapi.org/v2/everything?q=test&pageSize=1&apiKey=demo', category: 'Media' },
  { id: 'gdelt', name: 'GDELT', url: 'https://api.gdeltproject.org/api/v2/doc/doc?query=test&mode=artlist&maxrecords=1&format=json', category: 'Media' },
  { id: 'wikidata', name: 'Wikidata', url: 'https://www.wikidata.org/w/api.php?action=wbsearchentities&search=test&language=en&limit=1&format=json', category: 'Reference' },
  { id: 'comtrade', name: 'UN Comtrade', url: 'https://comtradeapi.un.org/public/v1/preview/C/A/HS/ALL/ALL?period=2023', category: 'Trade' },
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results = await Promise.all(
    DATA_SOURCES.map(async (source) => {
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const resp = await fetch(source.url, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'User-Agent': 'Katharos-HealthCheck/1.0' },
        });

        clearTimeout(timeout);
        const responseTime = Date.now() - start;

        return {
          id: source.id,
          name: source.name,
          category: source.category,
          status: resp.ok ? (responseTime < 1000 ? 'connected' : 'degraded') : 'degraded',
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
          error: err.name === 'AbortError' ? 'Timeout (10s)' : err.message,
          lastChecked: new Date().toISOString(),
        };
      }
    })
  );

  res.json({ sources: results, checkedAt: new Date().toISOString() });
}
