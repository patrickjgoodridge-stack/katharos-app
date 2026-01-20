// Vercel Serverless Function - Ownership Network Analysis
import { SANCTIONED_INDIVIDUALS, SANCTIONED_ENTITIES, screenEntity } from './screen-sanctions.js';

function getOwnedCompanies(personName) {
  const normalizedName = personName.toUpperCase().trim();
  const ownedCompanies = [];

  const individual = SANCTIONED_INDIVIDUALS[normalizedName];
  if (individual && individual.ownership) {
    for (const [company, percentage] of Object.entries(individual.ownership)) {
      ownedCompanies.push({
        company: company,
        ownershipPercent: typeof percentage === 'number' ? percentage : 0,
        ownershipType: typeof percentage === 'string' ? percentage : 'DIRECT',
        sanctionedOwner: true,
        ownerDetails: {
          lists: individual.lists,
          listingDate: individual.listingDate,
          programs: individual.programs
        }
      });
    }
  }

  for (const [entityName, entityData] of Object.entries(SANCTIONED_ENTITIES)) {
    if (entityData.beneficialOwners && entityData.beneficialOwners[normalizedName]) {
      const percentage = entityData.beneficialOwners[normalizedName];
      ownedCompanies.push({
        company: entityName,
        ownershipPercent: typeof percentage === 'number' ? percentage : 0,
        ownershipType: 'BENEFICIAL',
        sanctionedOwner: true,
        ownerDetails: individual ? {
          lists: individual.lists,
          listingDate: individual.listingDate,
          programs: individual.programs
        } : null
      });
    }
  }

  return ownedCompanies;
}

function analyzeOwnership(entityName, ownershipStructure = {}) {
  const normalizedEntity = entityName.toUpperCase().trim();
  const entityScreening = screenEntity(entityName, 'ENTITY');
  const knownEntity = SANCTIONED_ENTITIES[normalizedEntity];
  const beneficialOwners = [];
  let aggregateBlockedOwnership = 0;

  if (knownEntity && knownEntity.beneficialOwners) {
    for (const [ownerName, percentage] of Object.entries(knownEntity.beneficialOwners)) {
      const ownerScreening = screenEntity(ownerName, 'INDIVIDUAL');
      const isBlocked = ownerScreening.status === 'MATCH';
      const ownershipPercent = typeof percentage === 'number' ? percentage : 0;

      beneficialOwners.push({
        name: ownerName,
        ownershipPercent: ownershipPercent,
        ownershipType: 'DIRECT',
        sanctionStatus: isBlocked ? 'SANCTIONED' : 'CLEAR',
        pepStatus: false,
        sanctionDetails: isBlocked ? ownerScreening.match : null
      });

      if (isBlocked && ownershipPercent > 0) {
        aggregateBlockedOwnership += ownershipPercent;
      }
    }
  }

  if (ownershipStructure.owners) {
    for (const owner of ownershipStructure.owners) {
      const ownerScreening = screenEntity(owner.name, 'INDIVIDUAL');
      const isBlocked = ownerScreening.status === 'MATCH';

      beneficialOwners.push({
        name: owner.name,
        ownershipPercent: owner.percent || 0,
        ownershipType: owner.type || 'UNKNOWN',
        sanctionStatus: isBlocked ? 'SANCTIONED' : 'CLEAR',
        pepStatus: false,
        sanctionDetails: isBlocked ? ownerScreening.match : null
      });

      if (isBlocked && owner.percent) {
        aggregateBlockedOwnership += owner.percent;
      }
    }
  }

  const fiftyPercentRuleTriggered = aggregateBlockedOwnership >= 50;
  const riskLevel =
    fiftyPercentRuleTriggered ? 'CRITICAL' :
    aggregateBlockedOwnership >= 25 ? 'HIGH' :
    aggregateBlockedOwnership > 0 ? 'MEDIUM' :
    'LOW';

  return {
    fiftyPercentRuleTriggered,
    riskLevel,
    aggregateBlockedOwnership,
    beneficialOwners,
    entityScreening,
    summary: fiftyPercentRuleTriggered
      ? `Entity is BLOCKED under OFAC 50% Rule: ${aggregateBlockedOwnership.toFixed(1)}% owned by sanctioned persons`
      : aggregateBlockedOwnership > 0
      ? `${aggregateBlockedOwnership.toFixed(1)}% aggregate ownership by sanctioned persons detected`
      : 'No sanctioned beneficial ownership identified'
  };
}

function getOwnershipNetwork(name, type = 'INDIVIDUAL') {
  const normalizedName = name.toUpperCase().trim();

  if (type === 'INDIVIDUAL') {
    const ownedCompanies = getOwnedCompanies(normalizedName);
    const personScreening = screenEntity(name, 'INDIVIDUAL');

    return {
      subject: {
        name: name,
        type: 'INDIVIDUAL',
        sanctionStatus: personScreening.status,
        sanctionDetails: personScreening.match || null
      },
      ownedCompanies: ownedCompanies,
      totalCompanies: ownedCompanies.length,
      highRiskOwnership: ownedCompanies.filter(c => c.ownershipPercent >= 50).length
    };
  } else {
    const ownershipAnalysis = analyzeOwnership(name);
    const entityScreening = screenEntity(name, 'ENTITY');
    const corporateStructure = [];
    const entity = SANCTIONED_ENTITIES[normalizedName];

    if (entity) {
      for (const owner of ownershipAnalysis.beneficialOwners) {
        const ownerCompanies = getOwnedCompanies(owner.name);
        ownerCompanies.forEach(oc => {
          if (oc.company !== normalizedName) {
            corporateStructure.push({
              entity: oc.company,
              relationship: 'SISTER_COMPANY',
              commonOwner: owner.name,
              ownershipPercent: oc.ownershipPercent,
              sanctionExposure: owner.sanctionStatus === 'SANCTIONED' ? 'DIRECT' : 'NONE'
            });
          }
        });
      }
    }

    return {
      subject: {
        name: name,
        type: 'ENTITY',
        sanctionStatus: entityScreening.status,
        sanctionDetails: entityScreening.match || null
      },
      beneficialOwners: ownershipAnalysis.beneficialOwners,
      corporateStructure: corporateStructure,
      fiftyPercentRuleTriggered: ownershipAnalysis.fiftyPercentRuleTriggered,
      aggregateBlockedOwnership: ownershipAnalysis.aggregateBlockedOwnership,
      riskLevel: ownershipAnalysis.riskLevel,
      summary: ownershipAnalysis.summary
    };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, type } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const network = getOwnershipNetwork(name, type || 'INDIVIDUAL');
    return res.status(200).json(network);
  } catch (error) {
    console.error('Ownership network error:', error);
    return res.status(500).json({ error: error.message });
  }
}
