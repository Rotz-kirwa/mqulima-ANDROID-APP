export const about = {
  badge: "ABOUT MQULIMA",
  title: "Africa’s 360° agriculture ecosystem",
  tagline: "...taking you first class",
  image: "https://www.mqulima.com/images/home-ecosystem-640w.webp",
  paras: [
    "Mqulima is a farmer’s world. At Mqulima, we are building a paradise for everyone in agriculture. With Mqulima, you get a first class seat to success.",
    "We bring together every step of the agricultural journey to one home. Whether learning, producing, distributing, trading or adding value — just log into Mqulima.",
    "We bring an end to guesswork, gossip, scattered information and unresponsive support. Because agriculture works better when everything works together.",
  ],
  pillars: [
    { title: "Mission", text: "To make agriculture easier, faster, profitable and enjoyable for everyone in the value chain." },
    { title: "Vision", text: "Africa’s most trusted 360° agricultural ecosystem connecting knowledge, products, services and people." },
    { title: "Values", text: "Verified quality, transparency, farmer-first support and first class execution." },
  ],
};

export const academy = {
  badge: "Mqulima Academy",
  sub: "Coming 2026",
  title: "COMING SOON!!",
  text: "Our certified agricultural video courses and expert masterclasses are launching shortly. In the meantime, explore Mqulima Soko marketplace and register for early access below!",
  waitlist: "Get Early Beta Access",
  free: "100% Free",
  handle: "@mqulima_hub",
};

export const legal = [
  { title: "Terms of Service", body: [
    "By accessing Mqulima you agree to use the platform lawfully and to provide accurate information when creating an account, placing orders or requesting services.",
    "Products sold on AgroShop are supplied by verified agrodealers. Prices, availability and delivery timelines may change without notice.",
    "Service requests are matched to vetted independent professionals. Mqulima facilitates the connection and is not liable for the professional’s independent advice.",
    "Community posts must be respectful, accurate and relevant to agriculture. Mqulima may remove content that violates these guidelines.",
  ] },
  { title: "Privacy Policy", body: [
    "We collect information you provide — such as your name, phone number, county and order details — to deliver products and services.",
    "We do not sell your personal data. Information is shared only with suppliers and service providers needed to fulfil your request.",
    "You may request access to, correction of, or deletion of your personal data at any time by contacting mqulima@mqulima.com.",
  ] },
  { title: "Refunds & Returns", body: [
    "Damaged or incorrect items reported within 48 hours of delivery are eligible for replacement or refund after verification.",
  ] },
];

export const aiWelcome = "Hi! I’m Mqulima AI 🌱 — your farm advisor. Ask me about crops, livestock, soil, pests, fertilizer or market prices.";
export const aiSuggestions = ["Best fertilizer for maize?", "How to control fall armyworm?", "Improve milk yield", "When to plant beans?"];
export const aiReplies: { keys: string[]; reply: string }[] = [
  { keys: ["maize", "fertilizer", "dap", "can", "urea"], reply: "For maize, plant with DAP or NPK 17:17:17 (50kg/acre) and top-dress with CAN or Urea at knee height (about 4–6 weeks). A soil test first will tell you exactly what your land needs — you can request one under Services → Soil." },
  { keys: ["armyworm", "pest", "caterpillar", "insect"], reply: "Scout your maize early in the morning. For fall armyworm, apply a recommended insecticide directly into the whorl when you see fresh damage, rotate active ingredients, and practise early planting and crop rotation." },
  { keys: ["milk", "dairy", "cow"], reply: "To boost milk yield: provide clean water at all times, feed quality fodder or silage, add a high-protein dairy meal (1kg per 2 litres of milk above 7L), supply mineral licks and keep a regular milking routine." },
  { keys: ["plant", "beans", "rain", "season", "weather"], reply: "Plant beans at the onset of reliable rains when the soil is moist to about 15cm. Check the 7-day microclimate forecast for your county in Tools → Weather Radar before planting." },
  { keys: ["chicken", "poultry", "layers", "eggs"], reply: "For layers, feed a complete layers mash (about 120g/bird/day), provide 16 hours of light, keep drinkers clean and vaccinate against Newcastle and Gumboro on schedule." },
  { keys: ["soil", "ph", "acid"], reply: "Most crops prefer a soil pH of 6.0–7.0. If your soil is acidic, apply agricultural lime 2–3 months before planting. A Mqulima soil test gives you precise recommendations." },
  { keys: ["price", "market", "sell"], reply: "Check Tools → Live Markets for current KAMIS commodity prices across counties before you sell, so you negotiate with full information." },
];
export const aiFallback = "Great question! For a precise answer tailored to your farm, our agronomists can help — tap WhatsApp or request a ‘Consult an Agronomist’ service. Meanwhile, tell me your crop or livestock and county for more specific tips.";
