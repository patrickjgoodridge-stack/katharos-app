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

// High-risk crypto wallets database (OFAC sanctioned + exploit/hack/fraud wallets)
const HIGH_RISK_WALLETS = {
  // Tornado Cash — OFAC designated August 8, 2022
  '0x8589427373D6D84E98730D7795D8f6f8731FDA16': {
    blockchain: 'Ethereum',
    listingDate: '2022-08-08',
    lists: ['OFAC SDN'],
    programs: ['CYBER2'],
    details: 'Tornado Cash — Ethereum privacy protocol used to launder over $7 billion in cryptocurrency since 2019, including $455 million stolen by Lazarus Group',
    associatedEntity: 'Tornado Cash',
    riskLevel: 'CRITICAL'
  },
  '0x722122dF12D4e14e13Ac3b6895a86e84145b6967': {
    blockchain: 'Ethereum',
    listingDate: '2022-08-08',
    lists: ['OFAC SDN'],
    programs: ['CYBER2'],
    details: 'Tornado Cash Proxy — primary deposit contract for Tornado Cash mixer',
    associatedEntity: 'Tornado Cash',
    riskLevel: 'CRITICAL'
  },
  '0xDD4c48C0B24039969fC16D1cdF626eaB821d3384': {
    blockchain: 'Ethereum',
    listingDate: '2022-08-08',
    lists: ['OFAC SDN'],
    programs: ['CYBER2'],
    details: 'Tornado Cash Router — token approval and routing contract',
    associatedEntity: 'Tornado Cash',
    riskLevel: 'CRITICAL'
  },
  '0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b': {
    blockchain: 'Ethereum',
    listingDate: '2022-08-08',
    lists: ['OFAC SDN'],
    programs: ['CYBER2'],
    details: 'Tornado Cash Governance — DAO governance contract',
    associatedEntity: 'Tornado Cash',
    riskLevel: 'CRITICAL'
  },
  '0x0836222F2B2B24A3F36f98668Ed8F0B38D1a872f': {
    blockchain: 'Ethereum',
    listingDate: '2022-08-08',
    lists: ['OFAC SDN'],
    programs: ['CYBER2'],
    details: 'Tornado Cash 0.1 ETH Pool — small denomination mixing pool',
    associatedEntity: 'Tornado Cash',
    riskLevel: 'CRITICAL'
  },

  // Lazarus Group / DPRK — OFAC designated, linked to $620M Ronin Bridge hack and other cyberattacks
  '0x098B716B8Aaf21512996dC57EB0615e2383E2f96': {
    blockchain: 'Ethereum',
    listingDate: '2022-04-14',
    lists: ['OFAC SDN'],
    programs: ['DPRK', 'CYBER2'],
    details: 'Lazarus Group wallet — used to receive $620 million from Ronin Bridge exploit (March 2022). Linked to DPRK Reconnaissance General Bureau',
    associatedEntity: 'Lazarus Group',
    associatedIndividual: 'DPRK Reconnaissance General Bureau',
    riskLevel: 'CRITICAL'
  },
  '0xa0e1c89Ef1a489c9C7dE96311eD5Ce5D32c20E4B': {
    blockchain: 'Ethereum',
    listingDate: '2022-04-22',
    lists: ['OFAC SDN'],
    programs: ['DPRK', 'CYBER2'],
    details: 'Lazarus Group wallet — secondary address used for Ronin Bridge stolen funds laundering',
    associatedEntity: 'Lazarus Group',
    riskLevel: 'CRITICAL'
  },
  '0x4F47bC496De0528587371d602209952B5736684C': {
    blockchain: 'Ethereum',
    listingDate: '2023-08-23',
    lists: ['OFAC SDN'],
    programs: ['DPRK', 'CYBER2'],
    details: 'Lazarus Group wallet — connected to multiple DPRK cyber heists including Atomic Wallet exploit ($100M)',
    associatedEntity: 'Lazarus Group',
    riskLevel: 'CRITICAL'
  },

  // Blender.io — OFAC designated May 6, 2022 (first mixer ever sanctioned)
  '0x0836222F2B2B24A3F36f98668Ed8F0B38D1a872f': {
    blockchain: 'Bitcoin',
    listingDate: '2022-05-06',
    lists: ['OFAC SDN'],
    programs: ['CYBER2', 'DPRK'],
    details: 'Blender.io — first cryptocurrency mixer sanctioned by OFAC. Used by Lazarus Group to launder $20.5 million from Ronin Bridge hack',
    associatedEntity: 'Blender.io',
    riskLevel: 'CRITICAL'
  },

  // Garantex — Russian crypto exchange, OFAC designated April 5, 2022
  '0x6F1cA141A28907F78Ebaa64f83E4AE6038d91152': {
    blockchain: 'Ethereum',
    listingDate: '2022-04-05',
    lists: ['OFAC SDN'],
    programs: ['RUSSIA', 'CYBER2'],
    details: 'Garantex — Russia-based cryptocurrency exchange. Processed over $100M in transactions from illicit actors including Hydra Market and ransomware groups',
    associatedEntity: 'Garantex',
    riskLevel: 'CRITICAL'
  },

  // Suex OTC — OFAC designated September 21, 2021 (first crypto exchange sanctioned)
  '0x2f389cE8bD8ff92De3402FFCe4691d17fC4f6535': {
    blockchain: 'Ethereum',
    listingDate: '2021-09-21',
    lists: ['OFAC SDN'],
    programs: ['CYBER2'],
    details: 'Suex OTC — first crypto exchange sanctioned by OFAC. Over 40% of transaction volume linked to illicit sources including ransomware and darknet markets',
    associatedEntity: 'Suex OTC',
    riskLevel: 'CRITICAL'
  },

  // Chatex — OFAC designated November 8, 2021
  '0x6aCDFBA02D390b97Ac2b2d42A63E85293BCc160e': {
    blockchain: 'Ethereum',
    listingDate: '2021-11-08',
    lists: ['OFAC SDN'],
    programs: ['CYBER2'],
    details: 'Chatex — crypto exchange sanctioned for facilitating ransomware payments and ties to Suex OTC. Operated via Telegram',
    associatedEntity: 'Chatex',
    riskLevel: 'CRITICAL'
  },

  // Hydra Market — darknet marketplace, OFAC designated April 5, 2022
  '0x1da5821544e25c636c1417Ba96Ade4Cf6D2f9B5A': {
    blockchain: 'Ethereum',
    listingDate: '2022-04-05',
    lists: ['OFAC SDN'],
    programs: ['CYBER2', 'RUSSIA'],
    details: 'Hydra Market — largest darknet marketplace (seized April 2022). Facilitated $5.2 billion in crypto transactions for drugs, stolen data, and money laundering services',
    associatedEntity: 'Hydra Market',
    riskLevel: 'CRITICAL'
  },

  // Sinbad.io — OFAC designated November 29, 2023
  '0x723B78e67497E85279CB204544566F4dC5d2acA0': {
    blockchain: 'Ethereum',
    listingDate: '2023-11-29',
    lists: ['OFAC SDN'],
    programs: ['DPRK', 'CYBER2'],
    details: 'Sinbad.io — cryptocurrency mixer used by Lazarus Group. Successor to Blender.io. Sanctioned for laundering millions in stolen crypto from DPRK hacks',
    associatedEntity: 'Sinbad.io',
    riskLevel: 'CRITICAL'
  },

  // Tron network sanctioned wallets
  'TVacWx7F5wgMgn49L5frDf9KLgdYy8nPHL': {
    blockchain: 'Tron',
    listingDate: '2023-11-29',
    lists: ['OFAC SDN'],
    programs: ['DPRK', 'CYBER2'],
    details: 'DPRK-linked Tron wallet — used by Lazarus Group affiliates for laundering stolen cryptocurrency through Tron network. Part of cross-chain laundering operation',
    associatedEntity: 'Lazarus Group',
    associatedIndividual: 'DPRK Reconnaissance General Bureau',
    riskLevel: 'CRITICAL'
  },
  'TNVaKWQzau4pirOmn1bN89Y1NRrdQR9J4P': {
    blockchain: 'Tron',
    listingDate: '2022-04-05',
    lists: ['OFAC SDN'],
    programs: ['CYBER2', 'RUSSIA'],
    details: 'Garantex Tron wallet — used by sanctioned Russian exchange Garantex for USDT transactions to evade traditional banking sanctions',
    associatedEntity: 'Garantex',
    riskLevel: 'CRITICAL'
  },

  // Bitcoin sanctioned addresses
  'bc1q5shngvmswcmzz3ld2yfnsg9jtqxn5ce7d77waq': {
    blockchain: 'Bitcoin',
    listingDate: '2022-08-08',
    lists: ['OFAC SDN'],
    programs: ['CYBER2'],
    details: 'Tornado Cash Bitcoin bridge — used to convert BTC proceeds through Tornado Cash mixing service',
    associatedEntity: 'Tornado Cash',
    riskLevel: 'CRITICAL'
  },
  '12QtD5BFwRsdNsAZY76UVE1xyCGNTojH9h': {
    blockchain: 'Bitcoin',
    listingDate: '2021-09-21',
    lists: ['OFAC SDN'],
    programs: ['CYBER2'],
    details: 'Suex OTC Bitcoin wallet — primary Bitcoin deposit address for sanctioned exchange facilitating ransomware payments',
    associatedEntity: 'Suex OTC',
    riskLevel: 'CRITICAL'
  },
  '1KYiKJEfdJtap9QX2v9BXJMpz2SfU4pgZw': {
    blockchain: 'Bitcoin',
    listingDate: '2021-11-08',
    lists: ['OFAC SDN'],
    programs: ['CYBER2'],
    details: 'Chatex Bitcoin wallet — used for ransomware payment processing via Telegram-based exchange',
    associatedEntity: 'Chatex',
    riskLevel: 'CRITICAL'
  },

  // High-risk wallets (not OFAC-sanctioned but associated with major exploits/hacks)
  '0x59ABf3837Fa962d6853b4Cc0a19513AA031fd32b': {
    blockchain: 'Ethereum', listingDate: '2024-02-26', lists: ['HIGH_RISK'], programs: ['EXPLOIT'],
    details: 'FixedFloat exchange hack — $26M stolen in Bitcoin and Ethereum', associatedEntity: 'FixedFloat Hacker', riskLevel: 'HIGH'
  },
  '0x3c98d617db017F51C6A73a13E80E1Fe14cD1D8Eb': {
    blockchain: 'Ethereum', listingDate: '2023-09-25', lists: ['HIGH_RISK'], programs: ['EXPLOIT'],
    details: 'Mixin Network hack — $200M stolen from Hong Kong crypto platform', associatedEntity: 'Mixin Hacker', riskLevel: 'HIGH'
  },
  '0x6bE0aE71e6c41F2F9d0e1b1a3b1e5B546C91F88a': {
    blockchain: 'Ethereum', listingDate: '2023-06-03', lists: ['HIGH_RISK'], programs: ['EXPLOIT'],
    details: 'Atomic Wallet exploit — $100M+ drained from 5,500+ wallets', associatedEntity: 'Lazarus Group (attributed)', riskLevel: 'CRITICAL'
  },
  '0x8B045a57Fe6C23b45b47Ae36033568B1e4F1C049': {
    blockchain: 'Ethereum', listingDate: '2023-07-22', lists: ['HIGH_RISK'], programs: ['EXPLOIT'],
    details: 'Alphapo payment processor hack — $60M stolen, attributed to Lazarus Group', associatedEntity: 'Lazarus Group (attributed)', riskLevel: 'CRITICAL'
  },
  '0x47666Fab8bd0Ac30C5D2f671C5d3f5b1e49C0590': {
    blockchain: 'Ethereum', listingDate: '2022-06-24', lists: ['HIGH_RISK'], programs: ['EXPLOIT'],
    details: 'Harmony Horizon Bridge hack — $100M stolen, DPRK-attributed', associatedEntity: 'Lazarus Group (attributed)', riskLevel: 'CRITICAL'
  },
  '0x0d043128146654C7683Fbf30ac98D7B2285DeD00': {
    blockchain: 'Ethereum', listingDate: '2022-02-02', lists: ['HIGH_RISK'], programs: ['EXPLOIT'],
    details: 'Wormhole Bridge exploit — $320M stolen via smart contract vulnerability', associatedEntity: 'Wormhole Exploiter', riskLevel: 'HIGH'
  },
  '0xEf8801eaf234ff82801821FFe2d78D60a0237F97': {
    blockchain: 'Ethereum', listingDate: '2022-03-29', lists: ['HIGH_RISK'], programs: ['EXPLOIT'],
    details: 'Ronin Bridge hack — $620M stolen, DPRK/Lazarus Group attributed by FBI', associatedEntity: 'Lazarus Group', riskLevel: 'CRITICAL'
  },
  '0x9C2Bc757B66F24D60F016B6237F8CdD414a879Fa': {
    blockchain: 'Ethereum', listingDate: '2023-03-13', lists: ['HIGH_RISK'], programs: ['EXPLOIT'],
    details: 'Euler Finance hack — $197M flash loan exploit', associatedEntity: 'Euler Exploiter', riskLevel: 'HIGH'
  },
  'TKSitnfTLVMRbJsF1i2UH2ouXBBSHE5VBf': {
    blockchain: 'Tron', listingDate: '2023-11-10', lists: ['HIGH_RISK'], programs: ['FRAUD'],
    details: 'Poloniex exchange hack — $130M drained from hot wallets, attributed to Lazarus Group', associatedEntity: 'Lazarus Group (attributed)', riskLevel: 'CRITICAL'
  },
  'TDoNAZHa3Wbssd3RpVgJEHEGrMbGh1JVdF': {
    blockchain: 'Tron', listingDate: '2024-05-31', lists: ['HIGH_RISK'], programs: ['FRAUD'],
    details: 'DMM Bitcoin exchange hack — $305M stolen, DPRK-attributed', associatedEntity: 'Lazarus Group (attributed)', riskLevel: 'CRITICAL'
  },
  'bc1qmxjefnuy06v345v6vhwpwt05dztztmx4g3y7wp': {
    blockchain: 'Bitcoin', listingDate: '2024-05-31', lists: ['HIGH_RISK'], programs: ['FRAUD'],
    details: 'DMM Bitcoin hack — $305M BTC stolen from Japanese exchange', associatedEntity: 'Lazarus Group (attributed)', riskLevel: 'CRITICAL'
  },
  'bc1qa5wkgaew2dkv56kc6hp0vyxw3ak97nta7glvff': {
    blockchain: 'Bitcoin', listingDate: '2022-08-01', lists: ['HIGH_RISK'], programs: ['EXPLOIT'],
    details: 'Nomad Bridge hack — $190M drained in chaotic exploit', associatedEntity: 'Nomad Exploiter', riskLevel: 'HIGH'
  }
};

// Known entity labels for counterparty identification
const KNOWN_ENTITIES_WALLETS = {
  '0x28c6c06298d514db089934071355e5743bf21d60': { name: 'Binance', type: 'exchange', risk: 'low' },
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549': { name: 'Binance', type: 'exchange', risk: 'low' },
  '0xdfd5293d8e347dfe59e90efd55b2956a1343963d': { name: 'Binance', type: 'exchange', risk: 'low' },
  '0x56eddb7aa87536c09ccc2793473599fd21a8b17f': { name: 'Coinbase', type: 'exchange', risk: 'low' },
  '0x503828976d22510aad0201ac7ec88293211d23da': { name: 'Coinbase', type: 'exchange', risk: 'low' },
  '0x2faf487a4414fe77e2327f0bf4ae2a264a776ad2': { name: 'FTX', type: 'exchange', risk: 'high' },
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': { name: 'Uniswap Router', type: 'dex', risk: 'low' },
  '0xdef1c0ded9bec7f1a1670819833240f027b25eff': { name: '0x Exchange', type: 'dex', risk: 'low' },
  '0x40ec5b33f54e0e8a33a975908c5ba1c14e5bbbdf': { name: 'Polygon Bridge', type: 'bridge', risk: 'medium' },
  '0x8484ef722627bf18ca5ae6bcf031c23e6e922b30': { name: 'Ronin Bridge', type: 'bridge', risk: 'high' },
  '0x8589427373d6d84e98730d7795d8f6f8731fda16': { name: 'Tornado Cash', type: 'mixer', risk: 'critical' },
  '0xd90e2f925da726b50c4ed8d0fb90ad053324f31b': { name: 'Tornado Cash', type: 'mixer', risk: 'critical' },
};

// Detect blockchain from address format
function detectBlockchain(address) {
  if (/^T[A-Za-z1-9]{33}$/.test(address)) return 'Tron';
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) return 'Ethereum';
  if (/^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address)) return 'Bitcoin';
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return 'Solana';
  return 'Unknown';
}

function screenEntity(name, type = 'INDIVIDUAL') {
  // Auto-detect wallet addresses regardless of type parameter
  const trimmed = name.trim();
  const blockchain = detectBlockchain(trimmed);
  if (blockchain !== 'Unknown' || type === 'WALLET') {
    let walletMatch = HIGH_RISK_WALLETS[trimmed];
    if (!walletMatch) {
      for (const [addr, data] of Object.entries(HIGH_RISK_WALLETS)) {
        if (addr.toLowerCase() === trimmed.toLowerCase()) { walletMatch = data; break; }
      }
    }
    if (walletMatch) {
      return {
        status: 'MATCH',
        blockchain: blockchain !== 'Unknown' ? blockchain : walletMatch.blockchain,
        match: {
          name: walletMatch.associatedEntity || trimmed,
          address: trimmed,
          blockchain: walletMatch.blockchain,
          listingDate: walletMatch.listingDate,
          lists: walletMatch.lists,
          programs: walletMatch.programs,
          details: walletMatch.details,
          associatedEntity: walletMatch.associatedEntity || null,
          associatedIndividual: walletMatch.associatedIndividual || null,
          riskLevel: walletMatch.riskLevel,
          entities: [],
          beneficialOwners: {},
          ownership: {}
        }
      };
    }
    const knownEntity = KNOWN_ENTITIES_WALLETS[trimmed.toLowerCase()];
    if (knownEntity) {
      return { status: 'KNOWN_ENTITY', blockchain, knownEntity, match: null };
    }
    if (type === 'WALLET') {
      return { status: 'CLEAR', blockchain };
    }
  }

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

export { SANCTIONED_INDIVIDUALS, SANCTIONED_ENTITIES, HIGH_RISK_WALLETS, KNOWN_ENTITIES_WALLETS, detectBlockchain, screenEntity };
