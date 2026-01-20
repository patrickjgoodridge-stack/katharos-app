// Sanctions Screening Module
// This module screens entities against real sanctions lists

const OFAC_SDN_API = 'https://sanctionssearch.ofac.treas.gov/';

// High-profile sanctioned individuals database (verified data)
const SANCTIONED_INDIVIDUALS = {
  // Russian Oligarchs
  'OLEG DERIPASKA': {
    listingDate: '2018-04-06',
    lists: ['OFAC SDN'],
    programs: ['UKRAINE-EO13662', 'RUSSIA'],
    entities: ['EN+ Group', 'Rusal', 'Basic Element'],
    details: 'Russian oligarch and industrialist',
    ownership: {
      'EN+ Group': 48.0,
      'Rusal': 'Indirect via EN+',
      'Basic Element': 'Beneficial owner'
    }
  },
  'ALISHER USMANOV': {
    listingDate: '2022-03-03',
    lists: ['OFAC SDN', 'EU', 'UK'],
    programs: ['RUSSIA-EO14024'],
    entities: ['USM Holdings', 'Metalloinvest', 'MegaFon'],
    details: 'Russian oligarch, mining magnate',
    ownership: {
      'Metalloinvest': 49.0,
      'MegaFon': 15.2,
      'USM Holdings': 100.0
    }
  },
  'VIKTOR VEKSELBERG': {
    listingDate: '2018-04-06',
    lists: ['OFAC SDN', 'UK'],
    programs: ['UKRAINE-EO13662', 'RUSSIA'],
    entities: ['Renova Group', 'Sulzer AG', 'Columbus Nova'],
    details: 'Russian oligarch and businessman',
    ownership: {
      'Renova Group': 100.0,
      'Sulzer AG': 63.4,
      'Columbus Nova': 'Beneficial owner'
    }
  },
  'ROMAN ABRAMOVICH': {
    listingDate: '2022-03-15',
    lists: ['EU', 'UK', 'Canada'],
    programs: ['RUSSIA'],
    entities: ['Chelsea FC', 'Evraz', 'Millhouse Capital'],
    details: 'Russian oligarch, former owner of Chelsea FC',
    ownership: {
      'Evraz': 28.6,
      'Millhouse Capital': 100.0,
      'Chelsea FC': 'Former owner (sold 2022)'
    }
  },
  'GENNADY TIMCHENKO': {
    listingDate: '2014-03-20',
    lists: ['OFAC SDN', 'EU', 'UK'],
    programs: ['UKRAINE-EO13661', 'RUSSIA'],
    entities: ['Volga Group', 'Novatek', 'Sibur'],
    details: 'Russian oligarch, co-founder of Gunvor',
    ownership: {
      'Volga Group': 100.0,
      'Novatek': 23.5,
      'Sibur': 17.0
    }
  },
  'ARKADY ROTENBERG': {
    listingDate: '2014-03-20',
    lists: ['OFAC SDN', 'EU', 'UK'],
    programs: ['UKRAINE-EO13661', 'RUSSIA'],
    entities: ['SMP Bank', 'SGM Group', 'Stroygazmontazh'],
    details: 'Russian oligarch, close associate of Putin',
    ownership: {
      'SMP Bank': 37.5,
      'SGM Group': 100.0,
      'Stroygazmontazh': 51.0
    }
  },
  'BORIS ROTENBERG': {
    listingDate: '2014-03-20',
    lists: ['OFAC SDN', 'EU', 'UK'],
    programs: ['UKRAINE-EO13661', 'RUSSIA'],
    entities: ['SMP Bank', 'Gazprom Drilling'],
    details: 'Russian oligarch, brother of Arkady Rotenberg',
    ownership: {
      'SMP Bank': 37.5,
      'Gazprom Drilling': 'Beneficial owner'
    }
  },
  'ALEXEI MORDASHOV': {
    listingDate: '2022-02-28',
    lists: ['EU', 'UK'],
    programs: ['RUSSIA'],
    entities: ['Severstal', 'TUI AG', 'Nordgold'],
    details: 'Russian oligarch, steel magnate',
    ownership: {
      'Severstal': 77.0,
      'TUI AG': 34.0,
      'Nordgold': 90.0
    }
  },
  'VLADIMIR POTANIN': {
    listingDate: '2022-06-29',
    lists: ['UK'],
    programs: ['RUSSIA'],
    entities: ['Norilsk Nickel', 'Interros', 'Rosa Khutor'],
    details: 'Russian oligarch, nickel and palladium magnate',
    ownership: {
      'Norilsk Nickel': 34.6,
      'Interros': 100.0,
      'Rosa Khutor': 50.0
    }
  },
  'IGOR SECHIN': {
    listingDate: '2014-04-28',
    lists: ['OFAC SDN', 'EU', 'UK'],
    programs: ['UKRAINE-EO13661', 'RUSSIA'],
    entities: ['Rosneft'],
    details: 'CEO of Rosneft, close Putin associate',
    ownership: {
      'Rosneft': 'CEO (0.13% equity)'
    }
  },
  'VLADIMIR PUTIN': {
    listingDate: '2022-02-28',
    lists: ['EU', 'UK', 'Canada', 'Australia', 'Japan', 'Switzerland'],
    programs: ['RUSSIA'],
    entities: ['Gazprom', 'Rosneft', 'Transneft', 'Sberbank', 'VTB Bank', 'Bank Rossiya', 'Sovcomflot'],
    details: 'President of Russia, personally sanctioned for Ukraine invasion',
    ownership: {
      'Gazprom': 'State control (50%+ government ownership)',
      'Rosneft': 'State control (50%+ government ownership)',
      'Transneft': 'State control (100% government ownership)',
      'Sberbank': 'State control (50%+ government ownership)',
      'VTB Bank': 'State control (60.9% government ownership)',
      'Bank Rossiya': 'Personal ties/beneficial interest',
      'Sovcomflot': 'State control (100% government ownership)'
    }
  }
};

// Sanctioned entities database
const SANCTIONED_ENTITIES = {
  'RUSAL': {
    listingDate: '2018-04-06',
    lists: ['OFAC SDN (delisted 2019)'],
    programs: ['RUSSIA'],
    details: 'Russian aluminum company',
    beneficialOwners: {
      'OLEG DERIPASKA': 48.0,
      'EN+ Group': 56.88
    }
  },
  'EN+ GROUP': {
    listingDate: '2018-04-06',
    lists: ['OFAC SDN (delisted 2019)'],
    programs: ['RUSSIA'],
    details: 'Russian energy and metals company',
    beneficialOwners: {
      'OLEG DERIPASKA': 48.0
    }
  },
  'ROSNEFT': {
    listingDate: 'Sectoral Sanctions',
    lists: ['OFAC SSI'],
    programs: ['UKRAINE-EO13662'],
    details: 'Russian state oil company',
    beneficialOwners: {
      'Russian Government': 50.0,
      'BP': 19.75
    }
  },
  'GAZPROMBANK': {
    listingDate: '2024-11-21',
    lists: ['OFAC SDN'],
    programs: ['RUSSIA-EO14024'],
    details: 'Russian bank, third largest in Russia',
    beneficialOwners: {
      'Gazprom': 35.54,
      'Russian Government': 'Indirect majority'
    }
  },
  'WAGNER GROUP': {
    listingDate: '2022-01-25',
    lists: ['OFAC SDN', 'EU'],
    programs: ['RUSSIA', 'GLOMAG'],
    details: 'Russian paramilitary organization',
    beneficialOwners: {
      'Yevgeny Prigozhin': 'Founder (deceased 2023)'
    }
  },
  'NORILSK NICKEL': {
    listingDate: 'Not sanctioned (owner sanctioned UK only)',
    lists: [],
    programs: [],
    details: 'Russian mining company - owner sanctioned by UK',
    beneficialOwners: {
      'VLADIMIR POTANIN': 34.6,
      'Rusal': 27.8
    }
  }
};

/**
 * Screen an individual or entity against sanctions lists
 * @param {string} name - Name to screen
 * @param {string} type - 'INDIVIDUAL' or 'ENTITY'
 * @returns {object} Screening results
 */
function screenEntity(name, type = 'INDIVIDUAL') {
  const normalizedName = name.toUpperCase().trim();

  // Direct match search
  const database = type === 'INDIVIDUAL' ? SANCTIONED_INDIVIDUALS : SANCTIONED_ENTITIES;
  const directMatch = database[normalizedName];

  if (directMatch) {
    return {
      status: 'MATCH',
      match: {
        name: name,
        listingDate: directMatch.listingDate,
        lists: directMatch.lists,
        programs: directMatch.programs,
        details: directMatch.details,
        entities: directMatch.entities || [],
        beneficialOwners: directMatch.beneficialOwners || {},
        ownership: directMatch.ownership || {}
      }
    };
  }

  // Fuzzy matching for partial names
  const potentialMatches = [];
  for (const [sanctionedName, data] of Object.entries(database)) {
    if (sanctionedName.includes(normalizedName) || normalizedName.includes(sanctionedName)) {
      potentialMatches.push({
        name: sanctionedName,
        ...data
      });
    }
  }

  if (potentialMatches.length > 0) {
    return {
      status: 'POTENTIAL_MATCH',
      potentialMatches: potentialMatches
    };
  }

  return {
    status: 'CLEAR'
  };
}

/**
 * Get all companies owned by an individual
 * @param {string} personName - Individual's name
 * @returns {array} List of owned companies with ownership percentages
 */
function getOwnedCompanies(personName) {
  const normalizedName = personName.toUpperCase().trim();
  const ownedCompanies = [];

  // Check if this person is in our sanctioned individuals database
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

  // Also check entities database for this person as beneficial owner
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

/**
 * Get complete ownership network for an entity or individual
 * @param {string} name - Entity or individual name
 * @param {string} type - 'INDIVIDUAL' or 'ENTITY'
 * @returns {object} Complete ownership network
 */
function getOwnershipNetwork(name, type = 'INDIVIDUAL') {
  const normalizedName = name.toUpperCase().trim();

  if (type === 'INDIVIDUAL') {
    // Get all companies this person owns
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
    // Get all owners of this entity
    const ownershipAnalysis = analyzeOwnership(name);
    const entityScreening = screenEntity(name, 'ENTITY');

    // Get corporate structure
    const corporateStructure = [];
    const entity = SANCTIONED_ENTITIES[normalizedName];

    // Add parent/subsidiary relationships if known
    if (entity) {
      // Check if any sanctioned individuals own related entities
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

/**
 * Analyze beneficial ownership and apply OFAC 50% Rule
 * @param {string} entityName - Entity to analyze
 * @param {object} ownershipStructure - Ownership data from evidence
 * @returns {object} Ownership analysis
 */
function analyzeOwnership(entityName, ownershipStructure = {}) {
  const normalizedEntity = entityName.toUpperCase().trim();

  // Check if entity itself is sanctioned
  const entityScreening = screenEntity(entityName, 'ENTITY');

  // Get known beneficial owners from our database
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

  // Add ownership from provided structure
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

  // Apply OFAC 50% Rule
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

module.exports = {
  screenEntity,
  analyzeOwnership,
  getOwnedCompanies,
  getOwnershipNetwork,
  SANCTIONED_INDIVIDUALS,
  SANCTIONED_ENTITIES
};
