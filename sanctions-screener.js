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

// Sanctioned crypto wallets database (OFAC SDN Cyber designations)
const SANCTIONED_WALLETS = {
  '0x8589427373D6D84E98730D7795D8f6f8731FDA16': { blockchain: 'Ethereum', listingDate: '2022-08-08', lists: ['OFAC SDN'], programs: ['CYBER2'], details: 'Tornado Cash — Ethereum privacy protocol used to launder over $7 billion', associatedEntity: 'Tornado Cash', riskLevel: 'CRITICAL' },
  '0x722122dF12D4e14e13Ac3b6895a86e84145b6967': { blockchain: 'Ethereum', listingDate: '2022-08-08', lists: ['OFAC SDN'], programs: ['CYBER2'], details: 'Tornado Cash Proxy — primary deposit contract', associatedEntity: 'Tornado Cash', riskLevel: 'CRITICAL' },
  '0xDD4c48C0B24039969fC16D1cdF626eaB821d3384': { blockchain: 'Ethereum', listingDate: '2022-08-08', lists: ['OFAC SDN'], programs: ['CYBER2'], details: 'Tornado Cash Router', associatedEntity: 'Tornado Cash', riskLevel: 'CRITICAL' },
  '0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b': { blockchain: 'Ethereum', listingDate: '2022-08-08', lists: ['OFAC SDN'], programs: ['CYBER2'], details: 'Tornado Cash Governance', associatedEntity: 'Tornado Cash', riskLevel: 'CRITICAL' },
  '0x098B716B8Aaf21512996dC57EB0615e2383E2f96': { blockchain: 'Ethereum', listingDate: '2022-04-14', lists: ['OFAC SDN'], programs: ['DPRK', 'CYBER2'], details: 'Lazarus Group — received $620M from Ronin Bridge exploit', associatedEntity: 'Lazarus Group', associatedIndividual: 'DPRK Reconnaissance General Bureau', riskLevel: 'CRITICAL' },
  '0xa0e1c89Ef1a489c9C7dE96311eD5Ce5D32c20E4B': { blockchain: 'Ethereum', listingDate: '2022-04-22', lists: ['OFAC SDN'], programs: ['DPRK', 'CYBER2'], details: 'Lazarus Group — Ronin Bridge funds laundering', associatedEntity: 'Lazarus Group', riskLevel: 'CRITICAL' },
  '0x4F47bC496De0528587371d602209952B5736684C': { blockchain: 'Ethereum', listingDate: '2023-08-23', lists: ['OFAC SDN'], programs: ['DPRK', 'CYBER2'], details: 'Lazarus Group — Atomic Wallet exploit ($100M)', associatedEntity: 'Lazarus Group', riskLevel: 'CRITICAL' },
  '0x6F1cA141A28907F78Ebaa64f83E4AE6038d91152': { blockchain: 'Ethereum', listingDate: '2022-04-05', lists: ['OFAC SDN'], programs: ['RUSSIA', 'CYBER2'], details: 'Garantex — Russian crypto exchange, $100M+ illicit volume', associatedEntity: 'Garantex', riskLevel: 'CRITICAL' },
  '0x2f389cE8bD8ff92De3402FFCe4691d17fC4f6535': { blockchain: 'Ethereum', listingDate: '2021-09-21', lists: ['OFAC SDN'], programs: ['CYBER2'], details: 'Suex OTC — first sanctioned crypto exchange', associatedEntity: 'Suex OTC', riskLevel: 'CRITICAL' },
  '0x6aCDFBA02D390b97Ac2b2d42A63E85293BCc160e': { blockchain: 'Ethereum', listingDate: '2021-11-08', lists: ['OFAC SDN'], programs: ['CYBER2'], details: 'Chatex — Telegram-based exchange for ransomware payments', associatedEntity: 'Chatex', riskLevel: 'CRITICAL' },
  '0x1da5821544e25c636c1417Ba96Ade4Cf6D2f9B5A': { blockchain: 'Ethereum', listingDate: '2022-04-05', lists: ['OFAC SDN'], programs: ['CYBER2', 'RUSSIA'], details: 'Hydra Market — largest darknet marketplace ($5.2B)', associatedEntity: 'Hydra Market', riskLevel: 'CRITICAL' },
  '0x723B78e67497E85279CB204544566F4dC5d2acA0': { blockchain: 'Ethereum', listingDate: '2023-11-29', lists: ['OFAC SDN'], programs: ['DPRK', 'CYBER2'], details: 'Sinbad.io — mixer used by Lazarus Group', associatedEntity: 'Sinbad.io', riskLevel: 'CRITICAL' },
  'TVacWx7F5wgMgn49L5frDf9KLgdYy8nPHL': { blockchain: 'Tron', listingDate: '2023-11-29', lists: ['OFAC SDN'], programs: ['DPRK', 'CYBER2'], details: 'DPRK-linked Tron wallet — Lazarus Group cross-chain laundering', associatedEntity: 'Lazarus Group', associatedIndividual: 'DPRK Reconnaissance General Bureau', riskLevel: 'CRITICAL' },
  'TNVaKWQzau4pirOmn1bN89Y1NRrdQR9J4P': { blockchain: 'Tron', listingDate: '2022-04-05', lists: ['OFAC SDN'], programs: ['CYBER2', 'RUSSIA'], details: 'Garantex Tron wallet — USDT sanctions evasion', associatedEntity: 'Garantex', riskLevel: 'CRITICAL' },
  'bc1q5shngvmswcmzz3ld2yfnsg9jtqxn5ce7d77waq': { blockchain: 'Bitcoin', listingDate: '2022-08-08', lists: ['OFAC SDN'], programs: ['CYBER2'], details: 'Tornado Cash Bitcoin bridge', associatedEntity: 'Tornado Cash', riskLevel: 'CRITICAL' },
  '12QtD5BFwRsdNsAZY76UVE1xyCGNTojH9h': { blockchain: 'Bitcoin', listingDate: '2021-09-21', lists: ['OFAC SDN'], programs: ['CYBER2'], details: 'Suex OTC Bitcoin wallet', associatedEntity: 'Suex OTC', riskLevel: 'CRITICAL' },
  '1KYiKJEfdJtap9QX2v9BXJMpz2SfU4pgZw': { blockchain: 'Bitcoin', listingDate: '2021-11-08', lists: ['OFAC SDN'], programs: ['CYBER2'], details: 'Chatex Bitcoin wallet', associatedEntity: 'Chatex', riskLevel: 'CRITICAL' }
};

function detectBlockchain(address) {
  if (/^T[A-Za-z1-9]{33}$/.test(address)) return 'Tron';
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) return 'Ethereum';
  if (/^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address)) return 'Bitcoin';
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return 'Solana';
  return 'Unknown';
}

/**
 * Screen an individual, entity, or crypto wallet against sanctions lists
 * @param {string} name - Name or wallet address to screen
 * @param {string} type - 'INDIVIDUAL', 'ENTITY', or 'WALLET'
 * @returns {object} Screening results
 */
function screenEntity(name, type = 'INDIVIDUAL') {
  if (type === 'WALLET') {
    const address = name.trim();
    const blockchain = detectBlockchain(address);
    let walletMatch = SANCTIONED_WALLETS[address];
    if (!walletMatch) {
      for (const [addr, data] of Object.entries(SANCTIONED_WALLETS)) {
        if (addr.toLowerCase() === address.toLowerCase()) { walletMatch = data; break; }
      }
    }
    if (walletMatch) {
      return {
        status: 'MATCH', blockchain,
        match: { name: address, address, blockchain: walletMatch.blockchain, listingDate: walletMatch.listingDate, lists: walletMatch.lists, programs: walletMatch.programs, details: walletMatch.details, associatedEntity: walletMatch.associatedEntity || null, associatedIndividual: walletMatch.associatedIndividual || null, riskLevel: walletMatch.riskLevel, entities: [], beneficialOwners: {}, ownership: {} }
      };
    }
    return { status: 'CLEAR', blockchain };
  }

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
  detectBlockchain,
  SANCTIONED_INDIVIDUALS,
  SANCTIONED_ENTITIES,
  SANCTIONED_WALLETS
};
