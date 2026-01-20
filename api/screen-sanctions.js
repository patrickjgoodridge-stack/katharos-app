// Vercel Serverless Function - Sanctions Screening

// Sanctioned individuals database
const SANCTIONED_INDIVIDUALS = {
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
  },
  'FETULLAH GULEN': {
    listingDate: '2017-04-12',
    lists: ['Turkey Wanted', 'Interpol Red Notice'],
    programs: ['FETO'],
    entities: ['Gulen Movement', 'Hizmet', 'Alliance for Shared Values'],
    details: 'Turkish cleric, accused of orchestrating 2016 coup attempt',
    ownership: {
      'Gulen Movement': 'Founder/Leader',
      'Hizmet': 'Spiritual Leader'
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
  },
  'COSCO SHIPPING': {
    listingDate: '2019-09-25',
    lists: ['OFAC SDN (partially)'],
    programs: ['IRAN', 'VENEZUELA'],
    details: 'Chinese state shipping conglomerate, certain subsidiaries sanctioned for transporting Iranian oil',
    beneficialOwners: {
      'Chinese Government': 'State-owned enterprise',
      'COSCO Shipping Holdings': 'Parent company'
    }
  }
};

function screenEntity(name, type = 'INDIVIDUAL') {
  const normalizedName = name.toUpperCase().trim();
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

export default async function handler(req, res) {
  // Enable CORS
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

    const screening = screenEntity(name, type || 'INDIVIDUAL');
    return res.status(200).json(screening);
  } catch (error) {
    console.error('Sanctions screening error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export { SANCTIONED_INDIVIDUALS, SANCTIONED_ENTITIES, screenEntity };
