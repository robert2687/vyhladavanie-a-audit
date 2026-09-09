export const SLOVAK_REGIONS = [
  "Bratislavský kraj (Bratislava, Pezinok, Senec, Malacky)",
  "Trnavský kraj (Trnava, Piešťany, Dunajská Streda, Galanta, Hlohovec, Senica, Skalica)",
  "Trenčiansky kraj (Trenčín, Prievidza, Považská Bystrica, Nové Mesto n/V, Púchov)",
  "Nitriansky kraj (Nitra, Nové Zámky, Levice, Komárno, Topoľčany, Šaľa)",
  "Žilinský kraj (Žilina, Martin, Liptovský Mikuláš, Čadca, Ružomberok, Námestovo)",
  "Banskobystrický kraj (Banská Bystrica, Zvolen, Lučenec, Rimavská Sobota, Brezno)",
  "Prešovský kraj (Prešov, Poprad, Humenné, Bardejov, Vranov nad Topľou, Kežmarok)",
  "Košický kraj (Košice, Michalovce, Spišská Nová Ves, Trebišov, Rožňava)",
  "Celé Slovensko (Celoslovenský záber)"
];

export const SLOVAK_INDUSTRIES = [
  {
    id: "stavebnictvo",
    name: "Stavebníctvo & Priemyselné stavby",
    description: "Generálni dodávatelia stavieb, haly, fasády, zemné práce, strechy, okná",
    typicalGaps: "Chýbajúce kalkulátory rozpočtov, dopyty iba cez voľný email, neaktualizované referencie v PDF"
  },
  {
    id: "kovoobrabanie",
    name: "Kovoobrábanie, CNC & Strojárstvo",
    description: "CNC frézovanie, sústruženie, delenie materiálu, zváranie, zámočníctvo",
    typicalGaps: "Posielanie CAD/DWG výkresov cez info@ email, žiadny B2B portál pre sledovanie zákazky"
  },
  {
    id: "autodoprava",
    name: "Autodoprava, Špedícia & Logistika",
    description: "Vnútroštátna a medzinárodná nákladná doprava, sťahovanie, skladovanie",
    typicalGaps: "Žiadne online overenie voľných kapacít vozového parku, statické cenníky za km"
  },
  {
    id: "tzb_hvac",
    name: "Inštalácie TZB, Fotovoltika & HVAC",
    description: "Klimatizácie, vzduchotechnika, tepelné čerpadlá, solárne panely, revízie",
    typicalGaps: "Absencia kalendára obhliadok na webe, chýbajúce automatické pripomienky ročného servisu"
  },
  {
    id: "zdravotnictvo",
    name: "Zdravotníctvo, Zubné kliniky & Fyzioterapia",
    description: "Súkromné stomatologické ambulancie, ortopédia, rehabilitačné centrá",
    typicalGaps: "Cenníky zakotvené v 10+ stranových PDF súboroch, nemožnosť rezervovať termín online 24/7"
  },
  {
    id: "reality_sprava",
    name: "Reality, Správa nehnuteľností & Facility",
    description: "Správcovské spoločnosti, lokálne realitné kancelárie, priemyselný upratovací servis",
    typicalGaps: "Zložité nahlasovanie havarijných stavov a porúch bez mobilného formulára"
  },
  {
    id: "b2b_velkoobchod",
    name: "Veľkoobchod & B2B Technická distribúcia",
    description: "Hutný materiál, elektroinštalačný materiál, spojovací materiál, pracovné odevy",
    typicalGaps: "Cenníky iba v Excel/PDF na vyžiadanie, chýbajúci B2B klientsky objednávkový systém"
  },
  {
    id: "uctovnictvo_pravo",
    name: "Účtovné kancelárie, Dane & Právne služby",
    description: "Vedenie podvojného účtovníctva, mzdy, daňové poradenstvo pre firmy",
    typicalGaps: "Chýbajúci kalkulátor mesačného paušálu podľa počtu dokladov, nechránený upload bločkov"
  }
];

export const SLOVAK_REGISTERS_INFO = [
  {
    name: "ORSR.sk (Obchodný register SR)",
    role: "Oficiálny štátny register právnických osôb SR",
    useCase: "Zistenie presného mena konateľa (štatutárneho orgánu), spoločníkov, IČO, sídla a spôsobu konania za firmu.",
    url: "https://www.orsr.sk"
  },
  {
    name: "FinStat.sk",
    role: "Analytický hospodársky portál firiem na Slovensku",
    useCase: "Overenie reálnej veľkosti firmy (počet zamestnancov, tržby, zisk), zadĺženosť, história a prepojené osoby.",
    url: "https://finstat.sk"
  },
  {
    name: "Overit.sk / Živnostenský register",
    role: "Rýchle overenie živností, daňových nedoplatkov a IČ DPH",
    useCase: "Preverenie registrácie DPH, platnosti živnostenských oprávnení a stavu konkurzov.",
    url: "https://overit.sk"
  },
  {
    name: "Infoma.sk / ZlatéStránky.sk",
    role: "Tradičné B2B firemné katalógy a kontaktné zoznamy",
    useCase: "Dohľadanie priamych telefónnych čísel na pobočky a alternatívnych kontaktov na vedenie.",
    url: "https://www.infoma.sk"
  }
];

export const COMMON_WEB_SIGNALS = [
  {
    title: "Cenník zamknutý v statickom PDF",
    description: "Návštevník na mobile musí sťahovať viacstranové PDF, čo dramaticky zvyšuje mieru okamžitého odchodu (bounce rate).",
    solution: "Interaktívna cenová kalkulačka priamo v prehliadači s okamžitým odoslaním dopytu."
  },
  {
    title: "Chýbajúci štruktúrovaný lead intake formulár",
    description: "Web žiada len 'napíšte nám na info@firma.sk', zákazník neuvedie rozmery, rozpočet ani termín, čo predlžuje obchodný cyklus.",
    solution: "Krokový formulár so zberom kľúčových parametrov, overením IČO a okamžitou SMS notifikáciou."
  },
  {
    title: "Žiadna možnosť online rezervácie alebo obhliadky",
    description: "Zákazníci mimo bežných otváracích hodín (večer, víkendy) nemajú možnosť zarezervovať termín či obhliadku.",
    solution: "24/7 rezervačný modul prepojený s Google Kalendárom firmy."
  },
  {
    title: "Neorganizované servisné hlásenia a zákazky",
    description: "Servisné požiadavky prichádzajú na súkromné mobily technikov a strácajú sa v papierových záznamoch.",
    solution: "Mobilný servisný dispečing s automatickým priradením voľného technika a sledovaním stavu."
  }
];
