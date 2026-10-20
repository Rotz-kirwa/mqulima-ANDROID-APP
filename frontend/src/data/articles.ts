const N = "https://www.mqulima.com/images/news";

export type Article = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  group: string;
  readTime: string;
  date: string;
  reads: number;
  image: string;
  body: string[];
};

export const articleFilters = ["All", "Agronomy & Farm Tips", "Policy & Market", "Agri-Tech & Tools", "Weather Advisory", "Livestock & Dairy"];

export const articles: Article[] = [
  {
    id: "milk-wars-why-kenya-s-dairy-industry-is-bordering-a-lose-lose-situation-1786",
    title: "Milk Wars: Why Kenya's Dairy Industry Is Bordering a Lose-Lose Situation",
    excerpt: "Milk Wars: Why Kenya's Dairy Industry Is Bordering a Lose-Lose Situation",
    category: "Livestock & Dairy", group: "Livestock & Dairy", readTime: "2 min read", date: "September 28, 2026", reads: 5,
    image: `${N}/milk-wars-why-kenya-s-dairy-industry-is-bordering-a-lose-lose-situation-1786-cover.webp`,
    body: [
      "Kenya's dairy sector, long celebrated as one of the most vibrant in Africa, is caught in a tug-of-war between processors, farmers and consumers. Farm-gate prices swing sharply between the flush and dry seasons, leaving farmers unable to plan.",
      "Processors argue that cheap imports and informal milk traders undercut their margins, while farmers say they are paid too little to cover feed, veterinary and labour costs. Consumers, meanwhile, see shelf prices that keep climbing.",
      "Without a coordinated approach — fair pricing formulas, investment in cooling infrastructure and stronger cooperatives — every player in the value chain risks losing. Farmers who invest in quality feed, record keeping and collective bargaining are best placed to weather the storm.",
    ],
  },
  {
    id: "kenyan-milk-economics-why-we-are-paying-dearly-for-milk-8728",
    title: "Kenyan Milk Economics: Why We Are Paying Dearly for Milk",
    excerpt: "Kenyan Milk Economics: Why We Are Paying Dearly for Milk",
    category: "Livestock & Dairy", group: "Livestock & Dairy", readTime: "2 min read", date: "September 27, 2026", reads: 3,
    image: `${N}/kenyan-milk-economics-why-we-are-paying-dearly-for-milk-8728-cover.webp`,
    body: [
      "The price of a packet of milk is the end result of a long chain of costs: animal feed, labour, transport, cooling, processing and packaging. Each link adds to what the consumer finally pays.",
      "Feed accounts for up to 70% of the cost of producing a litre of milk. When maize and soybean prices rise, dairy meal follows — and so does milk.",
      "Improving on-farm fodder production, silage making and feed formulation can cut costs for farmers and, over time, stabilise prices for consumers.",
    ],
  },
  {
    id: "the-way-the-truth-and-the-light-why-sheep-farming-might-be-kenya-s-best-bet-at-food-security-and-improving-incomes-2182",
    title: "Why Sheep Farming Is Kenya's Strategic Opportunity for Food Security and Farmer Incomes",
    excerpt: "The Way, The Truth and The Light: Why Sheep Farming Might Be Kenya's Best Bet at Food Security and Improving Incomes",
    category: "Livestock & Dairy", group: "Livestock & Dairy", readTime: "2 min read", date: "September 18, 2026", reads: 5,
    image: `${N}/the-way-the-truth-and-the-light-why-sheep-farming-might-be-kenya-s-best-bet-at-food-security-and-improving-incomes-2182-cover.webp`,
    body: [
      "Sheep are hardy, reproduce quickly and thrive on pasture that cattle would struggle on. For smallholders, they offer a low-cost entry into livestock farming.",
      "Demand for mutton is rising locally and across the Middle East export market, while wool and skins add extra income streams.",
      "With proper breeding, deworming and pasture management, a small flock can become a steady source of income and nutrition for rural households.",
    ],
  },
  {
    id: "why-the-cost-of-food-is-ever-rising-and-the-role-of-goons-in-all-these-7030",
    title: "Why Kenya's Food Costs Keep Rising: Supply Chain Bottlenecks and Market Reforms",
    excerpt: "Why the Cost of Food is ever-rising and the Role of goons in all these",
    category: "Markets", group: "Policy & Market", readTime: "2 min read", date: "September 17, 2026", reads: 3,
    image: `${N}/why-the-cost-of-food-is-ever-rising-and-the-role-of-goons-in-all-these-7030-cover.webp`,
    body: [
      "Between the farm gate and the market stall, food changes hands many times. Middlemen, informal levies and cartels at market entry points push prices up without adding value.",
      "Poor rural roads and lack of storage cause post-harvest losses that further squeeze supply.",
      "Transparent market price information, aggregation through cooperatives and direct farm-to-buyer linkages are key reforms that can bring prices down while raising farmer incomes.",
    ],
  },
  {
    id: "elnino-the-endless-rain-the-botched-harvests-and-where-the-mint-is-9013",
    title: "El Niño: Heavy Rains, Harvest Safeguards, and Agricultural Opportunities",
    excerpt: "Elnino: The Endless Rain, The botched harvests and where the mint is.",
    category: "Special Reports", group: "Weather Advisory", readTime: "2 min read", date: "September 16, 2026", reads: 1,
    image: `${N}/elnino-the-endless-rain-the-botched-harvests-and-where-the-mint-is-9013-cover.webp`,
    body: [
      "El Niño rains bring flooding, waterlogging and disease pressure — but also opportunity for farmers who prepare.",
      "Raised beds, proper drainage, timely fungicide application and early harvesting protect yields. Water harvesting and storage can extend production into the dry season.",
      "Fast-maturing vegetables, fodder crops and fish farming can turn abundant water into profit.",
    ],
  },
  {
    id: "african-swine-fever-kills-1-470-pigs-in-kiambu-as-outbreak-spreads-to-six-counties-2629",
    title: "African Swine Fever Kills 1,470 Pigs in Kiambu as Outbreak Spreads to Six Counties",
    excerpt: "African Swine Fever Kills 1,470 Pigs in Kiambu as Outbreak Spreads to Six Counties",
    category: "Livestock & Dairy", group: "Livestock & Dairy", readTime: "2 min read", date: "September 12, 2026", reads: 1,
    image: `${N}/african-swine-fever-kills-1-470-pigs-in-kiambu-as-outbreak-spreads-to-six-counties-2629-cover.webp`,
    body: [
      "An outbreak of African Swine Fever has killed 1,470 pigs in Kiambu and spread to six counties, according to veterinary officials.",
      "There is no vaccine or cure for ASF. Strict biosecurity — limiting visitors, disinfecting footwear, avoiding swill feeding and quarantining new stock — is the only defence.",
      "Farmers are urged to report sudden pig deaths to the nearest veterinary office immediately.",
    ],
  },
  {
    id: "september-weather-advisory-farmers-urged-to-plan-ahead-as-kenya-faces-changing-rainfall-conditions-5145",
    title: "September Weather Advisory: Farmers Urged to Plan Ahead as Kenya Faces Changing Rainfall Conditions",
    excerpt: "September Weather Advisory: Farmers Urged to Plan Ahead as Kenya Faces Changing Rainfall Conditions",
    category: "Special Reports", group: "Weather Advisory", readTime: "2 min read", date: "September 12, 2026", reads: 2,
    image: `${N}/september-weather-advisory-farmers-urged-to-plan-ahead-as-kenya-faces-changing-rainfall-conditions-5145-cover.webp`,
    body: [
      "The Kenya Meteorological Department forecasts uneven rainfall distribution across the country this season.",
      "Farmers should prepare land early, select drought-tolerant varieties and stock up on certified seed and fertilizer ahead of the onset of rains.",
      "Use Mqulima Tools to track the 7-day microclimate forecast for your county before planting or spraying.",
    ],
  },
];
