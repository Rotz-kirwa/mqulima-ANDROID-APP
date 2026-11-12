const BACKEND_HOST = (process.env.EXPO_PUBLIC_BACKEND_URL || "https://www.mqulima.com").replace(/\/$/, "");
const S = `${BACKEND_HOST}/images`;

export type SubService = {
  id: string;
  numeral: string;
  title: string;
  tag: string;
  text: string;
  cta: string;
  action2Text?: string;
  image: string;
  iconName?: string;
  price?: string;
};

export type ServiceCategory = {
  id: string;
  n: string;
  title: string;
  servicesCountText?: string;
  text: string;
  image: string;
  cta: string;
  action2Text?: string;
  iconName?: string;
  subs: SubService[];
};

export type ServiceTool = {
  id: string;
  number: number;
  name: string;
  description: string;
  iconName: string;
  action1Text: string;
  action2Text: string;
  route: string;
};

export const servicesHero = {
  badge: "MQULIMA SERVICES",
  title: "Services",
  heroImage: `${S}/self-hosted/farm-field-banner-640w.webp`,
  text: "Because farming doesn’t stop at the field and no one can do everything by themselves, Mqulima Services puts every kind of support agriculture needs into one platform, one tap away. From finance to feed formulation one request away. Anything you need, just place a request and mqulima will send an expert because we understand how hectic it can be to manouver the search on your own.",
  trust: ["Vetted professionals", "Nationwide coverage", "Transparent pricing"],
  stats: [
    { v: "2,400+", l: "Farmers served", icon: "user" },
    { v: "30+", l: "Specialist services", icon: "sprout" },
    { v: "47", l: "Counties covered", icon: "map-pin" },
    { v: "< 10 mins", l: "Average response", icon: "phone" },
  ],
};

export const categoryFilters = [
  { id: "all", label: "All Categories (8)" },
  { id: "finance", label: "01. Finance & Insurance (3)" },
  { id: "soil", label: "02. Soil Services (3)" },
  { id: "crop", label: "03. Crop Services (6)" },
  { id: "animal-health", label: "04. Animal & Health (3)" },
  { id: "animal-nutrition", label: "05. Animal Nutrition (4)" },
  { id: "irrigation", label: "06. Irrigation Services (4)" },
  { id: "value-addition", label: "07. Value Addition (2)" },
  { id: "important", label: "08. Important Services (4)" },
];

export const servicesTools: ServiceTool[] = [
  {
    id: "live_markets",
    number: 38,
    name: "Live Markets",
    description: "See real-time prices across markets before you sell or buy, so every transaction is made with full information, not guesswork.",
    iconName: "trending-up",
    action1Text: "View Markets",
    action2Text: "Learn More",
    route: "/tools/markets",
  },
  {
    id: "weather_forecast",
    number: 39,
    name: "Weather Forecast",
    description: "Know beyond 10-day weather forecast\n\nKnow what the sky is planning before planning for your farm. Plan planting, spraying and harvesting around forecasts built for farmers.",
    iconName: "sun",
    action1Text: "Weather Forecast",
    action2Text: "Learn More",
    route: "/tools/weather",
  },
  {
    id: "weather_advisory",
    number: 40,
    name: "Weather Advisory",
    description: "Get practical, farmer-focused guidance on what today’s, next week’s and next year’s weather means for your specific agriculture decisions.",
    iconName: "activity",
    action1Text: "Consult Expert",
    action2Text: "Learn More",
    route: "/tools/weather",
  },
  {
    id: "mqulima_ai",
    number: 41,
    name: "Mqulima AI",
    description: "Get instant, intelligent answers to your agricultural questions, powered by AI built specifically for your agriculture.",
    iconName: "sparkles",
    action1Text: "Ask MqulimaAI",
    action2Text: "Learn More",
    route: "/ai",
  },
];

// Pricing guide + process for each sub-service detail page (indicative; final quote after assessment).
const PRICES: Record<string, string> = {
  agri_loans_credit: "Rates from 1.2% / month",
  agri_insurance: "Premiums from KSh 1,500 / season",
  financial_advisory: "KSh 2,500 / session",
  soil_testing_analysis: "From KSh 2,500 / sample",
  soil_treatment: "From KSh 4,000 / acre",
  fertilizer_recommendation: "KSh 1,000 / plan",
  lease_land: "From KSh 8,000 / acre / season",
  rent_machinery: "From KSh 3,500 / acre",
  warehousing_cold_storage: "From KSh 50 / crate / month",
  transportation: "From KSh 120 / km",
  greenhouse: "From KSh 180,000 (8m x 15m)",
  consult_agronomist: "KSh 2,000 / farm visit",
  ai_breeding: "From KSh 1,500 / insemination",
  veterinary_diagnosis_treatment: "From KSh 1,000 / visit",
  vaccination: "From KSh 100 / head",
  feed_formulation: "KSh 3,000 / formula",
  silage_shredding_packing: "From KSh 1,800 / ton",
  buy_rent_machinery_feed: "From KSh 2,500 / day",
  animal_nutrition_advisory: "KSh 2,000 / session",
  borehole_sinking: "Survey from KSh 25,000",
  irrigation_irrigation_systems: "From KSh 35,000 / acre",
  water_engineering: "Assessment from KSh 10,000",
  consult_irrigation_expert: "KSh 2,500 / session",
  get_coaching: "KSh 3,000 / session",
  learn_value_addition: "Free with Academy access",
  shed_construction: "From KSh 1,200 / sq ft",
  climate_smart_agriculture: "KSh 2,500 / plan",
  buy_machinery: "Market price",
  incubation: "Cohort application — free",
};

const s = (
  id: string,
  numeral: string,
  title: string,
  tag: string,
  text: string,
  cta: string,
  img: string,
  iconName = "sprout",
  action2Text = "Learn More"
): SubService => ({
  id,
  numeral,
  title,
  tag,
  text,
  cta,
  action2Text,
  image: `${S}/${img}`,
  iconName,
  price: PRICES[id] ?? "Quote on request",
});

export const serviceCategories: ServiceCategory[] = [
  {
    id: "finance",
    n: "01",
    title: "Finance & Insurance",
    servicesCountText: "3 Services Included",
    image: `${S}/services/finance_insurance_cat.webp`,
    cta: "Get Financed",
    action2Text: "Learn More",
    iconName: "landmark",
    text: "To succeed you need capital, and risks need to covered. Mqulima connects you to both. We get you credit that gets your season moving to insurance that protects what you’ve built, your financial future in agriculture starts here.",
    subs: [
      s("agri_loans_credit", "I", "Agri loans & Credit", "Custom Credit", "In agriculture, we understand harvesting isn’t every end month, so we give you access to credit built for the realities of farming- seasonal, flexible and sized to your enterprise. Get the capital moving before the planting window closes.", "Get Credit", "services/agri_loans_credit.webp", "landmark"),
      s("agri_insurance", "II", "Agri insurance", "Tailored Premium", "Protect your harvest, your livestock and your investment against the risks you can’t control. One bad season shouldn’t undo years of work.", "Get Quote", "services/agri_insurance.webp", "shield-check"),
      s("financial_advisory", "III", "Financial advisory", "Advisory Session", "Get expert guidance on managing, growing and protecting your agricultural income. Make every shilling work as hard as you do.", "Get Advise", "self-hosted/service-business-planning.webp", "briefcase"),
    ],
  },
  {
    id: "soil",
    n: "02",
    title: "Soil services",
    servicesCountText: "3 Services Included",
    image: `${S}/services/soil.webp`,
    cta: "View Soil Services",
    action2Text: "Learn More",
    iconName: "flask-conical",
    text: "Great harvests start below the surface. They start before any seed is bought. Mqulima’s soil services tell you exactly what your land needs and what to do about it before you plant a single seed.",
    subs: [
      s("soil_testing_analysis", "I", "Soil testing and analysis", "On Request", "Know exactly what’s in your soil before you invest in it. Precise testing turns guesswork into a plan.", "Test your soil", "services/soil_testing_analysis.webp", "flask-conical"),
      s("soil_treatment", "II", "Soil treatment", "On Request", "Correct what your soil is missing and unlock the yield it’s capable of. Healthier soil, stronger harvests.", "Get Soil Treatment", "services/soil_treatment.webp", "sparkles"),
      s("fertilizer_recommendation", "III", "Fertilizer recommendation", "On Request", "Get the right fertilizer, in the right quantity, matched precisely to your soil and your crop. Stop overspending on inputs your land doesn’t need.", "See soil recommendation", "services/fertilizer_recommendation.webp", "sprout"),
    ],
  },
  {
    id: "crop",
    n: "03",
    title: "Crop services",
    servicesCountText: "6 Services Included",
    image: `${S}/services/crop_services_cat.webp`,
    cta: "View Crop Services",
    action2Text: "Learn More",
    iconName: "sprout",
    text: "From the land you farm on to the market you sell into, Mqulima’s crop services cover every stage of the journey. From land preparation, through harvesting to storage, machinery, expertise and more built around getting you to harvest the best possible outcome.",
    subs: [
      s("lease_land", "I", "Lease land", "Per Acre / Season", "Don’t get caught up in land lease con game and in endless search. Find and access farmland that fits your enterprise, without the long search or the guesswork. Expand your production on your terms.", "Lease Land", "services/lease_land.webp", "map-pin"),
      s("rent_machinery", "II", "Rent machinery", "Per Acre / Hour", "Access the equipment your operation needs, exactly when you need it.", "Machinery", "services/rent_machinery.webp", "tractor"),
      s("warehousing_cold_storage", "III", "Warehousing and Cold storage", "Per Crate / Month", "Protect your harvest from loss and spoilage with storage built for agricultural produce. Sell on your schedule, not because your produce is at risk.", "Lease Storage", "services/warehousing_cold_storage.webp", "warehouse"),
      s("transportation", "IV", "Transportation", "Per Trip / Ton", "Move your produce from farm to market or wherever you want them reliably and on time. Distance shouldn’t be the reason a harvest goes to waste.", "Get Transport Services", "services/transportation.webp", "truck"),
      s("greenhouse", "V", "Greenhouse", "Turnkey Package", "Access greenhouse solutions that extend your growing season and protect your crop from the unpredictable. Grow more, more consistently.", "Get Quotation", "services/greenhouse.webp", "building-2"),
      s("consult_agronomist", "VI", "Consult an Agronomist", "On Request", "Get expert crop guidance tailored to your farm, your soil and your goals. Make every planting decision an informed one.", "Consult Agronomist", "services/consult_agronomist.webp", "user-check"),
    ],
  },
  {
    id: "animal-health",
    n: "04",
    title: "Animal & Health services",
    servicesCountText: "3 Services Included",
    image: `${S}/services/veterinary.webp`,
    cta: "Browse Animal Services",
    action2Text: "Learn More",
    iconName: "stethoscope",
    text: "Healthy livestock is the foundation of a thriving herd. Mqulima connects you to breeding, diagnosis and treatment expertise so your animals and your income stay protected.",
    subs: [
      s("ai_breeding", "I", "AI & Breeding", "Per Insemination", "Improve your herd’s genetics and productivity with professional artificial insemination and breeding services. Build a stronger herd, one generation at a time.", "Get Breeding Services", "services/ai_breeding.webp", "heart-pulse"),
      s("veterinary_diagnosis_treatment", "II", "Veterinary Diagnosis & Treatment", "Clinical Visit", "Get fast, professional diagnosis and treatment when your animals need it most. A healthy herd starts with timely care.", "Call Vet", "services/veterinary_diagnosis_treatment.webp", "stethoscope"),
      s("vaccination", "III", "Vaccination", "Per Herd / Head", "Protect your livestock from preventable disease with accessible, professional vaccination services. Prevention is always cheaper than loss.", "Vaccinate", "self-hosted/service-livestock-vet.webp", "syringe"),
    ],
  },
  {
    id: "animal-nutrition",
    n: "05",
    title: "Animal Nutrition",
    servicesCountText: "4 Services Included",
    image: `${S}/services/animal_feeds.webp`,
    cta: "Nutritional Services",
    action2Text: "Learn More",
    iconName: "wheat",
    text: "What you feed your animals determines what they give back. Mqulima helps you formulate, source and manage the right nutrition, at the right scale, every time.",
    subs: [
      s("feed_formulation", "I", "Feed formulation", "Formulation Plan", "Get feed formulated precisely for your animals’ needs and your production goals. Better nutrition, better output.", "The Formula", "services/feed_formulation.webp", "scale"),
      s("silage_shredding_packing", "II", "Silage shredding and packing", "Per Ton / Bale", "Preserve quality feed for the seasons when pasture runs low. Never let a good harvest of fodder go to waste.", "Book Service", "services/silage.webp", "package-check"),
      s("buy_rent_machinery_feed", "III", "Buy/Rent machinery", "Daily / Weekly", "Access the equipment behind efficient feed production and processing, without the cost of owning it outright.", "Rent Machinery", "services/machinery_rental.webp", "cog"),
      s("animal_nutrition_advisory", "IV", "Advisory", "On Request", "Get expert guidance on animal nutrition strategy, matched to your herd size, goals and budget.", "Consult an Expert", "services/feed_advice.webp", "message-square"),
    ],
  },
  {
    id: "irrigation",
    n: "06",
    title: "Irrigation services",
    servicesCountText: "4 Services Included",
    image: `${S}/services/irrigation.webp`,
    cta: "Irrigation Services",
    action2Text: "Learn More",
    iconName: "droplets",
    text: "Water, delivered with precision. Mqulima connects you to the drilling, engineering and irrigation expertise that turns unpredictable rainfall into a farm you can rely on.",
    subs: [
      s("borehole_sinking", "I", "Borehole sinking", "Survey & Sinking", "Secure a reliable water source for your farm, professionally drilled and built to last. You don’t need to go through an entire ocean of lies and promises that never come true. Get plugged today", "Sink Borehole", "services/borehole_sinking.webp", "droplets"),
      s("irrigation_irrigation_systems", "II", "Irrigation & irrigation systems", "Per Acre Setup", "Get irrigation systems designed and installed for your specific land and crop. Your vision deserves precision and at Mqulima we give life to your vision.", "Book Service", "services/irrigation_systems.webp", "droplets"),
      s("water_engineering", "III", "Water engineering", "Engineering Assessment", "Access professional engineering expertise for water systems built to serve you long-term.", "Get Water", "services/water_engineering.webp", "wrench"),
      s("consult_irrigation_expert", "IV", "Consult an irrigation expert", "On Request", "Get expert advice on the right irrigation approach for your land, crop and budget, before you invest a shilling.", "Consult an Expert", "services/consult_irrigation_expert.webp", "user-check"),
    ],
  },
  {
    id: "value-addition",
    n: "07",
    title: "Value Addition",
    servicesCountText: "2 Services Included",
    image: `${S}/services/value_addition.webp`,
    cta: "See Services",
    action2Text: "Learn More",
    iconName: "award",
    text: "Raw produce earns raw prices. Mqulima helps you learn and apply value addition so what leaves your farm is worth more than what you planted. It doesn’t end at learning, it ends at the market and success.",
    subs: [
      s("get_coaching", "I", "Get Coaching", "Coaching Sessions", "Learn directly from professionals who can help you turn raw produce into a more profitable product.", "Consult an Expert", "services/get_coaching.webp", "user-check"),
      s("learn_value_addition", "II", "Learn Value addition", "Academy Access", "Access structured knowledge on processing, packaging and positioning your produce for higher returns.", "Learn Value Addition", "services/learn_value_addition.webp", "book-open", ""),
    ],
  },
  {
    id: "important",
    n: "08",
    title: "Important Services",
    servicesCountText: "4 Services Included",
    image: `${S}/services/other_services.webp`,
    cta: "See What’s Important",
    action2Text: "Learn More",
    iconName: "wrench",
    text: "Some needs don’t fit neatly into a single category — but they still shape your success. From infrastructure to innovation, Mqulima brings these essential services within reach.",
    subs: [
      s("shed_construction", "I", "Shed Construction", "Per Structure", "Get professional construction support for the storage, livestock or processing sheds your operation needs.", "Construct Shed", "services/shed_construction.webp", "building-2"),
      s("climate_smart_agriculture", "II", "Climate Smart Agriculture", "Advisory Protocol", "Access practices and expertise that help your farm stay productive and resilient as the climate changes around it.", "Become Climate Smart", "services/crop_production.webp", "sun"),
      s("buy_machinery", "III", "Buy machinery", "Market Price", "Access agricultural machinery built to move your operation from manual effort to mechanised efficiency.", "Browse Listings", "services/buy_machinery.webp", "tractor"),
      s("incubation", "IV", "Incubation", "Cohort Program", "Get structured support to take an agricultural idea or enterprise from concept to a functioning business.", "Incubation Services", "services/incubation.webp", "sparkles"),
    ],
  },
];

export const serviceSteps = [
  { title: "Place a request", text: "Tell us what you need, where your farm is and when." },
  { title: "Get matched in minutes", text: "Mqulima assigns a vetted specialist near you — average response under 10 minutes." },
  { title: "Confirm your quote", text: "Receive a transparent quote before any work starts. Pay securely via M-Pesa." },
  { title: "Service delivered", text: "Your specialist visits or consults, then you rate the service." },
];

export const serviceIncludes = [
  "Vetted, certified professional",
  "Transparent written quote",
  "Follow-up support on WhatsApp",
  "Service guarantee & rating",
];

export function getSubService(id: string) {
  for (const c of serviceCategories) {
    const sub = c.subs.find((x) => x.id === id);
    if (sub) return { sub, category: c, price: PRICES[id] ?? "Quote on request" };
  }
  return undefined;
}
