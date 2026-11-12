export const toolsHero = {
  image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80",
  badge: "MQULIMA AGRI-INTELLIGENCE CORE",
  title: "Precision Farm",
  highlight: "Intelligence",
  title2: "& Tools",
  text: "Real-time Open-Meteo & ground-station weather telemetry, live KAMIS commodity market feeds, spray suitability radar, and Mqulima AI guidance.",
  stats: [
    { v: "47", l: "Counties Monitored" },
    { v: "7-Day", l: "Microclimate Forecast" },
    { v: "Live", l: "KAMIS Market Feeds" },
    { v: "60+", l: "Commodities Tracked" },
  ],
};

export const toolsIntro = {
  badge: "MQULIMA TOOLS",
  title: "Farming decisions are only as good as the",
  highlight: "information behind them",
  text: "Mqulima Tools puts the pulse of the market and the sky above your farm literally in your hands. Plan smarter, farm sharper, and make every season count.",
};

export const tools = [
  { id: "weather", n: "#38", icon: "cloud-sun", title: "Weather Radar", text: "Know what the sky is planning before planning for your farm. Plan planting, spraying and harvesting around forecasts built for farmers.", cta: "Weather Forecast" },
  { id: "markets", n: "#39", icon: "chart-line", title: "Live Markets", text: "See real-time prices across markets before you sell or buy, so every transaction is made with full information, not guesswork.", cta: "View Markets" },
  { id: "weather-advisory", n: "#40", icon: "cloud-rain", title: "Weather Advisory", text: "Get practical, farmer-focused guidance on what today’s, next week’s and next year’s weather means for your specific agriculture decisions.", cta: "Consult Expert" },
  { id: "ai", n: "#41", icon: "bot", title: "Mqulima AI", text: "Get instant, intelligent answers to your agricultural questions, powered by AI built specifically for your agriculture.", cta: "Ask MqulimaAI" },
];

export const weather = {
  location: "Nairobi County, Kenya",
  image: "https://www.mqulima.com/images/mkulima_hero_farm.webp",
  temp: 30, day: "Tuesday, 13:34", condition: "Overcast", rain: "Rain - 14%",
  week: [
    { d: "Tue", hi: 30, lo: 17 }, { d: "Wed", hi: 30, lo: 18 }, { d: "Thu", hi: 30, lo: 17 },
    { d: "Fri", hi: 30, lo: 18 }, { d: "Sat", hi: 30, lo: 17 }, { d: "Sun", hi: 24, lo: 16 },
  ],
  highlights: [
    { l: "UV Index", v: "9.7", s: "Very High ☀️" },
    { l: "Wind Status", v: "19.10 km/h", s: "NE" },
    { l: "Humidity", v: "25%", s: "Dry 🌵" },
    { l: "Visibility", v: "6.5 km", s: "Average 😐" },
    { l: "Air Quality", v: "65", s: "Unstable ⚠️" },
    { l: "Spray Suitability", v: "Moderate", s: "Spray before 10am" },
  ],
};

export const marketFilters = [
  "All Varieties",
  "Cereals & Grains",
  "Pulses & Legumes",
  "Horticulture",
  "Fruits",
  "Livestock & Dairy",
  "Cash",
];
export const marketPrices = [
  { emoji: "🌽", name: "Dry Maize", unit: "90kg bag", market: "Eldoret (NCPB)", price: 3800, change: -3.1, type: "Cereals & Grains" },
  { emoji: "🌾", name: "Wheat", unit: "90kg bag", market: "Narok (Central)", price: 4200, change: 1.2, type: "Cereals & Grains" },
  { emoji: "🍚", name: "Pishori Rice", unit: "50kg bag", market: "Kirinyaga (Mwea)", price: 6600, change: 1.5, type: "Cereals & Grains" },
  { emoji: "🫘", name: "Rosecoco Beans", unit: "90kg bag", market: "Nairobi (Wakulima)", price: 8600, change: 2.4, type: "Pulses & Legumes" },
  { emoji: "🫘", name: "Green Grams (Ndengu)", unit: "90kg bag", market: "Kitui (Central)", price: 9100, change: -0.8, type: "Pulses & Legumes" },
  { emoji: "🍅", name: "Fresh Tomatoes", unit: "64kg crate", market: "Nairobi (Marikiti)", price: 4950, change: 3.2, type: "Horticulture" },
  { emoji: "🥔", name: "Shangi Potatoes", unit: "50kg bag", market: "Nyandarua (Ol Kalou)", price: 2450, change: -1.4, type: "Horticulture" },
  { emoji: "🧅", name: "Red Onions", unit: "13kg net bag", market: "Kajiado (Isinya)", price: 1520, change: 1.1, type: "Horticulture" },
  { emoji: "🥬", name: "Cabbage", unit: "medium head", market: "Nyandarua", price: 52, change: -2.6, type: "Horticulture" },
  { emoji: "🥑", name: "Avocados (Fuerte)", unit: "kg", market: "Murang'a", price: 84, change: 4.1, type: "Fruits" },
  { emoji: "🥭", name: "Apple Mangoes", unit: "kg", market: "Makueni (Wote)", price: 90, change: 4.0, type: "Fruits" },
  { emoji: "🍌", name: "Cooking Bananas (Matoke)", unit: "bunch", market: "Kisii", price: 650, change: 0.8, type: "Fruits" },
  { emoji: "🥛", name: "Fresh Raw Milk", unit: "1L", market: "Nyandarua", price: 55, change: 1.2, type: "Livestock & Dairy" },
  { emoji: "🥩", name: "Prime Beef", unit: "kg", market: "Kajiado", price: 700, change: 0.7, type: "Livestock & Dairy" },
  { emoji: "☕", name: "Coffee (Cherry)", unit: "kg", market: "Nyeri", price: 112, change: 5.0, type: "Cash" },
  { emoji: "🍃", name: "Tea (Green Leaf)", unit: "kg", market: "Kericho", price: 32, change: 0.4, type: "Cash" },
  { emoji: "🧪", name: "DAP Fertilizer", unit: "50kg bag", market: "Eldoret (NCPB)", price: 4050, change: -1.4, type: "Cash" },
];
