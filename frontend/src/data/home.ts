export const IMG = "https://www.mqulima.com";

export const hero = {
  image: `${IMG}/assets/hero-cinematic-640w-Bv20Fczx.webp`,
  badge: "Taking you first class",
  titleA: "Agriculture and",
  titleHighlight: "Success",
  titleB: "in One Basket",
  subtext:
    "Everything you need to know, learn, buy, hire, trade, treat or tell someone in one platform. Africa’s 360° agriculture ecosystem",
};

export const welcome = {
  title: "Welcome to the home of",
  highlight: "modern agriculture",
  p1: "We bring together every step of the agricultural journey to one home. Whether learning, producing, distributing, trading or adding value — just log into Mqulima. We are Africa's 360° agricultural ecosystem. We bring an end to guesswork, gossip, scattered information and unresponsive support. Because agriculture works better when everything works together.",
  p2: "We understand that what you do is priceless and we are devoted to making it easy, enjoyable and profitable.",
  quoteTitle: "Who is Mqulima?",
  quote:
    "\"Mqulima is a farmer’s world. At Mqulima, we are building a paradise for everyone in agriculture. With Mqulima, you get a first class seat to success.\"",
  image: `${IMG}/images/home-ecosystem-640w.webp`,
  imageKicker: "MQULIMA ECOSYSTEM",
  imageTitle: "Africa’s 360° Ag-Core",
};

export const ecosystemIntro = {
  badge: "THE ECOSYSTEM",
  title: "Explore the Mqulima Ecosystem.",
  highlight: "Agriculture Connected.",
  text: "Whatever your role in agriculture and wherever you sit in the chain, Mqulima connects you to the knowledge, products, services and people you need to succeed — all in one place.",
};

export const ecosystem = [
  { n: "01", emoji: "🛒", title: "Agroshop", text: "Source trusted agricultural products from verified suppliers and have them delivered to your doorstep.", cta: "View shop", route: "/(tabs)/shop" },
  { n: "02", emoji: "📈", title: "Insights", text: "Stay ahead with practical farming guides, market intelligence, expert articles, and timely updates.", cta: "View Updates", route: "/(tabs)/news" },
  { n: "03", emoji: "🛠️", title: "Services", text: "Access trusted professional services when and where you need them — from veterinary care to installation.", cta: "Book a Service", route: "/services" },
  { n: "04", emoji: "🤝", title: "Community", text: "Connect with thousands of farmers, experts, and agribusinesses to learn, share, and solve together.", cta: "Connect", route: "/(tabs)/forum" },
  { n: "05", emoji: "🎓", title: "Academy", text: "Master modern practical agriculture through structured learning and expert real-world guidance.", cta: "Visit Academy", route: "/academy" },
];

export const servicesIntro = {
  badge: "OUR SERVICES",
  title: "Everything your farm needs,",
  highlight: "in one place",
  text: "Because farming doesn’t stop at the field and no one can do everything by themselves, Mqulima Services puts every kind of support agriculture needs into one platform, one tap away. From finance to feed formulation one request away. Anything you need, just place a request and mqulima will send an expert because we understand how hectic it can be to manouver the search on your own.",
};

export const homeServiceCards = [
  { title: "Soil Services", icon: "sprout", image: `${IMG}/images/services/soil.webp`, text: "Improve soil productivity through testing, treatment and professional fertilizer recommendations.", items: ["Soil Testing & Analysis", "Soil Treatment & Conditioning", "Fertilizer Recommendation"], category: "soil" },
  { title: "Veterinary & Animal Health", icon: "stethoscope", image: `${IMG}/images/services/veterinary.webp`, text: "Professional veterinary care, breeding services, vaccinations and livestock diagnosis.", items: ["AI & Breeding", "Vaccination", "Veterinary Diagnosis", "Professional Vet Services"], category: "animal-health" },
  { title: "Animal Feeds", icon: "wheat", image: `${IMG}/images/services/animal_feeds.webp`, text: "Feed formulation, silage making and nutrition advisory for healthier, more productive livestock.", items: ["Feed Formulation", "Silage Shredding & Packing", "Feed Machinery", "Nutrition Advisory", "Pasture Establishment", "Mineral Supplementation"], category: "animal-nutrition" },
  { title: "Crop Production", icon: "leaf", image: `${IMG}/images/services/crop_production.webp`, text: "Land, machinery, storage, transport and agronomy support from planting to market.", items: ["Lease Land", "Rent Machinery", "Warehousing & Cold Storage", "Consult an Agronomist"], category: "crop" },
  { title: "Value Addition", icon: "package", image: `${IMG}/images/services/value_addition.webp`, text: "Turn raw produce into higher-value products with coaching and structured learning.", items: ["Get Coaching", "Learn Value Addition"], category: "value-addition" },
  { title: "Other Services", icon: "wrench", image: `${IMG}/images/services/other_services.webp`, text: "Infrastructure, water, energy and finance services that keep your farm running.", items: ["Boreholes & Hydro Survey", "Smart Solar Pumping", "Shed Construction", "Agri-Insurance & Finance"], category: "important" },
];

export const academyIntro = {
  badge: "STRUCTURED ACADEMY",
  title: "Farming is a science.",
  highlight: "Learn it like one.",
  text: "Master modern practical agriculture through structured learning, best practices, and real-world guidance designed to help you farm smarter and grow profitably. Go from amateur planter to commercial agribusiness owner.",
  steps: [
    { n: "01", title: "Foundations", text: "Understand soil diagnostics, water budgeting, and variety seed selection before planting." },
    { n: "02", title: "Crop Management", text: "Implement fertilizer application formulas and dynamic pest alert spray matrices." },
    { n: "03", title: "Agripreneurship", text: "Gain market access benchmarks, post-harvest logistics, and export certifications." },
  ],
};

export const whyWeExist = {
  badge: "WHY WE EXIST",
  title: "Building the Future",
  highlight: "of Agriculture",
  sub: "No farmer should have to gamble with their livelihood.",
  paras: [
    "For too long, farmers and agribusinesses have had to navigate fragmented information, disconnected services, scattered markets and countless decisions on their own. The knowledge exists. The expertise exists. The opportunities exist. They simply aren't connected.",
    "That's why we built Mqulima. To make agriculture easier, faster, profitable and enjoyable.",
    "We're creating Africa's 360° agricultural ecosystem — a place where farmers, traders, researchers, service providers and consumers come together to learn, collaborate and grow.",
  ],
  closing: "Because when everything works together, agriculture works better.",
  image: `${IMG}/assets/hero-farmer-woman-Bap2gIKz.webp`,
  imageKicker: "Verified Excellence",
  imageTitle: "Premium Agricultural Support",
  imageText: "Taking you first class in agronomy training.",
};

export const avatar = (name: string) =>
  `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(name)}&backgroundColor=1a5438&textColor=ffffff`;

export const testimonialsIntro = { badge: "SOCIAL PROOF", title: "Loved by farmers, trusted by", highlight: "agricultural experts" };

export const testimonials = [
  { name: "Kosgei Kiprono", role: "Crop Farmer, Elgeyo-Marakwet", tag: "Verified Producer", text: "Finally, a premium platform where farmers can access verified agronomy knowledge, products, and direct market linkage under one roof. First class execution." },
  { name: "Eliud Rotich", role: "Poultry Farmer, Bungoma", tag: "Poultry Specialist", text: "Clear, practical biosecurity and livestock instructions without complex jargon. Mqulima helped us optimize flock health and egg production in Western Kenya." },
];

export const stats = [
  { value: "47", label: "Counties Reached", sub: "Full Kenyan national coverage", icon: "map-pin" },
  { value: "1,000+", label: "Products Listed", sub: "100% verified quality inputs", icon: "shopping-bag" },
  { value: "200+", label: "Knowledge Articles", sub: "Agronomist approved research", icon: "book-open" },
];

export const journalIntro = {
  badge: "KNOWLEDGE HUB & JOURNALS",
  title: "Agronomy journals that keep",
  highlight: "farmers in the know",
  text: "The difference between crop failure and record-breaking yields is science-backed information. Our Journal aggregates practical research files from expert soil agronomists, veterinary surgeons, and market intelligence directors.",
};

export const joinCta = {
  badge: "JOIN THE ECOSYSTEM",
  title: "Ready to Experience Agriculture Differently?",
  text: "Agriculture is changing, and so should the way we learn, connect, and grow. Mqulima brings together practical knowledge, trusted services, quality products, and a thriving community into one modern ecosystem built for everyone in agriculture.",
};

export const contactInfo = {
  address: "Mqulima Hub, Eldoret, Uasin Gishu County, Kenya",
  phone: "+254 723 346 134",
  phoneRaw: "+254723346134",
  email: "mqulima@mqulima.com",
  whatsapp: "https://wa.me/254723346134?text=Hi%20Mqulima%2C%20I%27d%20like%20help%20with...",
  socials: [
    { name: "X", icon: "x-twitter", url: "https://x.com/_mqulima" },
    { name: "TikTok", icon: "tiktok", url: "https://tiktok.com/@_mqulima" },
    { name: "LinkedIn", icon: "linkedin", url: "https://linkedin.com/company/mqulima-hub" },
  ],
};

export const counties = ["Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa", "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi", "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya", "Taita-Taveta", "Tana River", "Tharaka-Nithi", "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"];
