export const toolsHero = {
  image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80",
  badge: "MQULIMA AGRI-INTELLIGENCE CORE",
  title: "Precision Farm",
  highlight: "Intelligence",
  title2: "& Tools",
  text: "Real-time Open-Meteo telemetry, live KAMIS commodity market feeds, spray suitability radar, and instant AI plant disease diagnosis.",
  stats: [
    { v: "47", l: "Counties Monitored" },
    { v: "7-Day", l: "Microclimate Forecast" },
    { v: "Live", l: "KAMIS Market Feeds" },
    { v: "< 5 sec", l: "AI Diagnostics" },
  ],
};

export const toolsIntro = {
  badge: "MQULIMA TOOLS",
  title: "Farming decisions are only as good as the",
  highlight: "information behind them",
  text: "Mqulima Tools puts the pulse of the market, the sky above your farm, and the story behind every product literally in your hands. Plan smarter, farm sharper, and prove what you’ve built. Win",
};

export const tools = [
  { id: "weather", n: "#38", icon: "cloud-sun", title: "Weather Radar", text: "Know what the sky is planning before planning for your farm. Plan planting, spraying and harvesting around forecasts built for farmers.", cta: "Weather Forecast" },
  { id: "markets", n: "#39", icon: "chart-line", title: "Live Markets", text: "See real-time prices across markets before you sell or buy, so every transaction is made with full information, not guesswork.", cta: "View Markets" },
  { id: "crop-doctor", n: "#40", icon: "scan-search", title: "AI Crop Doctor", text: "Instant AI plant disease diagnosis. Describe the symptoms you see and get a likely diagnosis and treatment plan.", cta: "Diagnose Crop" },
  { id: "field-mapping", n: "#41", icon: "map", title: "Field mapping", text: "Map your farm precisely and manage it with confidence. Success starts with you knowing how big you need to jump.", cta: "Map Your Farm" },
  { id: "weather-advisory", n: "#42", icon: "cloud-rain", title: "Weather Advisory", text: "Get practical, farmer-focused guidance on what today’s, next week’s and next year’s weather means for your specific agriculture decisions.", cta: "Consult Expert" },
  { id: "trace", n: "#43", icon: "qr-code", title: "Mqulima Trace", text: "Give your produce a verifiable story. A story from your lovely farm to the esteemed consumer that builds trust and unlocks better markets.", cta: "Become Traceable" },
  { id: "ai", n: "#44", icon: "bot", title: "Mqulima AI", text: "Get instant, intelligent answers to your agricultural questions, powered by AI built specifically for your agriculture.", cta: "Ask MqulimaAI" },
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

export const marketFilters = ["All Varieties", "Fruits", "Horticulture", "Cash"];
export const marketPrices = [
  { emoji: "🥭", name: "Apple Mangoes", unit: "kg", market: "Mombasa", price: 100, change: 4, type: "Fruits" },
  { emoji: "🥑", name: "Avocados (Fuerte)", unit: "kg", market: "Nairobi", price: 103, change: 4.1, type: "Fruits" },
  { emoji: "🥬", name: "Cabbage", unit: "medium head", market: "Nairobi", price: 61, change: 2, type: "Horticulture" },
  { emoji: "🥬", name: "Cabbage", unit: "medium head", market: "Nyandarua", price: 43, change: -2.6, type: "Horticulture" },
  { emoji: "🍅", name: "Tomatoes", unit: "kg", market: "Nairobi", price: 85, change: 3.2, type: "Horticulture" },
  { emoji: "🥔", name: "Potatoes", unit: "kg", market: "Nyandarua", price: 48, change: -1.4, type: "Horticulture" },
  { emoji: "🧅", name: "Onions (Red)", unit: "kg", market: "Kisumu", price: 120, change: 1.1, type: "Horticulture" },
  { emoji: "🍌", name: "Bananas (Cooking)", unit: "bunch", market: "Kisii", price: 650, change: 0.8, type: "Fruits" },
  { emoji: "🌽", name: "Dry Maize", unit: "90kg bag", market: "Eldoret", price: 3800, change: -3.1, type: "Cash" },
  { emoji: "🫘", name: "Beans (Rosecoco)", unit: "kg", market: "Nakuru", price: 145, change: 2.4, type: "Cash" },
  { emoji: "☕", name: "Coffee (Cherry)", unit: "kg", market: "Nyeri", price: 95, change: 5.0, type: "Cash" },
  { emoji: "🍵", name: "Tea (Green leaf)", unit: "kg", market: "Kericho", price: 24, change: 0.4, type: "Cash" },
];

export const cropSymptoms = [
  { id: "yellow", label: "Yellowing leaves", dx: "Nitrogen deficiency", tx: "Top-dress with CAN or Urea at 50kg/acre and ensure adequate soil moisture." },
  { id: "spots", label: "Brown leaf spots", dx: "Early blight / leaf spot (fungal)", tx: "Remove affected leaves and spray a copper-based or mancozeb fungicide every 7–10 days." },
  { id: "wilt", label: "Sudden wilting", dx: "Bacterial wilt", tx: "Uproot and destroy affected plants, rotate with non-host crops and avoid waterlogging." },
  { id: "holes", label: "Holes in leaves", dx: "Caterpillar / Fall armyworm damage", tx: "Scout early mornings and apply a recommended insecticide into the whorl." },
  { id: "powder", label: "White powdery coating", dx: "Powdery mildew", tx: "Improve air circulation and apply a sulphur-based fungicide." },
  { id: "curl", label: "Curling leaves", dx: "Aphids / whitefly or viral infection", tx: "Use yellow sticky traps, apply neem-based or systemic insecticide and control weeds." },
];
