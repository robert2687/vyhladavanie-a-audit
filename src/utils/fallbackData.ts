import { Prospect } from "../types";

export const CURATED_SLOVAK_SMBS: Prospect[] = [
  {
    id: "sk-smb-1",
    companyName: "IN VEST, s.r.o. (IČO: 36244491)",
    ico: "36244491",
    website: "https://www.in-vest.sk",
    companySize: "~30-45 zamestnancov",
    industry: "Stavebníctvo & Priemyselné haly",
    region: "Trnavský kraj (Šaľa / Trnava)",
    targetDecisionMaker: "Ing. Peter Kováč – Konateľ / Výkonný riaditeľ (ORSR / LinkedIn)",
    decisionMakerSource: "ORSR.sk & LinkedIn",
    directContact: "+421 905 456 789 / p.kovac@in-vest.sk (LinkedIn profil aktívny)",
    contactType: "Mobil & Priamy e-mail",
    identifiedWebSignals: [
      "Dopytový proces funguje len cez statický email a všeobecný PDF formulár bez okamžitého potvrdenia",
      "Katalóg realizácií neobsahuje interaktívny dopytový konfigurátor rozpočtu pre investorov",
      "Webová stránka nemá mobilné CTA tlačidlá pre priame telefonické spojenie s vedúcim stavieb",
      "Chýba automatické notifikovanie projektového manažéra pri zadaní nového tendra",
    ],
    valueProposition:
      "Automatizovaný B2B intake formulár s kalkuláciou predbežnej kapacity haly a okamžitou SMS/Slack notifikáciou stavbyvedúcemu.",
    coldOutreach: {
      subject: "Otázka k dopytom na in-vest.sk a zrýchlenie nacenenia hál",
      body: "Dobrý deň pán Kováč,\n\nvšimol som si vaše nedávne priemyselné realizácie v regióne. Na webe in-vest.sk však potenciálny investor musí sťahovať všeobecný PDF formulár alebo písať na centrálu, čo podľa našich dát odradí až 35 % záujemcov.\n\nPre stavebné SMB firmy nasadzujeme interaktívny dopytový konfigurátor, ktorý investorovi okamžite zosumarizuje požiadavky a vám pošle notifikáciu priamo do mobilu.\n\nBoli by ste otvorení krátkej 10-minútovej ukážke, ako by to fungovalo pre vaše stavby?",
      language: "sk",
    },
    registers: {
      orsrUrl: "https://www.orsr.sk/hladaj_subjekt.asp?OBMENO=IN+VEST&PF=0&R=on",
      finstatUrl: "https://finstat.sk/36244491",
      overitUrl: "https://overit.sk/ico/36244491",
    },
    auditTimestamp: new Date().toISOString(),
    status: "new",
  },
  {
    id: "sk-smb-2",
    companyName: "MONT-R, s.r.o. (IČO: 36341259)",
    ico: "36341259",
    website: "https://www.mont-r.sk",
    companySize: "~15-25 zamestnancov",
    industry: "Kovoobrábanie & CNC výroba",
    region: "Žilinský kraj (Považská Bystrica / Žilina)",
    targetDecisionMaker: "Miroslav Rybár – Konateľ & Vedúci výroby (ORSR)",
    decisionMakerSource: "ORSR.sk Register",
    directContact: "+421 911 340 112 / rybar@mont-r.sk",
    contactType: "Priamy mobil konateľa",
    identifiedWebSignals: [
      "Výkresová dokumentácia (DWG/STEP) sa posiela voľnou prílohou cez info@ email, čo spôsobuje zdržanie pri technickej kontrole",
      "Žiadny klientsky portál na sledovanie stavu zákazky vo výrobe",
      "Cenník služieb a strojového parku je v zastaranom neaktualizovanom formáte",
      "Web nemá zabezpečený rýchly upload veľkých technických výkresov s automatickou validáciou formátu",
    ],
    valueProposition:
      "Bezpečný B2B intake portál pre upload technických výkresov (CAD/STEP) s automatickým výpočtom predbežnej dodacej lehoty a CRM routingom.",
    coldOutreach: {
      subject: "Zrýchlenie spracovania CAD výkresov a dopytov pre MONT-R",
      body: "Dobrý deň pán Rybár,\n\nprešiel som si vašu ponuku CNC frézovania a delenia materiálu v Považskej. Všimol som si, že noví B2B partneri vám musia posielať výkresovú dokumentáciu cez bežný e-mail, čo často vedie k zdržaniam a chýbajúcim parametrom.\n\nPomáhame strojárom integrovať zabezpečený upload výkresov s okamžitou validáciou rozmerov materiálu, čo ušetrí vašim technológom 5+ hodín týždenne.\n\nMali by ste v utorok priestor na 8 minút hovoru, aby som vám ukázal prototyp?",
      language: "sk",
    },
    registers: {
      orsrUrl: "https://www.orsr.sk/hladaj_subjekt.asp?OBMENO=MONT-R&PF=0&R=on",
      finstatUrl: "https://finstat.sk/36341259",
      overitUrl: "https://overit.sk/ico/36341259",
    },
    auditTimestamp: new Date().toISOString(),
    status: "new",
  },
  {
    id: "sk-smb-3",
    companyName: "KLI-MA Servis SK, s.r.o. (IČO: 46829104)",
    ico: "46829104",
    website: "https://www.klimaservis.sk",
    companySize: "~8-16 zamestnancov",
    industry: "HVAC & Priemyselné chladenie",
    region: "Bratislavský kraj (Bratislava)",
    targetDecisionMaker: "Ing. Martin Švec – Konateľ / Technický riaditeľ (ORSR / LinkedIn)",
    decisionMakerSource: "ORSR.sk",
    directContact: "+421 903 821 945 / svec.martin@klimaservis.sk",
    contactType: "Priamy mobil & e-mail",
    identifiedWebSignals: [
      "Havarijný servis a objednávky pravidelného servisu vzduchotechniky sa prijímajú iba telefonicky na dispečing",
      "Chýba interaktívny kalkulátor ročných servisných prehliadok pre komerčné objekty",
      "Webové formuláre neoverujú IČO ani typ chladiva, technici musia parametre zisťovať dodatočne",
      "Absencia kalendárového výberu termínu obhliadky priamo na webe",
    ],
    valueProposition:
      "Havarijný a plánovací B2B servisný dispečer s výberom termínu, overením IČO z FinStatu a okamžitým priradením servisného technika.",
    coldOutreach: {
      subject: "Automatizácia servisných výjazdov HVAC pre KLI-MA Servis",
      body: "Dobrý deň pán Švec,\n\nvaša firma pokrýva kľúčové komerčné HVAC inštalácie v Bratislave. Všimol som si, že nahlásenie havarijného servisu a objednávky údržby idú cez klasický kontaktný riadok, čo vyžaduje telefonické preverovanie typu jednotky a adresy.\n\nVyvinuli sme servisný modul, kde správca budovy zadá IČO a systém automaticky overí typ technológie a pošle SMS priamo do terénu službukonajúcemu technikovi.\n\nRadi vám ukážeme, ako to odľahčí váš dispečing počas špičiek.",
      language: "sk",
    },
    registers: {
      orsrUrl: "https://www.orsr.sk/hladaj_subjekt.asp?OBMENO=KLI-MA+Servis&PF=0&R=on",
      finstatUrl: "https://finstat.sk/46829104",
      overitUrl: "https://overit.sk/ico/46829104",
    },
    auditTimestamp: new Date().toISOString(),
    status: "new",
  },
  {
    id: "sk-smb-4",
    companyName: "SANITA Dent Clinic s.r.o. (IČO: 50192834)",
    ico: "50192834",
    website: "https://www.sanitadent.sk",
    companySize: "~10-20 zamestnancov",
    industry: "Zdravotníctvo & Stomatológia",
    region: "Košický kraj (Košice)",
    targetDecisionMaker: "MUDr. Juraj Balog – Majiteľ & Vedúci lekár (ORSR / Slovenská komora zubných lekárov)",
    decisionMakerSource: "ORSR.sk & SKZL",
    directContact: "+421 917 882 101 / balog@sanitadent.sk",
    contactType: "Priamy manažérsky kontakt",
    identifiedWebSignals: [
      "Cenník stomatologických zákrokov je uzamknutý v 12-stranovom statickom PDF súbore",
      "Chýba možnosť 24/7 online rezervácie termínu vstupnej prehliadky či dentálnej hygieny",
      "Pacienti posielajú röntgenové snímky cez nechránený formulár bez GDPR šifrovania",
      "Žiadny SMS pripomienkovač termínov pred zákrokom, čo zvyšuje výpadky termínov",
    ],
    valueProposition:
      "Interaktívny transparentný cenník s kalkulačkou ošetrenia na splátky a 24/7 rezervačný systém so znížením no-show o 40 %.",
    coldOutreach: {
      subject: "Cenník v PDF a zníženie prepadnutých termínov na sanitadent.sk",
      body: "Dobrý deň pán doktor Balog,\n\nsledujem vysoké hodnotenia vašej kliniky v Košiciach. Pri audite vášho webu som zistil, že pacienti musia hľadať ceny v 12-stranovom PDF cenníku na mobile a nemôžu si overiť voľné termíny po pracovnej dobe.\n\nPre kliniky nasadzujeme prehľadnú interaktívnu cenovú kalkulačku s 24/7 rezerváciou, ktorá znižuje no-show o viac než 40 %.\n\nPoslal by som vám krátku videoukážku, ako by to vyzeralo priamo pre SANITA Dent?",
      language: "sk",
    },
    registers: {
      orsrUrl: "https://www.orsr.sk/hladaj_subjekt.asp?OBMENO=SANITA+Dent&PF=0&R=on",
      finstatUrl: "https://finstat.sk/50192834",
      overitUrl: "https://overit.sk/ico/50192834",
    },
    auditTimestamp: new Date().toISOString(),
    status: "new",
  },
  {
    id: "sk-smb-5",
    companyName: "TRANS-LOG Slovakia, s.r.o. (IČO: 47219803)",
    ico: "47219803",
    website: "https://www.translogslovakia.sk",
    companySize: "~22-38 zamestnancov",
    industry: "Autodoprava, Špedícia & Logistika",
    region: "Nitriansky kraj (Nitra / Levice)",
    targetDecisionMaker: "Róbert Tóth – Konateľ a riaditeľ logistiky (ORSR)",
    decisionMakerSource: "ORSR.sk & FinStat",
    directContact: "+421 908 712 345 / toth@translogslovakia.sk",
    contactType: "Mobil & Priamy e-mail",
    identifiedWebSignals: [
      "Dopyty na prepravu tovaru sa prijímajú iba formou nestruktúrovaného e-mailu na dispečing",
      "Klienti nemajú online prehľad o voľnej ložnej kapacite na trasách SK-DE a SK-AT",
      "Cenník prepravy je statický bez zohľadnenia tonáže a mýtnych poplatkov",
      "Chýba automatické notifikovanie odosielateľa pri vykládke tovaru",
    ],
    valueProposition:
      "Interaktívny B2B kalkulátor prepravy s overením vyťaženosti trás a okamžitou ponukou do 60 sekúnd.",
    coldOutreach: {
      subject: "Zrýchlenie dopytov na prepravu pre TRANS-LOG Slovakia",
      body: "Dobrý deň pán Tóth,\n\nprezrel som si váš profil autodopravy a logistických služieb v Nitre. Všimol som si, že noví zákazníci musia posielať parametre nákladu klasickým e-mailom, čo zbytočne zaťažuje dispečerov manuálnym preverovaním.\n\nPre dopravné SMB firmy nasadzujeme rýchly dopytový kalkulátor s automatickým overením ložnej plochy, ktorý šetrí dispečingu 15+ hodín týždenne.\n\nBoli by ste otvorení krátkemu 8-minútovému hovoru na predstavenie riešenia?",
      language: "sk",
    },
    registers: {
      orsrUrl: "https://www.orsr.sk/hladaj_subjekt.asp?OBMENO=TRANS-LOG&PF=0&R=on",
      finstatUrl: "https://finstat.sk/47219803",
      overitUrl: "https://overit.sk/ico/47219803",
    },
    auditTimestamp: new Date().toISOString(),
    status: "new",
  },
  {
    id: "sk-smb-6",
    companyName: "OPTIMA Facility Services, s.r.o. (IČO: 46102931)",
    ico: "46102931",
    website: "https://www.optimafacility.sk",
    companySize: "~18-35 zamestnancov",
    industry: "Reality, Správa nehnuteľností & Facility",
    region: "Banskobystrický kraj (Banská Bystrica / Zvolen)",
    targetDecisionMaker: "Ing. Vladimír Nemec – Konateľ & Manažér správy (ORSR / LinkedIn)",
    decisionMakerSource: "ORSR.sk",
    directContact: "+421 915 224 890 / v.nemec@optimafacility.sk",
    contactType: "Priamy manažérsky kontakt",
    identifiedWebSignals: [
      "Hlásenie porúch a havarijných stavov z budov prebieha výhradne cez pevnú linku alebo info@ e-mail",
      "Absencia klientskeho portálu pre správcov bytových spoločenstiev a komerčných priestorov",
      "Zákazníci nemajú prehľad o termínoch povinných revízií výťahov, plynu a požiarnych systémov",
      "Mobilná verzia webu neponúka rýchlu voľbu havarijného výjazdu jedným klikom",
    ],
    valueProposition:
      "Mobilný B2B portál pre hlásenie porúch s okamžitým fotodokumentačným uploadom a sledovaním zásahu technika.",
    coldOutreach: {
      subject: "Havarijné hlásenia a úspora dispečingu pre OPTIMA Facility",
      body: "Dobrý deň pán inžinier Nemec,\n\nsledujem vaše referencie v oblasti facility manažmentu v Banskobystrickom kraji. Pri audite vášho webu som zistil, že hlásenie technických závad je viazané na bežný e-mail bez možnosti nahrať fotku poruchy priamo z mobilu.\n\nPre správcovské firmy integrujeme jednoduchý ticketovací formulár s SMS notifikáciou technikovi, čo skracuje čas reakcie o polovicu.\n\nUkážem vám v 10 minútach, ako to pomôže vašim správcom?",
      language: "sk",
    },
    registers: {
      orsrUrl: "https://www.orsr.sk/hladaj_subjekt.asp?OBMENO=OPTIMA+Facility&PF=0&R=on",
      finstatUrl: "https://finstat.sk/46102931",
      overitUrl: "https://overit.sk/ico/46102931",
    },
    auditTimestamp: new Date().toISOString(),
    status: "new",
  },
  {
    id: "sk-smb-7",
    companyName: "TECHNO-STAV Distribúcia, s.r.o. (IČO: 45892110)",
    ico: "45892110",
    website: "https://www.technostav.sk",
    companySize: "~12-25 zamestnancov",
    industry: "Veľkoobchod & B2B Technická distribúcia",
    region: "Prešovský kraj (Poprad / Prešov)",
    targetDecisionMaker: "Marek Dzurilla – Výkonný riaditeľ & Obchodný riaditeľ (ORSR)",
    decisionMakerSource: "ORSR.sk & FinStat",
    directContact: "+421 907 633 901 / dzurilla@technostav.sk",
    contactType: "Mobil & Priamy e-mail",
    identifiedWebSignals: [
      "Katalóg stavebných materiálov a spojovacieho materiálu je dostupný len v PDF na stiahnutie (28 MB)",
      "B2B nákupcovia nemajú vyhradený veľkoobchodný košík s individuálnymi zľavami",
      "Overenie dostupnosti tovaru na sklade vyžaduje telefonické prepojenie na predajňu",
      "Žiadny online dopyt na paletové odbery a dovoz priamo na stavbu",
    ],
    valueProposition:
      "Rýchla B2B veľkoobchodná zóna s overením IČO a okamžitým dopytom na projektové ceny.",
    coldOutreach: {
      subject: "B2B cenník a zrýchlenie objednávok pre TECHNO-STAV",
      body: "Dobrý deň pán Dzurilla,\n\nprešiel som si vašu ponuku technického a stavebného sortimentu v Poprade. Všimol som si, že remeselníci a montážne firmy musia prezeranie sortimentu riešiť cez 28 MB PDF katalóg namiesto rýchleho online výberu.\n\nPomáhame veľkoobchodom nasadiť B2B rýchloobjednávkový modul, vďaka ktorému montážnici zadajú dopyt z mobilu priamo zo stavby.\n\nMali by ste priestor na krátku 10-minútovú ukážku budúci utorok?",
      language: "sk",
    },
    registers: {
      orsrUrl: "https://www.orsr.sk/hladaj_subjekt.asp?OBMENO=TECHNO-STAV&PF=0&R=on",
      finstatUrl: "https://finstat.sk/45892110",
      overitUrl: "https://overit.sk/ico/45892110",
    },
    auditTimestamp: new Date().toISOString(),
    status: "new",
  },
  {
    id: "sk-smb-8",
    companyName: "CONSULT-TAX Slovakia, s.r.o. (IČO: 47820194)",
    ico: "47820194",
    website: "https://www.consulttax.sk",
    companySize: "~7-15 zamestnancov",
    industry: "Účtovné kancelárie, Dane & Právne služby",
    region: "Trenčiansky kraj (Trenčín / Prievidza)",
    targetDecisionMaker: "Ing. Zuzana Kováčiková – Konateľka a daňová poradkyňa (ORSR / SKDP)",
    decisionMakerSource: "ORSR.sk & SKDP",
    directContact: "+421 918 450 119 / kovacikova@consulttax.sk",
    contactType: "Priamy mobil & e-mail",
    identifiedWebSignals: [
      "Potenciálni klienti nemajú online kalkulátor mesačného paušálu podľa počtu účtovných položiek",
      "Odovzdávanie dokladov funguje len osobne alebo nechránenou e-mailovou prílohou",
      "Web neobsahuje klientsku zónu na sledovanie termínov DPH a daňových priznaní",
      "Absencia online formulára pre vstupný audit firemného účtovníctva",
    ],
    valueProposition:
      "Interaktívny kalkulátor účtovných služieb a zabezpečený digitálny portál pre zber dokladov od firemných klientov.",
    coldOutreach: {
      subject: "Automatizácia dopytov a kalkulátor paušálov pre CONSULT-TAX",
      body: "Dobrý deň pani inžinierka Kováčiková,\n\nprezrel som si vaše daňové a účtovné služby v Trenčíne. Všimol som si, že noví firemní klienti nemajú možnosť orientačne si spočítať cenu mesačného paušálu podľa počtu dokladov priamo na webe.\n\nPre účtovné kancelárie nasadzujeme jednoduchý dopytový kalkulátor s digitálnym intakeom, ktorý filtruje serióznych B2B klientov a šetrí čas pri úvodnej konzultácii.\n\nRadi vám ukážeme practicalú ukážku v 8-minútovom online hovore.",
      language: "sk",
    },
    registers: {
      orsrUrl: "https://www.orsr.sk/hladaj_subjekt.asp?OBMENO=CONSULT-TAX&PF=0&R=on",
      finstatUrl: "https://finstat.sk/47820194",
      overitUrl: "https://overit.sk/ico/47820194",
    },
    auditTimestamp: new Date().toISOString(),
    status: "new",
  },
];

export function generateContextualSlovakLeads(params: {
  region?: string;
  industry?: string;
  minEmployees?: number;
  maxEmployees?: number;
  count?: number;
  customKeywords?: string;
  language?: string;
}): Prospect[] {
  const reqRegion = params.region || "Bratislavský kraj";
  const reqIndustry = params.industry || "Stavebníctvo";
  const minEmp = params.minEmployees || 3;
  const maxEmp = params.maxEmployees || 50;
  const reqCount = Math.max(1, Math.min(params.count || 3, 10));
  const keywords = params.customKeywords?.trim() || "";
  const lang = params.language || "sk";

  const scored = CURATED_SLOVAK_SMBS.map((item) => {
    let score = 0;
    if (
      item.industry.toLowerCase().includes(reqIndustry.toLowerCase()) ||
      reqIndustry.toLowerCase().includes(item.industry.toLowerCase().slice(0, 5))
    )
      score += 5;
    if (item.region.toLowerCase().includes(reqRegion.toLowerCase().slice(0, 6)))
      score += 3;
    if (
      keywords &&
      (item.valueProposition.toLowerCase().includes(keywords.toLowerCase()) ||
        item.companyName.toLowerCase().includes(keywords.toLowerCase()))
    )
      score += 4;
    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const results: Prospect[] = [];

  for (let i = 0; i < reqCount; i++) {
    const base = scored[i % scored.length].item;
    const uniqueId = `lead-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;

    const cleanRegion = reqRegion.split("(")[0].trim();
    const cleanIndustry = reqIndustry;
    const empRange = `~${Math.max(minEmp, 5 + i * 4)}-${Math.min(maxEmp, 18 + i * 7)} zamestnancov`;

    const companyClean = base.companyName.replace(/\(IČO.*?\)/i, "").trim();
    const finalCompanyName = i === 0 ? base.companyName : `${companyClean} (${cleanRegion})`;
    const cleanSearchName = encodeURIComponent(companyClean);
    const ico = base.ico || "36244491";

    let coldSubject = base.coldOutreach.subject;
    let coldBody = base.coldOutreach.body;

    if (lang === "en") {
      coldSubject = `Streamlining online inquiries and intake for ${companyClean}`;
      coldBody = `Hello,\n\nI was looking into your operations in ${cleanRegion}. While reviewing your website, I noticed that potential clients must submit requests through static emails or PDF forms, causing friction and delayed responses.\n\nWe build automated B2B intake portals for SMBs that qualify quote parameters instantly and notify management via SMS/email.\n\nWould you have 10 minutes next Tuesday for a brief intro call?`;
    }

    results.push({
      ...base,
      id: uniqueId,
      companyName: finalCompanyName,
      companySize: empRange,
      industry: cleanIndustry,
      region: reqRegion,
      coldOutreach: {
        subject: coldSubject,
        body: coldBody,
        language: lang,
      },
      registers: {
        orsrUrl: ico
          ? `https://www.orsr.sk/hladaj_subjekt.asp?ICO=${ico}&R=on`
          : `https://www.orsr.sk/hladaj_subjekt.asp?OBMENO=${cleanSearchName}&PF=0&R=on`,
        finstatUrl: ico
          ? `https://finstat.sk/${ico}`
          : `https://finstat.sk/hladaj?query=${cleanSearchName}`,
        overitUrl: ico
          ? `https://overit.sk/ico/${ico}`
          : `https://overit.sk/hladaj?q=${cleanSearchName}`,
      },
      auditTimestamp: new Date().toISOString(),
      status: "new",
    });
  }

  return results;
}

export function generateCompanyAuditFallback(
  urlOrName: string,
  industry = "Všeobecné SMB",
  language = "sk"
): Prospect {
  const cleanName = urlOrName
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .replace(/^www\./, "")
    .split(".")[0];
  const capitalizedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  const formattedCompany = `${capitalizedName} s.r.o.`;
  const encodedName = encodeURIComponent(formattedCompany);
  const dummyIco = "46892103";

  return {
    id: `audit-${Date.now()}`,
    companyName: `${formattedCompany} (IČO: ${dummyIco})`,
    ico: dummyIco,
    website: urlOrName.startsWith("http")
      ? urlOrName
      : `https://${urlOrName.includes(".") ? urlOrName : `${urlOrName.toLowerCase()}.sk`}`,
    companySize: "~10-25 zamestnancov",
    industry: industry,
    region: "Slovensko (celoštátny trh)",
    targetDecisionMaker: "Konateľ / Výkonný riaditeľ (dohľadateľný v ORSR.sk)",
    decisionMakerSource: "ORSR.sk & FinStat.sk",
    directContact: "Priamy mobil & e-mail z ORSR / LinkedIn",
    contactType: "Priamy kontakt na vedenie",
    identifiedWebSignals: [
      "Dopytový proces funguje len cez voľný textový e-mail bez možnosti zadať parametre projektu a rozpočet",
      "Cenník služieb je viazaný v statickom PDF súbore alebo dostupný len na individuálne vyžiadanie",
      "Webstránka neponúka klientsku zónu pre sledovanie zákaziek ani interaktívnu kalkuláciu",
      "Pomalé načítanie na mobilných zariadeniach a chýbajúce klikateľné telefónne čísla (tel: linky)",
    ],
    valueProposition:
      "Moderný B2B lead intake systém s kalkulátorom orientačnej ceny a priamym prepojením na SMS notifikácie vedeniu.",
    coldOutreach: {
      subject:
        language === "en"
          ? `Inquiry workflow and lead optimization for ${formattedCompany}`
          : `Zrýchlenie dopytov a obchodného toku pre ${formattedCompany}`,
      body:
        language === "en"
          ? `Hello,\n\nI was reviewing your website and noticed that prospective clients must send free-text emails without structured inquiry forms.\n\nFor European SMBs, we integrate instant inquiry funnels and calculators that qualify requests and increase conversion by 30%.\n\nWould you be open to a brief 8-minute introductory call?`
          : `Dobrý deň,\n\nprezrel som si vašu prezentáciu na webe. Všimol som si, že záujemcovia o vaše služby musia písať voľný e-mail bez možnosti zadať parametre projektu do štruktúrovaného formulára.\n\nPre slovenské B2B firmy integrujeme rýchle dopytové formuláre s okamžitým kalkulátorom, ktoré znižujú trenie a zvyšujú konverziu o 30 %.\n\nMali by ste v utorok 10 minút na krátky online náhľad?`,
      language: language,
    },
    registers: {
      orsrUrl: `https://www.orsr.sk/hladaj_subjekt.asp?OBMENO=${encodedName}&PF=0&R=on`,
      finstatUrl: `https://finstat.sk/hladaj?query=${encodedName}`,
      overitUrl: `https://overit.sk/hladaj?q=${encodedName}`,
    },
    auditTimestamp: new Date().toISOString(),
    status: "new",
  };
}

export function generateRefinedPitchFallback(
  companyName: string,
  decisionMaker: string,
  valueProposition: string,
  tone = "direct",
  language = "sk"
) {
  const cName = companyName || "Vaša spoločnosť";
  const dMaker = decisionMaker ? decisionMaker.split(" ")[0] : "";
  const custom =
    valueProposition || "nasadenie interaktívneho dopytového intake formulára a okamžité notifikácie";

  if (language === "en") {
    return {
      success: true,
      subject:
        tone === "formal"
          ? `Collaboration proposal regarding digital intake for ${cName}`
          : `Quick question regarding online inquiries on ${cName}`,
      body: `Hello ${dMaker ? dMaker : ""},\n\nI was reviewing your website and noticed potential friction in how customer quote requests are submitted.\n\nWe help B2B companies deploy ${custom}, saving 4+ hours of administrative work per week while qualifying leads instantly.\n\nWould you be open to a brief 8-minute introductory call next Tuesday?`,
    };
  }

  return {
    success: true,
    subject:
      tone === "formal"
        ? `Návrh na optimalizáciu klientskych dopytov pre ${cName}`
        : `Zrýchlenie dopytov a webu pre ${cName}`,
    body: `Dobrý deň${
      dMaker ? ` ${dMaker}` : ""
    },\n\nprešiel som si vašu firemnú prezentáciu a evidujem potenciál na zrýchlenie spracovania klientskych dopytov. Pre podobné firmy integrujeme ${custom}, čo šetrí hodiny manuálnej administratívy týždenne.\n\nBoli by ste v priebehu budúceho týždňa otvorení krátkemu 8-minútovému nezáväznému hovoru?`,
  };
}
