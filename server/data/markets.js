// Geopolitical markets - commodity prices, defense stocks, currency stress

const COMMODITIES = [
  {symbol:'BRENT', name:'Brent Crude Oil', unit:'USD/bbl', base:82.50, vol:0.025, trend:0.0001},
  {symbol:'WTI',   name:'WTI Crude Oil',   unit:'USD/bbl', base:78.20, vol:0.025, trend:0.0001},
  {symbol:'GAS',   name:'Natural Gas (TTF)', unit:'EUR/MWh', base:38.50, vol:0.04, trend:0},
  {symbol:'GOLD',  name:'Gold', unit:'USD/oz', base:2680, vol:0.015, trend:0.0002},
  {symbol:'SILVER',name:'Silver', unit:'USD/oz', base:31.20, vol:0.022, trend:0.0001},
  {symbol:'WHEAT', name:'Wheat', unit:'USD/bu', base:570, vol:0.02, trend:0},
  {symbol:'COPPER',name:'Copper', unit:'USD/lb', base:4.28, vol:0.018, trend:0.00005},
  {symbol:'URAN',  name:'Uranium', unit:'USD/lb', base:81.50, vol:0.02, trend:0.0001},
];

const DEFENSE_STOCKS = [
  {symbol:'LMT',  name:'Lockheed Martin',     country:'US',     base:524.30, vol:0.014, trend:0.0001},
  {symbol:'RTX',  name:'Raytheon (RTX Corp)', country:'US',     base:118.50, vol:0.015, trend:0.0001},
  {symbol:'NOC',  name:'Northrop Grumman',    country:'US',     base:485.20, vol:0.013, trend:0.0001},
  {symbol:'GD',   name:'General Dynamics',    country:'US',     base:289.00, vol:0.012, trend:0.0001},
  {symbol:'BA',   name:'Boeing',              country:'US',     base:151.80, vol:0.022, trend:-0.00005},
  {symbol:'BAE',  name:'BAE Systems',         country:'UK',     base:1420, vol:0.014, trend:0.0002},
  {symbol:'HO',   name:'Thales',              country:'France', base:152.20, vol:0.015, trend:0.0001},
  {symbol:'AIR',  name:'Airbus',              country:'EU',     base:154.60, vol:0.013, trend:0.0001},
  {symbol:'RHM',  name:'Rheinmetall',         country:'Germany',base:592.00, vol:0.025, trend:0.0003},
  {symbol:'LDO',  name:'Leonardo',            country:'Italy',  base:28.40, vol:0.018, trend:0.0002},
  {symbol:'KOG',  name:'Kongsberg Gruppen',   country:'Norway', base:1186, vol:0.020, trend:0.0002},
  {symbol:'HII',  name:'Huntington Ingalls',  country:'US',     base:204.50, vol:0.014, trend:0.0001},
];

const CURRENCIES = [
  {pair:'EUR/USD', base:1.0540, vol:0.004, trend:0},
  {pair:'GBP/USD', base:1.2620, vol:0.005, trend:0},
  {pair:'USD/JPY', base:154.30, vol:0.006, trend:0},
  {pair:'USD/CNY', base:7.244, vol:0.003, trend:0},
  {pair:'USD/RUB', base:103.50, vol:0.020, trend:0.0002},
  {pair:'USD/TRY', base:34.85, vol:0.012, trend:0.0003},
  {pair:'USD/ILS', base:3.620, vol:0.008, trend:0},
  {pair:'USD/UAH', base:42.10, vol:0.010, trend:0.0001},
];

// State
const state = {
  commodities: COMMODITIES.map(c => ({...c, price: c.base, change: 0, history: [c.base]})),
  defenseStocks: DEFENSE_STOCKS.map(s => ({...s, price: s.base, change: 0, history: [s.base]})),
  currencies: CURRENCIES.map(c => ({...c, rate: c.base, change: 0, history: [c.base]})),
};

function randomWalk(price, vol, trend) {
  const noise = (Math.random() - 0.5) * 2 * vol;
  return price * (1 + noise * 0.1 + trend);
}

export function updateMarkets() {
  state.commodities = state.commodities.map(c => {
    const newPrice = randomWalk(c.price, c.vol, c.trend);
    const hist = [...c.history, newPrice].slice(-30);
    return {...c, price: newPrice, change: ((newPrice - c.base) / c.base) * 100, history: hist};
  });
  state.defenseStocks = state.defenseStocks.map(s => {
    const newPrice = randomWalk(s.price, s.vol, s.trend);
    const hist = [...s.history, newPrice].slice(-30);
    return {...s, price: newPrice, change: ((newPrice - s.base) / s.base) * 100, history: hist};
  });
  state.currencies = state.currencies.map(c => {
    const newRate = randomWalk(c.rate, c.vol, c.trend);
    const hist = [...c.history, newRate].slice(-30);
    return {...c, rate: newRate, change: ((newRate - c.base) / c.base) * 100, history: hist};
  });
  return state;
}

export function getMarkets() { return state; }

// Initialize with some history
for (let i = 0; i < 30; i++) updateMarkets();
