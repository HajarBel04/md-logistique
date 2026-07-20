// Configs domicile/dépôt des chauffeurs — extraites de "Chauffeur M-D LOG.xlsx"
// Mise à jour manuelle si Alex modifie le fichier Excel de config.
const DRIVER_CONFIGS = [
  { name: 'ADIB ABDERAZAK',           homeCity: 'bruxelles',             depotKeyword: null },
  { name: 'ALLOUCHI ABDELMAJID',       homeCity: 'quevaucamps',           depotKeyword: 'Roeselare' },
  { name: 'AMGHAR YOUSSEF',            homeCity: 'saint-gilles',          depotKeyword: 'Albert I' },
  { name: 'BELKHATIR TAYEB',           homeCity: 'lebbeke',               depotKeyword: 'Albert I' },
  { name: 'BELYAYEV OLEG',             homeCity: 'mechelen',              depotKeyword: null },
  { name: 'BENDADA MOHAMMED',          homeCity: 'liège',                 depotKeyword: 'Hoeselt' },
  { name: 'BOUHTALA OUCHEN HAMID',     homeCity: 'borgherhout',           depotKeyword: 'Albert I' },
  { name: 'DAHMANI MOHAMED',           homeCity: 'woluwé-saint-lambert',  depotKeyword: null },
  { name: 'MECHATE NOUREDDINE',        homeCity: 'ganshoren',             depotKeyword: 'Albert I' },
  { name: 'OUKIL HOUSSAM EDDINE',      homeCity: 'erpe-mere',             depotKeyword: 'Albert I' },
  { name: 'OULAD BELLECHKAR GELLEL',   homeCity: 'anderlecht',            depotKeyword: 'Albert I' },
  { name: 'PIRVULESCU SORIN GABRIE',   homeCity: 'putte',                 depotKeyword: null },
  { name: 'SIDIBE SIDIBE MOHAMED',     homeCity: 'anderlecht',            depotKeyword: null },
  { name: 'TEMSAMANI JAWAD',           homeCity: 'strombeek-bever',       depotKeyword: 'Albert I' },
  { name: 'YOUSFI FOUAD',              homeCity: 'hoboken',               depotKeyword: null },
];

export default DRIVER_CONFIGS;
