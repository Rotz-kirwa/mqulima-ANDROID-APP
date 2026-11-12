const BACKEND_HOST = (process.env.EXPO_PUBLIC_BACKEND_URL || "https://www.mqulima.com").replace(/\/$/, "");
const N = `${BACKEND_HOST}/images/news`;

export type Article = {
  id: string;
  slug?: string;
  title: string;
  excerpt: string;
  category: string;
  group: string;
  readTime: string;
  date: string;
  reads: number;
  image: string;
  body: string[];
  featured?: boolean;
  author?: {
    name: string;
    role: string;
    avatarInitials: string;
  };
};

export const articleFilters = [
  "All",
  "Agronomy & Farm Tips",
  "Policy & Market",
  "Agri-Tech & Tools",
  "Weather Advisory",
  "Livestock & Dairy",
];

export const newsTestimonials = [
  {
    quote:
      "The live commodity market prices and agronomy guides saved our potato harvest from middlemen markups. Direct market transparency is transforming our farm profitability in Elgeyo-Marakwet.",
    author: "Kosgei Kiprono",
    role: "Crop & Horticulture Producer, Elgeyo-Marakwet",
    initials: "KK",
  },
  {
    quote:
      "Clear, practical biosecurity and poultry management instructions without complex jargon. Mqulima's peer forum helped us improve feed formulation and egg hatchability across our Bungoma flocks.",
    author: "Eliud Rotich",
    role: "Poultry Producer, Bungoma",
    initials: "ER",
  },
  {
    quote:
      "This platform is our daily source of reliable farm knowledge and fodder preservation practices. High-yield silage guidance helped keep our dairy cows productive throughout the dry season.",
    author: "Kipchumba Kipruto",
    role: "Mixed Farming & Dairy Producer, Elgeyo-Marakwet",
    initials: "KK",
  },
];

export const articles: Article[] = [
  {
    id: "milk-wars-why-kenya-s-dairy-industry-is-bordering-a-lose-lose-situation-1786",
    slug: "milk-wars-why-kenya-s-dairy-industry-is-bordering-a-lose-lose-situation-1786",
    title: "Milk Wars: Why Kenya's Dairy Industry Is Bordering a Lose-Lose Situation",
    excerpt:
      "Kenya's dairy sector, long celebrated as one of the most vibrant in Africa, is caught in a tug-of-war between processors, farmers and consumers.",
    category: "Livestock & Dairy",
    group: "Livestock & Dairy",
    readTime: "4 min read",
    date: "September 28, 2026",
    reads: 18,
    featured: true,
    image: `${N}/milk-wars-why-kenya-s-dairy-industry-is-bordering-a-lose-lose-situation-1786-cover.webp`,
    author: {
      name: "Mqulima Desk",
      role: "Editorial & Agronomy Desk",
      avatarInitials: "MD",
    },
    body: [
      "Kenya's dairy sector, long celebrated as one of the most vibrant in Africa, is caught in a tug-of-war between processors, farmers and consumers. Farm-gate prices swing sharply between the flush and dry seasons, leaving farmers unable to plan.",
      "Processors argue that cheap imports and informal milk traders undercut their margins, while farmers say they are paid too little to cover feed, veterinary and labour costs. Consumers, meanwhile, see shelf prices that keep climbing.",
      "Without a coordinated approach — fair pricing formulas, investment in cooling infrastructure and stronger cooperatives — every player in the value chain risks losing. Farmers who invest in quality feed, record keeping and collective bargaining are best placed to weather the storm.",
    ],
  },
  {
    id: "kenyan-milk-economics-why-we-are-paying-dearly-for-milk-8728",
    slug: "kenyan-milk-economics-why-we-are-paying-dearly-for-milk-8728",
    title: "Kenyan Milk Economics: Why We Are Paying Dearly for Milk",
    excerpt:
      "The price of a packet of milk is the end result of a long chain of costs: animal feed, labour, transport, cooling, processing and packaging.",
    category: "Livestock & Dairy",
    group: "Livestock & Dairy",
    readTime: "4 min read",
    date: "September 27, 2026",
    reads: 15,
    featured: true,
    image: `${N}/kenyan-milk-economics-why-we-are-paying-dearly-for-milk-8728-cover.webp`,
    author: {
      name: "Mqulima Desk",
      role: "Editorial & Agronomy Desk",
      avatarInitials: "MD",
    },
    body: [
      "The price of a packet of milk is the end result of a long chain of costs: animal feed, labour, transport, cooling, processing and packaging. Each link adds to what the consumer finally pays.",
      "Feed accounts for up to 70% of the cost of producing a litre of milk. When maize and soybean prices rise, dairy meal follows — and so does milk.",
      "Improving on-farm fodder production, silage making and feed formulation can cut costs for farmers and, over time, stabilise prices for consumers.",
    ],
  },
  {
    id: "the-way-the-truth-and-the-light-why-sheep-farming-might-be-kenya-s-best-bet-at-food-security-and-improving-incomes-2182",
    slug: "the-way-the-truth-and-the-light-why-sheep-farming-might-be-kenya-s-best-bet-at-food-security-and-improving-incomes-2182",
    title: "Why Sheep Farming Is Kenya's Strategic Opportunity for Food Security and Farmer Incomes",
    excerpt:
      "Sheep are hardy, reproduce quickly and thrive on pasture that cattle would struggle on. For smallholders, they offer a low-cost entry into livestock farming.",
    category: "Livestock & Dairy",
    group: "Livestock & Dairy",
    readTime: "3 min read",
    date: "September 18, 2026",
    reads: 16,
    featured: true,
    image: `${N}/the-way-the-truth-and-the-light-why-sheep-farming-might-be-kenya-s-best-bet-at-food-security-and-improving-incomes-2182-cover.webp`,
    author: {
      name: "Mqulima Desk",
      role: "Editorial & Agronomy Desk",
      avatarInitials: "MD",
    },
    body: [
      "Sheep are hardy, reproduce quickly and thrive on pasture that cattle would struggle on. For smallholders, they offer a low-cost entry into livestock farming.",
      "Demand for mutton is rising locally and across the Middle East export market, while wool and skins add extra income streams.",
      "With proper breeding, deworming and pasture management, a small flock can become a steady source of income and nutrition for rural households.",
    ],
  },
  {
    id: "why-the-cost-of-food-is-ever-rising-and-the-role-of-goons-in-all-these-7030",
    slug: "why-the-cost-of-food-is-ever-rising-and-the-role-of-goons-in-all-these-7030",
    title: "Why Kenya's Food Costs Keep Rising: Supply Chain Bottlenecks and Market Reforms",
    excerpt:
      "Between the farm gate and the market stall, food changes hands many times. Transparent market price information and direct linkages are key reforms.",
    category: "Policy & Market",
    group: "Policy & Market",
    readTime: "4 min read",
    date: "September 17, 2026",
    reads: 14,
    image: `${N}/why-the-cost-of-food-is-ever-rising-and-the-role-of-goons-in-all-these-7030-cover.webp`,
    author: {
      name: "Mqulima Desk",
      role: "Editorial & Agronomy Desk",
      avatarInitials: "MD",
    },
    body: [
      "Between the farm gate and the market stall, food changes hands many times. Middlemen, informal levies and cartels at market entry points push prices up without adding value.",
      "Poor rural roads and lack of storage cause post-harvest losses that further squeeze supply.",
      "Transparent market price information, aggregation through cooperatives and direct farm-to-buyer linkages are key reforms that can bring prices down while raising farmer incomes.",
    ],
  },
  {
    id: "elnino-the-endless-rain-the-botched-harvests-and-where-the-mint-is-9013",
    slug: "elnino-the-endless-rain-the-botched-harvests-and-where-the-mint-is-9013",
    title: "El Niño: Heavy Rains, Harvest Safeguards, and Agricultural Opportunities",
    excerpt:
      "El Niño rains bring flooding, waterlogging and disease pressure — but also opportunity for farmers who prepare with drainage and water harvesting.",
    category: "Weather Advisory",
    group: "Weather Advisory",
    readTime: "3 min read",
    date: "September 16, 2026",
    reads: 12,
    image: `${N}/elnino-the-endless-rain-the-botched-harvests-and-where-the-mint-is-9013-cover.webp`,
    author: {
      name: "Mqulima Desk",
      role: "Editorial & Agronomy Desk",
      avatarInitials: "MD",
    },
    body: [
      "El Niño rains bring flooding, waterlogging and disease pressure — but also opportunity for farmers who prepare.",
      "Raised beds, proper drainage, timely fungicide application and early harvesting protect yields. Water harvesting and storage can extend production into the dry season.",
      "Fast-maturing vegetables, fodder crops and fish farming can turn abundant water into profit.",
    ],
  },
  {
    id: "african-swine-fever-kills-1-470-pigs-in-kiambu-as-outbreak-spreads-to-six-counties-2629",
    slug: "african-swine-fever-kills-1-470-pigs-in-kiambu-as-outbreak-spreads-to-six-counties-2629",
    title: "African Swine Fever Kills 1,470 Pigs in Kiambu as Outbreak Spreads to Six Counties",
    excerpt:
      "Strict biosecurity — limiting visitors, disinfecting footwear, avoiding swill feeding and quarantining new stock — is the critical defence for pig farmers.",
    category: "Livestock & Dairy",
    group: "Livestock & Dairy",
    readTime: "3 min read",
    date: "September 12, 2026",
    reads: 11,
    image: `${N}/african-swine-fever-kills-1-470-pigs-in-kiambu-as-outbreak-spreads-to-six-counties-2629-cover.webp`,
    author: {
      name: "Mqulima Desk",
      role: "Editorial & Agronomy Desk",
      avatarInitials: "MD",
    },
    body: [
      "An outbreak of African Swine Fever has killed 1,470 pigs in Kiambu and spread to six counties, according to veterinary officials.",
      "There is no vaccine or cure for ASF. Strict biosecurity — limiting visitors, disinfecting footwear, avoiding swill feeding and quarantining new stock — is the only defence.",
      "Farmers are urged to report sudden pig deaths to the nearest veterinary office immediately.",
    ],
  },
  {
    id: "september-weather-advisory-farmers-urged-to-plan-ahead-as-kenya-faces-changing-rainfall-conditions-5145",
    slug: "september-weather-advisory-farmers-urged-to-plan-ahead-as-kenya-faces-changing-rainfall-conditions-5145",
    title: "September Weather Advisory: Farmers Urged to Plan Ahead as Kenya Faces Changing Rainfall Conditions",
    excerpt:
      "Farmers should prepare land early, select drought-tolerant varieties and stock up on certified seed and fertilizer ahead of the onset of rains.",
    category: "Weather Advisory",
    group: "Weather Advisory",
    readTime: "3 min read",
    date: "September 12, 2026",
    reads: 13,
    image: `${N}/september-weather-advisory-farmers-urged-to-plan-ahead-as-kenya-faces-changing-rainfall-conditions-5145-cover.webp`,
    author: {
      name: "Mqulima Desk",
      role: "Editorial & Agronomy Desk",
      avatarInitials: "MD",
    },
    body: [
      "The Kenya Meteorological Department forecasts uneven rainfall distribution across the country this season.",
      "Farmers should prepare land early, select drought-tolerant varieties and stock up on certified seed and fertilizer ahead of the onset of rains.",
      "Use Mqulima Tools to track the 7-day microclimate forecast for your county before planting or spraying.",
    ],
  },
  {
    id: "ai-powered-digital-extension-service-brings-personalised-farming-advice-to-31-000-kenyan-farmers-1839",
    slug: "ai-powered-digital-extension-service-brings-personalised-farming-advice-to-31-000-kenyan-farmers-1839",
    title: "AI-Powered Digital Extension Service Brings Personalised Farming Advice to 31,000 Kenyan Farmers",
    excerpt:
      "Digital agronomy tools and AI-driven crop diagnostics are helping smallholder farmers optimize input application, detect pests early, and boost yields.",
    category: "Agri-Tech & Tools",
    group: "Agri-Tech & Tools",
    readTime: "3 min read",
    date: "September 10, 2026",
    reads: 19,
    image: `${N}/ai-powered-digital-extension-service-brings-personalised-farming-advice-to-31-000-kenyan-farmers-1839-cover.webp`,
    author: {
      name: "Mqulima Desk",
      role: "Editorial & Agronomy Desk",
      avatarInitials: "MD",
    },
    body: [
      "Over 31,000 Kenyan farmers are now leveraging AI-powered digital extension services to receive tailored crop calendars, pest alerts, and soil nutrition guidance directly on their phones.",
      "By combining local weather telemetry with satellite soil insights, digital advisory tools reduce fertilizer wastage and help farmers time their planting windows accurately.",
      "Mqulima AI and Mqulima Tools bring these capabilities into one integrated ecosystem accessible to every farmer across all 47 counties.",
    ],
  },
];
