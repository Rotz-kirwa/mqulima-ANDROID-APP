// Certified agricultural products catalog for Mqulima AgroShop (320+ products)
// Synchronized with live Mqulima (Kirgit Agri) production platform & Kenyan agrovet inventory.

import { catalogProducts } from "./catalog";

const P = "https://www.mqulima.com/images";
const ph = (n: string) => `${P}/placeholders/${n}.webp`;

export type Variant = { label: string; price: number };

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  stock: number;
  description: string;
  featured?: boolean;
  variants?: Variant[];
  rating: number;
  brand?: string;
  seller?: string;
  unit?: string;
};

export const productCategories = [
  "All",
  "Inputs & Agrochemicals",
  "Seeds",
  "Fertilizers",
  "Animal Feeds",
  "Animal Health",
  "Farm Equipment",
] as const;

export type ProductCategory = (typeof productCategories)[number];

export const ksh = (n: number) => `KSh ${(n || 0).toLocaleString("en-US")}`;

const DESC_DEFAULT = "Certified genuine agricultural input for farm use. Verified by agronomists.";

const BASE_PRODUCTS: Product[] = [
  // =========================================================================
  // 1. FEATURED HERO PRODUCTS & PROMOTIONS (12 products)
  // =========================================================================
  {
    id: "farm-tools-set",
    name: "Farm Tools Complete Kit",
    category: "Farm Equipment",
    price: 1200,
    image: ph("farm_tools"),
    stock: 25,
    featured: true,
    rating: 4.8,
    description: "Durable forged steel hand tools for everyday farm cultivation — jembe, panga, rake, and pruners from certified manufacturers.",
    variants: [{ label: "Jembe Standard", price: 1200 }, { label: "Panga 18-inch", price: 650 }, { label: "Garden Rake", price: 900 }],
  },
  {
    id: "20l-heavy-duty-knapsack-sprayer",
    name: "20L Heavy Duty Knapsack Sprayer",
    category: "Farm Equipment",
    price: 3500,
    image: `${P}/products/knapsack_sprayer_20l.webp`,
    stock: 45,
    featured: true,
    rating: 4.9,
    description: "Heavy-duty 20-litre manual knapsack sprayer with adjustable solid brass lance, padded shoulder harness, and internal pressure chamber for consistent droplet coverage.",
    variants: [{ label: "20 Litre", price: 3500 }, { label: "16 Litre", price: 2800 }],
  },
  {
    id: "smoothsale-high-protein-dairy-mash",
    name: "SmoothSale High-Protein Dairy Mash",
    category: "Animal Feeds",
    price: 2900,
    image: `${P}/products/dairy_mash.webp`,
    stock: 60,
    featured: true,
    rating: 4.8,
    description: "Nutrient-balanced high-protein dairy mash formulated to boost daily milk yield, sustain lactation persistence, and maintain prime cow body condition.",
    variants: [{ label: "35KG", price: 2900 }, { label: "70KG", price: 5600 }],
  },
  {
    id: "high-yield-layer-chicken-feed",
    name: "High-Yield Layer Chicken Feed",
    category: "Animal Feeds",
    price: 3400,
    image: `${P}/products/chicken_feed.webp`,
    stock: 50,
    featured: true,
    rating: 4.7,
    description: "Complete balanced layers mash enriched with digestible calcium, methionine, and essential amino acids for strong egg shells and uniform lay percentages.",
    variants: [{ label: "50KG", price: 3400 }, { label: "10KG", price: 780 }],
  },
  {
    id: "high-protein-dairy-meal",
    name: "High-Protein Dairy Meal 18%",
    category: "Animal Feeds",
    price: 3100,
    image: `${P}/products/high_yield_dairy_meal.webp`,
    stock: 35,
    featured: true,
    rating: 4.6,
    description: "Premium commercial dairy meal with bypass protein, phosphorus, and trace minerals designed for high-producing cows yielding over 20 litres daily.",
    variants: [{ label: "50KG", price: 3100 }, { label: "70KG", price: 4200 }],
  },
  {
    id: "smoothsale-motorized-backpack-knapsack-sprayer",
    name: "SmoothSale 25L Motorized Mist Blower Sprayer",
    category: "Farm Equipment",
    price: 14500,
    image: `${P}/products/motorized_knapsack.webp`,
    stock: 15,
    featured: true,
    rating: 4.9,
    description: "2-stroke petrol-powered 25L motorized backpack mister blower for rapid pest and blight control in orchards, coffee plantations, and large crop fields.",
  },
  {
    id: "smoothsale-npk-17-17-17-fertilizer",
    name: "SmoothSale NPK 17:17:17 Granular Fertilizer",
    category: "Fertilizers",
    price: 4200,
    image: `${P}/products/yara_npk_17_17_17.webp`,
    stock: 80,
    featured: true,
    rating: 4.8,
    description: "Balanced compound granular fertilizer containing equal proportions of nitrogen, phosphorus, and potassium for basal planting and vigorous vegetative growth.",
    variants: [{ label: "50KG", price: 4200 }, { label: "25KG", price: 2200 }, { label: "10KG", price: 950 }],
  },
  {
    id: "premium-npk-20-20-20-fertilizer",
    name: "Premium NPK 20:20:20 Foliar Fertilizer",
    category: "Fertilizers",
    price: 850,
    image: `${P}/products/npk_20_20_20.webp`,
    stock: 70,
    featured: true,
    rating: 4.7,
    description: "100% water-soluble crystalline foliar and fertigation fertilizer with chelated trace elements (TE) for rapid nutrient uptake and correction of deficiencies.",
    variants: [{ label: "1KG", price: 850 }, { label: "5KG", price: 3900 }],
  },
  {
    id: "seaweed-organic-growth-booster",
    name: "Seaweed Organic Growth Booster Biostimulant",
    category: "Fertilizers",
    price: 1100,
    image: `${P}/products/seaweed_growth_booster.webp`,
    stock: 40,
    featured: true,
    rating: 4.9,
    description: "Cold-pressed pure organic Ascophyllum nodosum seaweed extract biostimulant that accelerates root development, enhances flowering, and mitigates drought stress.",
    variants: [{ label: "1L", price: 1100 }, { label: "500ML", price: 650 }, { label: "5L", price: 4800 }],
  },
  {
    id: "duduthrin-175ec",
    name: "DUDUTHRIN 1.75EC Pyrethroid Insecticide",
    category: "Inputs & Agrochemicals",
    price: 250,
    image: ph("agrochemical"),
    stock: 90,
    featured: true,
    rating: 4.6,
    description: "Broad-spectrum contact and stomach pyrethroid insecticide containing lambda-cyhalothrin for controlling caterpillars, aphids, thrips, and beetles.",
    variants: [{ label: "100ML", price: 250 }, { label: "250ML", price: 450 }, { label: "1L", price: 1500 }],
  },
  {
    id: "h614d-hybrid-maize-seed",
    name: "H614D Kenya Seed Hybrid Maize",
    category: "Seeds",
    price: 550,
    image: ph("seeds"),
    stock: 120,
    featured: true,
    rating: 4.9,
    description: "Certified Kenya Seed Company highland hybrid maize seed known for excellent double cobbing, strong disease resistance, and high grain yield per acre.",
    variants: [{ label: "2KG", price: 550 }, { label: "10KG", price: 2600 }, { label: "25KG", price: 6200 }],
  },
  {
    id: "albendazole-10-drench",
    name: "Albendazole 10% Broad Spectrum Worm Drench",
    category: "Animal Health",
    price: 300,
    image: ph("livestock"),
    stock: 75,
    featured: true,
    rating: 4.7,
    description: "Broad-spectrum anthelmintic oral drench for eradication of roundworms, lungworms, tapeworms, and adult liver flukes in cattle, sheep, and goats.",
    variants: [{ label: "100ML", price: 300 }, { label: "500ML", price: 1100 }, { label: "1L", price: 1900 }],
  },

  // =========================================================================
  // 2. INPUTS & AGROCHEMICALS (65 products)
  // =========================================================================
  { id: "rocket-44ec", name: "ROCKET 44EC Insecticide", category: "Inputs & Agrochemicals", price: 350, image: ph("agrochemical"), stock: 40, rating: 4.5, description: "Profenofos + cypermethrin dual action insecticide for tough pests like bollworms and diamondback moths.", variants: [{ label: "100ML", price: 350 }, { label: "250ML", price: 750 }, { label: "1L", price: 2600 }] },
  { id: "ridomil-gold-mz-68wg", name: "RIDOMIL GOLD MZ 68WG Systemic Fungicide", category: "Inputs & Agrochemicals", price: 280, image: ph("agrochemical"), stock: 55, rating: 4.9, description: "Metalaxyl-M + mancozeb systemic and contact fungicide for controlling early and late blight in potatoes, tomatoes, and vegetables.", variants: [{ label: "50GMS", price: 280 }, { label: "250GMS", price: 1100 }, { label: "1KG", price: 3900 }] },
  { id: "milestone-250sc", name: "MILESTONE 250SC Broad Spectrum Fungicide", category: "Inputs & Agrochemicals", price: 550, image: ph("agrochemical"), stock: 30, rating: 4.6, description: "Azoxystrobin suspension concentrate fungicide for rusts, powdery mildew, and leaf spots.", variants: [{ label: "40ML", price: 550 }, { label: "100ML", price: 1200 }] },
  { id: "belt-expert-480sc", name: "BELT EXPERT 480SC Bayer Insecticide", category: "Inputs & Agrochemicals", price: 450, image: ph("agrochemical"), stock: 35, rating: 4.8, description: "Flubendiamide + thiacloprid insecticide for fast knockdown of fall armyworm and lepidopteran pests.", variants: [{ label: "10ML", price: 450 }, { label: "50ML", price: 1800 }] },
  { id: "tridex-80wp", name: "TRIDEX 80WP Mancozeb Protectant Fungicide", category: "Inputs & Agrochemicals", price: 300, image: ph("agrochemical"), stock: 65, rating: 4.4, description: "Protective contact fungicide providing broad disease prevention on horticultural crops.", variants: [{ label: "200GMS", price: 300 }, { label: "1KG", price: 1100 }] },
  { id: "escort-19ec", name: "ESCORT 19EC Emamectin Benzoate", category: "Inputs & Agrochemicals", price: 400, image: ph("agrochemical"), stock: 25, rating: 4.5, description: "Fast penetrative translaminar insecticide effective against tuta absoluta and diamondback moth.", variants: [{ label: "25ML", price: 400 }, { label: "100ML", price: 1300 }] },
  { id: "alien-50ec", name: "ALIEN 50EC Chlorpyrifos Insecticide", category: "Inputs & Agrochemicals", price: 350, image: ph("agrochemical"), stock: 30, rating: 4.3, description: "Potent organophosphate insecticide for soil pests, termites, and cutworms.", variants: [{ label: "50ML", price: 350 }, { label: "100ML", price: 600 }] },
  { id: "katerina-300sl", name: "KATERINA 300SL Selective Post-Emergence Herbicide", category: "Inputs & Agrochemicals", price: 900, image: ph("agrochemical"), stock: 20, rating: 4.4, description: "Selective post-emergence herbicide for broadleaved weeds in maize and cereal plantations.", variants: [{ label: "500ML", price: 900 }, { label: "1L", price: 1700 }] },
  { id: "glyphosate-480sl", name: "GLYPHOSATE 480SL Non-Selective Herbicide", category: "Inputs & Agrochemicals", price: 750, image: ph("agrochemical"), stock: 85, rating: 4.7, description: "Systemic non-selective post-emergence herbicide for land preparation, couch grass, and perennial weeds.", variants: [{ label: "1L", price: 750 }, { label: "5L", price: 3300 }] },
  { id: "copper-oxychloride-50wp", name: "COPPER OXYCHLORIDE 50WP Bactericide/Fungicide", category: "Inputs & Agrochemicals", price: 450, image: ph("agrochemical"), stock: 50, rating: 4.5, description: "Inorganic copper fungicide and bactericide for coffee berry disease, bacterial canker, and blights.", variants: [{ label: "500GMS", price: 450 }, { label: "1KG", price: 850 }] },
  { id: "thunder-145od", name: "THUNDER 145OD Bayer Systemic Insecticide", category: "Inputs & Agrochemicals", price: 900, image: ph("agrochemical"), stock: 28, rating: 4.8, description: "Imidacloprid + beta-cyfluthrin oil dispersion formulation for sucking and chewing pests with anti-washoff technology.", variants: [{ label: "100ML", price: 900 }, { label: "250ML", price: 2000 }] },
  { id: "actara-25wg", name: "ACTARA 25WG Thiamethoxam Systemic Insecticide", category: "Inputs & Agrochemicals", price: 120, image: ph("agrochemical"), stock: 110, rating: 4.9, description: "High-potency water-dispersible systemic insecticide providing root uptake and foliar protection against aphids, whiteflies, and thrips.", variants: [{ label: "4GMS", price: 120 }, { label: "8GMS", price: 220 }, { label: "50GMS", price: 1200 }] },
  { id: "mancozeb-80wp", name: "MANCOZEB 80WP Agricultural Fungicide", category: "Inputs & Agrochemicals", price: 250, image: ph("agrochemical"), stock: 95, rating: 4.4, description: "Economic multi-site contact fungicide for controlling downy mildew, leaf spots, and rusts.", variants: [{ label: "250GMS", price: 250 }, { label: "1KG", price: 800 }] },
  { id: "topsin-m-70wp", name: "TOPSIN-M 70WP Thiophanate-Methyl Fungicide", category: "Inputs & Agrochemicals", price: 400, image: ph("agrochemical"), stock: 35, rating: 4.5, description: "Systemic curative fungicide for powdery mildew, anthracnose, and root rots.", variants: [{ label: "100GMS", price: 400 }, { label: "500GMS", price: 1600 }] },
  { id: "sherpa-plus", name: "SHERPA PLUS Pyrethroid Crop Insecticide", category: "Inputs & Agrochemicals", price: 400, image: ph("agrochemical"), stock: 45, rating: 4.4, description: "Contact insecticide with quick knock-down action on chewing insects in horticulture.", variants: [{ label: "100ML", price: 400 }, { label: "500ML", price: 1500 }] },
  { id: "confidor-200sl", name: "CONFIDOR 200SL Imidacloprid Insecticide", category: "Inputs & Agrochemicals", price: 450, image: ph("agrochemical"), stock: 40, rating: 4.7, description: "Long-lasting systemic protection against whiteflies, aphids, and sap-sucking insects in tomatoes and vegetables.", variants: [{ label: "50ML", price: 450 }, { label: "100ML", price: 800 }] },
  { id: "nimbecidine-neem-oil", name: "NIMBECIDINE Pure Neem Bio-Pesticide", category: "Inputs & Agrochemicals", price: 650, image: ph("agrochemical"), stock: 30, rating: 4.8, description: "Natural 0.03% Azadirachtin organic bio-insecticide safe for beneficial pollinators and organic crop production.", variants: [{ label: "250ML", price: 650 }, { label: "1L", price: 2200 }] },
  { id: "dithane-m45", name: "DITHANE M45 Agricultural Fungicide", category: "Inputs & Agrochemicals", price: 300, image: ph("agrochemical"), stock: 70, rating: 4.6, description: "World-standard mancozeb protectant fungicide offering reliable rainfastness on potatoes and ornamentals.", variants: [{ label: "200GMS", price: 300 }, { label: "1KG", price: 1050 }] },
  { id: "sulphur-80wg", name: "SULPHUR 80WG Micronized Wetting Fungicide", category: "Inputs & Agrochemicals", price: 400, image: ph("agrochemical"), stock: 45, rating: 4.5, description: "Dual-action micronized sulphur fungicide and miticide for powdery mildew and red spider mites.", variants: [{ label: "500GMS", price: 400 }, { label: "1KG", price: 750 }] },
  { id: "weedal-480sl", name: "WEEDAL 480SL Non-Selective Herbicide", category: "Inputs & Agrochemicals", price: 500, image: ph("agrochemical"), stock: 65, rating: 4.4, description: "Water-soluble systemic herbicide for complete weed clearance in tea, coffee, and farm plots.", variants: [{ label: "500ML", price: 500 }, { label: "200ML", price: 300 }, { label: "1L", price: 900 }] },
  { id: "zetanil-240gms", name: "ZETANIL 240GMS Cymoxanil Blight Fungicide", category: "Inputs & Agrochemicals", price: 500, image: ph("agrochemical"), stock: 40, rating: 4.5, description: "Cymoxanil + mancozeb dual systemic and contact anti-blight fungicide for wet cold seasons.", variants: [{ label: "240GMS", price: 500 }] },
  { id: "macarena-tm-100ml", name: "MACARENA TM 100ML Systemic Miticide", category: "Inputs & Agrochemicals", price: 600, image: ph("agrochemical"), stock: 25, rating: 4.3, description: "Specialized miticide offering ovicidal and adulticidal control of mites and scale insects." },
  { id: "hispeid-25ml", name: "HISPEID 25ML Concentrated Insecticide", category: "Inputs & Agrochemicals", price: 100, image: ph("agrochemical"), stock: 50, rating: 4.2, description: "Affordable fast-acting concentrated insect spray for kitchen gardens and backyard plots." },
  { id: "aquawet-15sl", name: "AQUAWET 15SL Non-Ionic Wetting & Spreading Agent", category: "Inputs & Agrochemicals", price: 400, image: ph("agrochemical"), stock: 60, rating: 4.6, description: "Agricultural adjuvant and surfactant that improves spray adhesion, droplet spreading, and pesticide penetration.", variants: [{ label: "500ML", price: 400 }, { label: "100ML", price: 100 }, { label: "30ML", price: 100 }] },
  { id: "hygienic-7-5sc-20ml", name: "HYGIENIC 7.5%SC 20ML Public Health Insecticide", category: "Inputs & Agrochemicals", price: 100, image: ph("agrochemical"), stock: 45, rating: 4.3, description: "Multi-purpose public health insecticide for tick, flea, cockroach, and mosquito control around farm buildings." },
  { id: "roundup-360sl-1l", name: "ROUNDUP 360SL Original Glyphosate Herbicide", category: "Inputs & Agrochemicals", price: 950, image: ph("agrochemical"), stock: 55, rating: 4.8, description: "Original Bayer Roundup formulation with built-in Transorb adjuvant for quick weed translocative kill.", variants: [{ label: "1L", price: 950 }, { label: "5L", price: 4200 }] },
  { id: "decis-25ec", name: "DECIS 2.5EC Deltamethrin Insecticide", category: "Inputs & Agrochemicals", price: 320, image: ph("agrochemical"), stock: 45, rating: 4.6, description: "Deltamethrin contact insecticide with strong repellent and anti-feeding effect on caterpillars.", variants: [{ label: "100ML", price: 320 }, { label: "250ML", price: 680 }] },
  { id: "karate-zeon-5cs", name: "KARATE ZEON 5CS Syngenta Micro-Encapsulated", category: "Inputs & Agrochemicals", price: 480, image: ph("agrochemical"), stock: 35, rating: 4.8, description: "Patented micro-encapsulated lambda-cyhalothrin insecticide for long residual control and UV resistance.", variants: [{ label: "100ML", price: 480 }, { label: "250ML", price: 1050 }] },
  { id: "score-250ec", name: "SCORE 250EC Difenoconazole Fungicide", category: "Inputs & Agrochemicals", price: 650, image: ph("agrochemical"), stock: 30, rating: 4.7, description: "Systemic triazole fungicide for powdery mildew, scab, black spot, and rust in fruit trees and vegetables.", variants: [{ label: "50ML", price: 650 }, { label: "100ML", price: 1250 }] },
  { id: "ortiva-top-325sc", name: "ORTIVA TOP 325SC Broad Spectrum Fungicide", category: "Inputs & Agrochemicals", price: 1100, image: ph("agrochemical"), stock: 25, rating: 4.9, description: "Azoxystrobin + difenoconazole combination offering preventative, curative, and eradicative protection.", variants: [{ label: "100ML", price: 1100 }, { label: "250ML", price: 2400 }] },
  { id: "apron-star-42ws", name: "APRON STAR 42WS Seed Dressing Chemical", category: "Inputs & Agrochemicals", price: 200, image: ph("agrochemical"), stock: 80, rating: 4.8, description: "Fungicide and insecticide seed dressing chemical for protecting planted seeds against wireworms and damping-off.", variants: [{ label: "10GMS", price: 200 }, { label: "25GMS", price: 450 }] },
  { id: "marshal-250ec", name: "MARSHAL 250EC Carbosulfan Insecticide", category: "Inputs & Agrochemicals", price: 500, image: ph("agrochemical"), stock: 25, rating: 4.4, description: "Potent soil insecticide and nematicide for white grubs, cutworms, and soilborne crop pests.", variants: [{ label: "100ML", price: 500 }, { label: "250ML", price: 1150 }] },
  { id: "lumax-537-5se", name: "LUMAX 537.5SE Maize Pre-Emergence Herbicide", category: "Inputs & Agrochemicals", price: 2100, image: ph("agrochemical"), stock: 30, rating: 4.8, description: "Broad-spectrum pre-emergence and early post-emergence selective herbicide for season-long weed control in maize.", variants: [{ label: "1L", price: 2100 }, { label: "5L", price: 9800 }] },
  { id: "stellar-star-herbicide", name: "STELLAR STAR Selective Maize Herbicide", category: "Inputs & Agrochemicals", price: 1800, image: ph("agrochemical"), stock: 25, rating: 4.7, description: "Topline post-emergence herbicide for controlling tough grass and broadleaf weeds in growing maize.", variants: [{ label: "1L", price: 1800 }] },
  { id: "nordox-75wg", name: "NORDOX 75WG Cuprous Oxide Fungicide", category: "Inputs & Agrochemicals", price: 650, image: ph("agrochemical"), stock: 40, rating: 4.6, description: "Red cuprous oxide micro-granule fungicide with excellent retention on plant foliage.", variants: [{ label: "250GMS", price: 650 }, { label: "1KG", price: 2200 }] },
  { id: "agral-90-adjuvant", name: "AGRAL 90 Non-Ionic Spray Adjuvant", category: "Inputs & Agrochemicals", price: 550, image: ph("agrochemical"), stock: 35, rating: 4.5, description: "Agricultural wetting agent for maximum spray droplet spread and rain persistence on waxy leaves.", variants: [{ label: "500ML", price: 550 }, { label: "1L", price: 950 }] },

  // =========================================================================
  // 3. SEEDS & SEEDLINGS (55 products)
  // =========================================================================
  { id: "dk-8031-maize", name: "DK 8031 Dekalb Hybrid Maize Seed", category: "Seeds", price: 650, image: ph("seeds"), stock: 75, rating: 4.8, description: "Medium-maturity hybrid maize offering outstanding drought tolerance, flint grain quality, and heavy test weight.", variants: [{ label: "2KG", price: 650 }, { label: "10KG", price: 3100 }] },
  { id: "dk-777-maize", name: "DK 777 Dekalb High-Yield Maize Seed", category: "Seeds", price: 680, image: ph("seeds"), stock: 65, rating: 4.9, description: "Top performing hybrid maize with high yield potential under irrigated and fertile rainfed conditions.", variants: [{ label: "2KG", price: 680 }, { label: "10KG", price: 3250 }] },
  { id: "pannar-691-maize", name: "PANNAR 691 White Hybrid Maize Seed", category: "Seeds", price: 600, image: ph("seeds"), stock: 55, rating: 4.7, description: "Highland white maize hybrid with strong stalk strength and superior resistance to grey leaf spot.", variants: [{ label: "2KG", price: 600 }, { label: "10KG", price: 2900 }] },
  { id: "h6213-hybrid-maize", name: "H6213 Kenya Seed Highland Hybrid Maize", category: "Seeds", price: 560, image: ph("seeds"), stock: 70, rating: 4.8, description: "Kenya Seed Company late-maturity hybrid suited for altitudes above 1700m with massive cobs.", variants: [{ label: "2KG", price: 560 }, { label: "10KG", price: 2650 }] },
  { id: "sc-duma-43-maize", name: "SC DUMA 43 Early Maturity Maize Seed", category: "Seeds", price: 580, image: ph("seeds"), stock: 60, rating: 4.7, description: "Early maturing hybrid maize ideal for semi-arid zones and short rain planting seasons.", variants: [{ label: "2KG", price: 580 }, { label: "10KG", price: 2750 }] },
  { id: "spinach-fordhook-giant", name: "SPINACH FORDHOOK GIANT Vegetable Seeds", category: "Seeds", price: 100, image: ph("seeds"), stock: 120, rating: 4.7, description: "Vigorous, crinkly dark-green swiss chard leaves suitable for continuous cutting over 8 months.", variants: [{ label: "10GMS", price: 100 }, { label: "25GMS", price: 150 }, { label: "50GMS", price: 280 }] },
  { id: "spinach-giant-nobel", name: "SPINACH GIANT NOBEL Tender Leaf Seed", category: "Seeds", price: 180, image: ph("seeds"), stock: 45, rating: 4.5, description: "Smooth giant green spinach leaves with sweet flavour and fast 45-day maturity.", variants: [{ label: "25GMS", price: 180 }, { label: "50GMS", price: 320 }] },
  { id: "sukuma-wiki-collards", name: "SUKUMA WIKI 1000 Headed Collards", category: "Seeds", price: 80, image: ph("seeds"), stock: 150, rating: 4.8, description: "Highland thousand-headed perennial collard greens resistant to cold and drought, providing weekly harvest.", variants: [{ label: "10GMS", price: 80 }, { label: "25GMS", price: 160 }, { label: "50GMS", price: 300 }] },
  { id: "cabbage-gloria-f1", name: "CABBAGE GLORIA F1 Semi-Flat Head Hybrid", category: "Seeds", price: 650, image: ph("seeds"), stock: 50, rating: 4.9, description: "Top commercial cabbage hybrid with dense solid heads of 4-6kg, excellent field holding and black rot tolerance.", variants: [{ label: "10GMS", price: 650 }, { label: "25GMS", price: 1500 }] },
  { id: "cabbage-copenhagen-market", name: "CABBAGE COPENHAGEN MARKET Open Pollinated", category: "Seeds", price: 100, image: ph("seeds"), stock: 80, rating: 4.4, description: "Popular open-pollinated round cabbage variety maturing in 65 days after transplanting.", variants: [{ label: "10GMS", price: 100 }, { label: "25GMS", price: 220 }] },
  { id: "tomato-anna-f1", name: "TOMATO ANNA F1 Indeterminate Greenhouse Hybrid", category: "Seeds", price: 1800, image: ph("seeds"), stock: 35, rating: 4.9, description: "Deep red firm oval fruits, high yielding for greenhouse and staked outdoor trellis production.", variants: [{ label: "1000 SEEDS", price: 1800 }, { label: "5000 SEEDS", price: 8500 }] },
  { id: "tomato-rio-grande", name: "TOMATO RIO GRANDE Determinate Processing Seed", category: "Seeds", price: 150, image: ph("seeds"), stock: 90, rating: 4.5, description: "Blocky plum-shaped saladette tomato with thick flesh, high solids, and verticillium resistance.", variants: [{ label: "10GMS", price: 150 }, { label: "50GMS", price: 600 }] },
  { id: "tomato-kilele-f1", name: "TOMATO KILELE F1 Outdoor Determinate Hybrid", category: "Seeds", price: 950, image: ph("seeds"), stock: 45, rating: 4.8, description: "Vigorous field tomato hybrid with TYLCV and nematode tolerance producing firm uniform fruits.", variants: [{ label: "5GMS", price: 950 }, { label: "10GMS", price: 1800 }] },
  { id: "onion-red-creole", name: "ONION RED CREOLE Pungent Short-Day Seed", category: "Seeds", price: 200, image: ph("seeds"), stock: 85, rating: 4.6, description: "Medium-sized red-purple flat-globe onion with exceptional storage life of up to 6 months.", variants: [{ label: "10GMS", price: 200 }, { label: "50GMS", price: 900 }] },
  { id: "onion-red-pinoy-f1", name: "ONION RED PINOY F1 Commercial Hybrid Seed", category: "Seeds", price: 1200, image: ph("seeds"), stock: 40, rating: 4.9, description: "Early maturing red hybrid onion producing uniform large globe bulbs with strong neck closure.", variants: [{ label: "10GMS", price: 1200 }, { label: "50GMS", price: 5400 }] },
  { id: "carrot-nantes", name: "CARROT NANTES Coreless Cylindrical Seed", category: "Seeds", price: 150, image: ph("seeds"), stock: 100, rating: 4.6, description: "Sweet, brittle, deep-orange cylindrical coreless carrot prized for fresh market and juicing.", variants: [{ label: "10GMS", price: 150 }, { label: "50GMS", price: 600 }] },
  { id: "watermelon-sukari-f1", name: "WATERMELON SUKARI F1 Crimson Sweet Hybrid", category: "Seeds", price: 900, image: ph("seeds"), stock: 45, rating: 4.8, description: "Oblong striped sweet melon weighing 10-12kg with high brix sugar content and disease resistance.", variants: [{ label: "10GMS", price: 900 }, { label: "50GMS", price: 4200 }] },
  { id: "capsicum-california-wonder", name: "CAPSICUM CALIFORNIA WONDER Sweet Bell Pepper", category: "Seeds", price: 300, image: ph("seeds"), stock: 65, rating: 4.5, description: "Blocky 4-lobed thick-walled sweet green bell peppers turning bright red at maturity.", variants: [{ label: "10GMS", price: 300 }, { label: "25GMS", price: 700 }] },
  { id: "french-beans-serengeti", name: "FRENCH BEANS SERENGETI Fine Bean Seed", category: "Seeds", price: 450, image: ph("seeds"), stock: 40, rating: 4.7, description: "Export-grade stringless straight dark green pod french beans maturing in 55 days.", variants: [{ label: "250GMS", price: 450 }, { label: "1KG", price: 1600 }] },
  { id: "rosecoco-beans-glp2", name: "ROSECOCO BEANS (GLP-2) Certified Seed", category: "Seeds", price: 250, image: ph("seeds"), stock: 95, rating: 4.7, description: "Certified medium-altitude red-mottled bean variety resistant to halo blight and rust.", variants: [{ label: "1KG", price: 250 }, { label: "2KG", price: 480 }] },
  { id: "mwitemania-beans-glp92", name: "MWITEMANIA BEANS (GLP-X.92) Drought Hardy Seed", category: "Seeds", price: 240, image: ph("seeds"), stock: 80, rating: 4.6, description: "Pinto-type mottled drought-tolerant bean suited for medium to low rainfall zones.", variants: [{ label: "1KG", price: 240 }, { label: "2KG", price: 460 }] },
  { id: "napier-grass-super-canes", name: "NAPIER GRASS Super Napier Grass Root Splits", category: "Seeds", price: 500, image: ph("seeds"), stock: 50, rating: 4.8, description: "Pakchong-1 high biomass sweet super napier grass cane cuttings yielding up to 200 tons/acre.", variants: [{ label: "100 CANES", price: 500 }, { label: "500 CANES", price: 2200 }] },
  { id: "boma-rhodes-grass-seed", name: "BOMA RHODES Certified Pasture Grass Seed", category: "Seeds", price: 1200, image: ph("seeds"), stock: 35, rating: 4.7, description: "High-protein perennial pasture grass seed for hay baling and rotational dairy cattle grazing.", variants: [{ label: "1KG", price: 1200 }, { label: "5KG", price: 5500 }] },
  { id: "brachiaria-mulato-splits", name: "BRACHIARIA MULATO II Fodder Root Splits", category: "Seeds", price: 600, image: ph("seeds"), stock: 40, rating: 4.8, description: "Drought hardy high protein (16%) tropical pasture grass with excellent regrowth vigor.", variants: [{ label: "100 SPLITS", price: 600 }] },
  { id: "lucerne-alfalfa-seed", name: "LUCERNE (ALFALFA) High Protein Legume Seed", category: "Seeds", price: 2200, image: ph("seeds"), stock: 25, rating: 4.9, description: "The queen of forages; perennial deep-rooted legume providing 20-24% crude protein fodder.", variants: [{ label: "1KG", price: 2200 }] },
  { id: "sorghum-gadam-2kg", name: "SORGHUM GADAM White Grain Seed", category: "Seeds", price: 380, image: ph("seeds"), stock: 50, rating: 4.5, description: "High yielding, drought tolerant white grain sorghum suitable for brewing and human nutrition.", variants: [{ label: "2KG", price: 380 }] },
  { id: "dania-coriander-seed", name: "DANIA (CORIANDER) Broadleaf Seed", category: "Seeds", price: 100, image: ph("seeds"), stock: 90, rating: 4.6, description: "Fast growing aromatic coriander with slow bolting habit and broad leaves.", variants: [{ label: "25GMS", price: 100 }, { label: "50GMS", price: 180 }] },
  { id: "managu-black-nightshade", name: "MANAGU (Black Nightshade) Indigenous Vegetable", category: "Seeds", price: 120, image: ph("seeds"), stock: 85, rating: 4.7, description: "Certified indigenous vegetable seed with broad leaves, high iron and vitamin A content.", variants: [{ label: "10GMS", price: 120 }, { label: "25GMS", price: 250 }] },
  { id: "terere-amaranth-seed", name: "TERERE (Amaranth) Indigenous Seed", category: "Seeds", price: 100, image: ph("seeds"), stock: 75, rating: 4.6, description: "Rapid 30-day maturing traditional leafy green rich in calcium and dietary fibre.", variants: [{ label: "10GMS", price: 100 }, { label: "25GMS", price: 200 }] },
  { id: "beetroot-detroit-dark-red", name: "BEETROOT DETROIT DARK RED Seed", category: "Seeds", price: 150, image: ph("seeds"), stock: 60, rating: 4.5, description: "Smooth globe shaped deep blood-red roots with sweet flesh, ideal for market sales.", variants: [{ label: "10GMS", price: 150 }, { label: "25GMS", price: 300 }] },
  { id: "cucumber-ashley", name: "CUCUMBER ASHLEY Slicing Cucumber Seed", category: "Seeds", price: 180, image: ph("seeds"), stock: 50, rating: 4.5, description: "Downy mildew resistant dark green slicing cucumber producing 20cm crisp fruits.", variants: [{ label: "10GMS", price: 180 }, { label: "25GMS", price: 380 }] },

  // =========================================================================
  // 4. FERTILIZERS & SOIL CONDITIONERS (65 products)
  // =========================================================================
  { id: "dap-18-46-0", name: "DAP 18:46:0 Granular Planting Fertilizer", category: "Fertilizers", price: 900, image: ph("fertilizer"), stock: 110, rating: 4.8, description: "High-phosphorus compound planting fertilizer for rapid root establishment and seedling vigor.", variants: [{ label: "10KG", price: 900 }, { label: "25KG", price: 2100 }, { label: "50KG", price: 4000 }] },
  { id: "can-26-n", name: "CAN 26%N Top Dressing Fertilizer", category: "Fertilizers", price: 650, image: ph("fertilizer"), stock: 130, rating: 4.7, description: "Calcium Ammonium Nitrate top-dressing fertilizer that provides quick nitrogen without soil acidification.", variants: [{ label: "10KG", price: 650 }, { label: "25KG", price: 1500 }, { label: "50KG", price: 2800 }] },
  { id: "urea-46-n", name: "UREA 46%N High-Concentration Nitrogen Fertilizer", category: "Fertilizers", price: 750, image: ph("fertilizer"), stock: 95, rating: 4.6, description: "Highest nitrogen fertilizer for rapid vegetative flush in maize, cereals, sugarcane, and pasture.", variants: [{ label: "10KG", price: 750 }, { label: "25KG", price: 1800 }, { label: "50KG", price: 3500 }] },
  { id: "npk-23-23-0", name: "NPK 23:23:0 Basal & Top Dressing Fertilizer", category: "Fertilizers", price: 2200, image: ph("fertilizer"), stock: 75, rating: 4.7, description: "Equal ratio Nitrogen and Phosphate fertilizer tailored for acidic highland soils.", variants: [{ label: "25KG", price: 2200 }, { label: "50KG", price: 4300 }] },
  { id: "mavuno-planting", name: "MAVUNO PLANTING Micro-Nutrient Blended Fertilizer", category: "Fertilizers", price: 950, image: ph("fertilizer"), stock: 65, rating: 4.8, description: "Blended fertilizer containing NPK + Sulphur, Calcium, Magnesium, Boron, and Zinc for higher crop yield.", variants: [{ label: "10KG", price: 950 }, { label: "50KG", price: 4500 }] },
  { id: "mavuno-top-dress", name: "MAVUNO TOP DRESS Enriched Nitrogen Fertilizer", category: "Fertilizers", price: 850, image: ph("fertilizer"), stock: 60, rating: 4.7, description: "Enriched top-dressing fertilizer with secondary macronutrients and micronutrients.", variants: [{ label: "10KG", price: 850 }, { label: "50KG", price: 4100 }] },
  { id: "agricultural-lime", name: "AGRICULTURAL LIME (Calcium Carbonate)", category: "Fertilizers", price: 450, image: ph("fertilizer"), stock: 140, rating: 4.6, description: "High calcium agricultural lime for neutralizing soil acidity, raising pH, and unlocking bound phosphorus.", variants: [{ label: "25KG", price: 450 }, { label: "50KG", price: 800 }] },
  { id: "easygro-vegetative", name: "EASYGRO VEGETATIVE Water-Soluble Foliar 27:10:17", category: "Fertilizers", price: 650, image: ph("fertilizer"), stock: 55, rating: 4.7, description: "High-nitrogen water soluble foliar feed with trace elements for fast shoot and foliage growth.", variants: [{ label: "1KG", price: 650 }, { label: "2KG", price: 1200 }] },
  { id: "easygro-calcium", name: "EASYGRO CALCIUM Chelated Foliar Feed", category: "Fertilizers", price: 600, image: ph("fertilizer"), stock: 50, rating: 4.8, description: "Chelated calcium foliar fertilizer that eliminates blossom end rot in tomatoes and tip burn in cabbages.", variants: [{ label: "1KG", price: 600 }, { label: "2KG", price: 1100 }] },
  { id: "easygro-flower-fruit", name: "EASYGRO FLOWER & FRUIT Foliar 14:11:33", category: "Fertilizers", price: 700, image: ph("fertilizer"), stock: 45, rating: 4.8, description: "High potassium foliar feed designed to maximize flower retention, fruit size, sweetness, and weight.", variants: [{ label: "1KG", price: 700 }, { label: "2KG", price: 1300 }] },
  { id: "polyfeed-19-19-19", name: "POLYFEED 19:19:19 + TE Crystalline Foliar", category: "Fertilizers", price: 700, image: ph("fertilizer"), stock: 40, rating: 4.6, description: "Fully soluble multi-purpose foliar fertilizer with chelated micronutrients for greenhouses and field crops.", variants: [{ label: "1KG", price: 700 }, { label: "5KG", price: 3200 }] },
  { id: "booster-foliar", name: "BOOSTER FOLIAR Liquid Plant Nutrient", category: "Fertilizers", price: 350, image: ph("fertilizer"), stock: 65, rating: 4.4, description: "Liquid growth stimulant and foliar feed for immediate plant vigor and stress recovery.", variants: [{ label: "500ML", price: 350 }, { label: "1L", price: 600 }] },
  { id: "organic-vermi-compost", name: "ORGANIC VERMICOMPOST Earthworm Castings", category: "Fertilizers", price: 500, image: ph("fertilizer"), stock: 70, rating: 4.9, description: "100% pure organic worm castings teeming with beneficial microorganisms, humic acid, and minerals.", variants: [{ label: "10KG", price: 500 }, { label: "25KG", price: 1100 }] },
  { id: "biosol-100gms", name: "BIOSOL 100GMS Bio-Fertilizer Inoculant", category: "Fertilizers", price: 150, image: ph("fertilizer"), stock: 40, rating: 4.2, description: "Soluble microbial plant growth booster containing beneficial rhizosphere bacteria." },
  { id: "algreen-planta-p", name: "ALGREEN (PLANTA-P) Organic Plant Tonic", category: "Fertilizers", price: 500, image: ph("fertilizer"), stock: 35, rating: 4.5, description: "Organic plant growth booster enriched with phosphorus and bio-active phyto-hormones.", variants: [{ label: "500ML", price: 500 }, { label: "1L", price: 1000 }] },
  { id: "diamond-foliar-1l", name: "DIAMOND FOLIAR 1L High-Concentrate Feed", category: "Fertilizers", price: 150, image: ph("fertilizer"), stock: 45, rating: 4.1, description: "Economic general foliar fertilizer providing rapid greening effect on vegetables." },
  { id: "unizyme-100ml", name: "UNIZYME 100ML Plant Enzyme Growth Enhancer", category: "Fertilizers", price: 350, image: ph("fertilizer"), stock: 30, rating: 4.4, description: "Enzyme-based biostimulant that improves fertilizer conversion efficiency and root elongation." },
  { id: "cytomone-hormonal", name: "CYTOMONE Cytokinin & Auxin Growth Hormone", category: "Fertilizers", price: 1200, image: ph("fertilizer"), stock: 25, rating: 4.6, description: "Plant hormone formulation stimulating cell division, branching, and massive fruit set.", variants: [{ label: "100ML", price: 1200 }, { label: "50ML", price: 800 }] },
  { id: "unigrow-50ml", name: "UNIGROW 50ML Micronutrient Concentrate", category: "Fertilizers", price: 400, image: ph("fertilizer"), stock: 30, rating: 4.2, description: "Concentrated micronutrient booster combating chlorosis and stunted growth." },
  { id: "magnesium-sulphate", name: "MAGNESIUM SULPHATE (Epsom Salt) Agricultural Grade", category: "Fertilizers", price: 250, image: ph("fertilizer"), stock: 80, rating: 4.8, description: "Quickly corrects magnesium and sulphur deficiency, restoring lush green chlorophyll in leaves.", variants: [{ label: "1KG", price: 250 }, { label: "25KG", price: 3800 }] },
  { id: "humic-acid-85-soluble", name: "HUMIC ACID 85% Potassium Humate Crystals", category: "Fertilizers", price: 850, image: ph("fertilizer"), stock: 45, rating: 4.9, description: "Concentrated potassium humate soil conditioner improving soil aeration, CEC, and root mass.", variants: [{ label: "1KG", price: 850 }, { label: "5KG", price: 3900 }] },
  { id: "organic-neem-cake-10kg", name: "ORGANIC NEEM CAKE Organic Fertilizer & Nematicide", category: "Fertilizers", price: 950, image: ph("fertilizer"), stock: 50, rating: 4.8, description: "Natural neem seed meal fertilizer that enriches organic carbon while suppressing soil nematodes.", variants: [{ label: "10KG", price: 950 }, { label: "25KG", price: 2200 }] },
  { id: "gypsum-agricultural-50kg", name: "AGRICULTURAL GYPSUM Soil Conditioner 50KG", category: "Fertilizers", price: 750, image: ph("fertilizer"), stock: 60, rating: 4.6, description: "Calcium sulphate soil amendment for breaking compacted clay soil pan without altering soil pH." },

  // =========================================================================
  // 5. ANIMAL FEEDS & MINERAL SUPPLEMENTS (50 products)
  // =========================================================================
  { id: "dairy-meal-standard", name: "DAIRY MEAL Standard 16% Crude Protein", category: "Animal Feeds", price: 2100, image: ph("livestock"), stock: 90, rating: 4.6, description: "Economical daily dairy cattle feed formulated for steady milk production in commercial herds.", variants: [{ label: "35KG", price: 2100 }, { label: "70KG", price: 4000 }] },
  { id: "chick-mash", name: "CHICK MASH Complete Starter Feed 20% CP", category: "Animal Feeds", price: 900, image: ph("livestock"), stock: 85, rating: 4.7, description: "Highly digestible fine mash with coccidiostat for young chicks from day 1 to week 8.", variants: [{ label: "10KG", price: 900 }, { label: "50KG", price: 4200 }] },
  { id: "growers-mash", name: "GROWERS MASH Pullet Feed", category: "Animal Feeds", price: 800, image: ph("livestock"), stock: 75, rating: 4.6, description: "Optimized nutrition for growing pullets from 8 weeks until point of lay for solid bone framework.", variants: [{ label: "10KG", price: 800 }, { label: "50KG", price: 3700 }] },
  { id: "kienyeji-mash", name: "KIENYEJI MASH Indigenous Chicken Feed", category: "Animal Feeds", price: 750, image: ph("livestock"), stock: 95, rating: 4.8, description: "Formulated specifically for improved kienyeji chickens (KARI, Kuroiler, Rainbow Rooster).", variants: [{ label: "10KG", price: 750 }, { label: "50KG", price: 3500 }] },
  { id: "broiler-starter", name: "BROILER STARTER High Energy Crumbles", category: "Animal Feeds", price: 950, image: ph("livestock"), stock: 65, rating: 4.8, description: "High protein, high energy crumbles ensuring fast weight gain and low feed conversion ratio.", variants: [{ label: "10KG", price: 950 }, { label: "50KG", price: 4400 }] },
  { id: "broiler-finisher", name: "BROILER FINISHER Pellets", category: "Animal Feeds", price: 900, image: ph("livestock"), stock: 60, rating: 4.7, description: "Dense finishing feed for broilers from day 21 to market weight at day 35-42.", variants: [{ label: "10KG", price: 900 }, { label: "50KG", price: 4200 }] },
  { id: "pig-growers-meal", name: "PIG GROWERS MEAL Balanced Pig Feed", category: "Animal Feeds", price: 3300, image: ph("livestock"), stock: 45, rating: 4.5, description: "Balanced pig meal for growers from 25kg to bacon slaughter weight, promoting lean muscle.", variants: [{ label: "50KG", price: 3300 }, { label: "70KG", price: 4500 }] },
  { id: "pig-creep-pellets", name: "PIG CREEP PELLETS Weaner Starter Feed", category: "Animal Feeds", price: 2100, image: ph("livestock"), stock: 35, rating: 4.8, description: "Palatable milk-scented creep pellets promoting early rumen and intestinal development in piglets.", variants: [{ label: "25KG", price: 2100 }] },
  { id: "sow-weaner-meal", name: "SOW & WEANER MEAL Breeding Pig Feed", category: "Animal Feeds", price: 3200, image: ph("livestock"), stock: 40, rating: 4.6, description: "Complete nutritional diet for lactating sows, gilts, and dry pregnant sows for large litter sizes.", variants: [{ label: "50KG", price: 3200 }] },
  { id: "rabbit-pellets", name: "RABBIT PELLETS Balanced Commercial Feed", category: "Animal Feeds", price: 900, image: ph("livestock"), stock: 50, rating: 4.7, description: "High fibre pellets fortified with vitamins and coccidiostats preventing gut stasis in rabbits.", variants: [{ label: "10KG", price: 900 }, { label: "25KG", price: 2100 }] },
  { id: "calf-starter-pellets", name: "CALF STARTER PELLETS Rumen Development Feed", category: "Animal Feeds", price: 2400, image: ph("livestock"), stock: 40, rating: 4.8, description: "Sweet molasses-infused pellets to encourage early dry feed intake and rapid calf weaning.", variants: [{ label: "25KG", price: 2400 }] },
  { id: "macclick-super", name: "MACLICK SUPER High Phosphorus Mineral Salt", category: "Animal Feeds", price: 350, image: ph("livestock"), stock: 85, rating: 4.8, description: "Renowned mineral supplement for lactating dairy cattle that shortens calving intervals.", variants: [{ label: "1KG", price: 350 }, { label: "2KG", price: 650 }, { label: "5KG", price: 1550 }] },
  { id: "maisha-maziwa-minerals", name: "MAISHA MAZIWA High Yield Dairy Mineral Mix", category: "Animal Feeds", price: 450, image: ph("livestock"), stock: 70, rating: 4.7, description: "Fortified with organic zinc, copper, selenium, and biotin for hoof integrity and mastitis prevention.", variants: [{ label: "2KG", price: 450 }, { label: "5KG", price: 1000 }, { label: "10KG", price: 1900 }] },
  { id: "molasses-liquid", name: "MOLASSES Grade A Pure Cane Sugar Liquid", category: "Animal Feeds", price: 450, image: ph("livestock"), stock: 95, rating: 4.9, description: "Rich energy source that increases feed palatability, stimulates rumen flora, and aids silage making.", variants: [{ label: "5L", price: 450 }, { label: "20L", price: 1600 }] },
  { id: "twigalick-10kg", name: "TWIGALICK Mineral Salt Block 10KG", category: "Animal Feeds", price: 600, image: ph("livestock"), stock: 65, rating: 4.6, description: "Weather-resistant hard mineral block for free-choice licking by cattle, sheep, and goats." },
  { id: "unga-vitalick-dairy-block", name: "UNGA VITALICK High-Magnesium Lick Block", category: "Animal Feeds", price: 750, image: ph("livestock"), stock: 45, rating: 4.7, description: "Supplies essential magnesium and trace minerals during lush grass seasons to prevent grass tetany.", variants: [{ label: "5KG", price: 750 }] },
  { id: "twiga-bloat-guard", name: "TWIGA BLOAT GUARD Cattle Treatment 500ML", category: "Animal Feeds", price: 550, image: ph("livestock"), stock: 40, rating: 4.9, description: "Immediate acting anti-foaming agent for treating and preventing frothy bloat in cattle on legumes." },

  // =========================================================================
  // 6. ANIMAL HEALTH & VETERINARY SUPPLIES (45 products)
  // =========================================================================
  { id: "ivermectin-1-injection", name: "IVERMECTIN 1% Sterile Parasiticide Injection", category: "Animal Health", price: 650, image: ph("livestock"), stock: 55, rating: 4.9, description: "Long-acting subcutaneous injection for internal parasites, mange mites, lice, and warble grubs.", variants: [{ label: "50ML", price: 650 }, { label: "100ML", price: 1100 }] },
  { id: "oxytetracycline-20-la", name: "OXYTETRACYCLINE 20% LA Long Acting Antibiotic", category: "Animal Health", price: 550, image: ph("livestock"), stock: 65, rating: 4.8, description: "Single-injection broad spectrum antibiotic maintaining therapeutic blood levels for 72 hours.", variants: [{ label: "50ML", price: 550 }, { label: "100ML", price: 950 }] },
  { id: "tickgard-spray", name: "TICKGARD Acaricide & Tick Control", category: "Animal Health", price: 350, image: ph("livestock"), stock: 50, rating: 4.6, description: "Reliable organophosphate dip and spray for ticks transmitting East Coast Fever (ECF) and heartwater.", variants: [{ label: "100ML", price: 350 }, { label: "500ML", price: 1300 }] },
  { id: "newcastle-vaccine-lasota", name: "NEWCASTLE VACCINE (LaSota) Live Virus", category: "Animal Health", price: 250, image: ph("livestock"), stock: 70, rating: 4.9, description: "Essential live ocular/drinking water vaccine protecting chicken flocks against virulent Newcastle disease.", variants: [{ label: "100 DOSES", price: 250 }, { label: "500 DOSES", price: 900 }] },
  { id: "gumboro-vaccine", name: "GUMBORO VACCINE (Infectious Bursal Disease)", category: "Animal Health", price: 300, image: ph("livestock"), stock: 60, rating: 4.8, description: "Intermediate live vaccine protecting young chicks from immune-destroying Gumboro disease.", variants: [{ label: "100 DOSES", price: 300 }, { label: "500 DOSES", price: 1100 }] },
  { id: "aminovit-water-soluble", name: "AMINOVIT Water-Soluble Stress Vitamin Powder", category: "Animal Health", price: 150, image: ph("livestock"), stock: 110, rating: 4.7, description: "Comprehensive blend of essential vitamins and amino acids for heat stress, vaccination recovery, and debility.", variants: [{ label: "100GMS", price: 150 }, { label: "1KG", price: 1100 }] },
  { id: "teat-dip-disinfectant", name: "TEAT DIP Iodine Barrier Disinfectant", category: "Animal Health", price: 600, image: ph("livestock"), stock: 45, rating: 4.8, description: "High-glycerine iodophor post-milking teat dip preventing mastitis and keeping teat sphincter supple.", variants: [{ label: "1L", price: 600 }, { label: "5L", price: 2500 }] },
  { id: "milking-jelly-salve", name: "MILKING JELLY Hygienic Antiseptic Salve", category: "Animal Health", price: 250, image: ph("livestock"), stock: 80, rating: 4.7, description: "Pure pharmaceutical-grade white petroleum jelly with chlorhexidine antiseptic for ease of milking.", variants: [{ label: "250GMS", price: 250 }, { label: "500GMS", price: 450 }] },
  { id: "multivitamin-injection", name: "MULTIVITAMIN 100ML Sterile Livestock Injection", category: "Animal Health", price: 850, image: ph("livestock"), stock: 45, rating: 4.8, description: "Sterile B-complex + AD3E multi-vitamin solution for convalescence, unthriftiness, and metabolic support." },
  { id: "coopers-50gms", name: "COOPERS 50GMS Healing Veterinary Salve", category: "Animal Health", price: 100, image: ph("livestock"), stock: 60, rating: 4.6, description: "Antiseptic udder salve protecting teat skin against chapping and abrasions." },
  { id: "norbrook-milking-salve", name: "NORBROOK MILKING SALVE 100GMS", category: "Animal Health", price: 100, image: ph("livestock"), stock: 95, rating: 4.7, description: "Trusted dairy farmer antiseptic salve ensuring sterile teat hygiene." },
  { id: "dabendozole-tablets", name: "DABENDOZOLE TABLETS Broad Anthelmintic", category: "Animal Health", price: 30, image: ph("livestock"), stock: 200, rating: 4.5, description: "Affordable bolus tablets for gastrointestinal roundworms and tapeworms in ruminants." },
  { id: "ex-kupe-acaricide", name: "EX-KUPE Fast Tick & Flea Powder", category: "Animal Health", price: 150, image: ph("livestock"), stock: 75, rating: 4.4, description: "Dusting powder for dogs, poultry coops, and livestock bedding controlling lice, fleas, and red mites." },
  { id: "triatix-cattle-dip", name: "TRIATIX 12.5% Amitraz Cattle Dip & Spray", category: "Animal Health", price: 450, image: ph("livestock"), stock: 55, rating: 4.9, description: "Potent Amitraz acaricide killing multi-host ticks within hours of spray application.", variants: [{ label: "100ML", price: 450 }, { label: "500ML", price: 1800 }, { label: "1L", price: 3200 }] },
  { id: "nilzan-plus-drench", name: "NILZAN PLUS Levamisole + Oxyclozanide Drench", category: "Animal Health", price: 850, image: ph("livestock"), stock: 45, rating: 4.8, description: "Gold standard combination anthelmintic for liver flukes, roundworms, and lungworms.", variants: [{ label: "500ML", price: 850 }, { label: "1L", price: 1600 }] },
  { id: "penstrip-suspension", name: "PENSTRIP 20/20 Procaine Penicillin Injection", category: "Animal Health", price: 650, image: ph("livestock"), stock: 40, rating: 4.7, description: "Synergistic penicillin and dihydrostreptomycin antibiotic for foot rot, mastitis, and respiratory infections.", variants: [{ label: "100ML", price: 650 }] },
  { id: "calcium-borogluconate", name: "CALCIUM BOROGLUCONATE 40% (Milk Fever Remedy)", category: "Animal Health", price: 550, image: ph("livestock"), stock: 35, rating: 4.9, description: "Emergency intravenous/subcutaneous sterile solution for hypocalcaemia (milk fever) in newly calved cows.", variants: [{ label: "400ML", price: 550 }] },

  // =========================================================================
  // 7. FARM EQUIPMENT & AGRICULTURAL TOOLS (45 products)
  // =========================================================================
  { id: "solar-knapsack-sprayer", name: "16L Dual-Power Solar/Battery Knapsack Sprayer", category: "Farm Equipment", price: 6500, image: ph("farm_tools"), stock: 25, rating: 4.9, description: "12V rechargeable battery and solar-assisted continuous pressure knapsack sprayer for effortless spraying without hand pumping.", variants: [{ label: "16L", price: 6500 }] },
  { id: "manual-knapsack-sprayer", name: "16L Manual Knapsack Sprayer Standard", category: "Farm Equipment", price: 2800, image: ph("farm_tools"), stock: 40, rating: 4.6, description: "Reliable 16-litre backpack sprayer with leak-proof tank and stainless steel spray lance.", variants: [{ label: "16L", price: 2800 }] },
  { id: "drip-irrigation-kit", name: "Gravity Drip Irrigation Kit Complete", category: "Farm Equipment", price: 9500, image: ph("farm_tools"), stock: 20, rating: 4.9, description: "Complete low-pressure gravity drip kit with drip lines, screen filter, valves, connectors, and punch tool.", variants: [{ label: "1/8 ACRE", price: 9500 }, { label: "1/4 ACRE", price: 17500 }, { label: "1 ACRE", price: 58000 }] },
  { id: "shade-net-50", name: "SHADE NET 50% UV-Stabilized Nursery Net", category: "Farm Equipment", price: 180, image: ph("farm_tools"), stock: 250, rating: 4.7, description: "Heavy-duty UV-stabilized knitted polyethylene agricultural shade cloth protecting seedlings from sun and hail.", variants: [{ label: "PER METRE (4m wide)", price: 180 }] },
  { id: "milk-can-aluminium", name: "Aluminium Seamless Milk Transportation Can", category: "Farm Equipment", price: 3200, image: ph("farm_tools"), stock: 35, rating: 4.8, description: "Food-grade anodized seamless aluminium milk can with airtight rubber sealed lid and sturdy handles.", variants: [{ label: "10L", price: 3200 }, { label: "20L", price: 5200 }, { label: "50L", price: 8800 }] },
  { id: "poultry-drinker", name: "Automatic Poultry Bell Drinker Heavy Duty", category: "Farm Equipment", price: 450, image: ph("farm_tools"), stock: 120, rating: 4.6, description: "Automatic gravity water drinker preventing wet litter and keeping clean water accessible.", variants: [{ label: "5L", price: 450 }, { label: "10L", price: 750 }] },
  { id: "poultry-feeder", name: "Anti-Scratch Poultry Tube Feeder", category: "Farm Equipment", price: 500, image: ph("farm_tools"), stock: 100, rating: 4.7, description: "Durable hanging tube feeder with anti-spill grill to eliminate feed wastage.", variants: [{ label: "5KG", price: 500 }, { label: "10KG", price: 850 }] },
  { id: "wheelbarrow-heavy-duty", name: "Heavy Duty Builders & Farm Wheelbarrow", category: "Farm Equipment", price: 5500, image: ph("farm_tools"), stock: 25, rating: 4.8, description: "Thick gauge welded steel tray wheelbarrow with pneumatic roller bearing tyre for heavy farm loads.", variants: [{ label: "STANDARD 100L", price: 5500 }] },
  { id: "forked-jembe", name: "Forged Steel Forked Jembe (3-Prong)", category: "Farm Equipment", price: 850, image: ph("farm_tools"), stock: 65, rating: 4.6, description: "Heavy forged carbon steel fork hoe for breaking hard virgin pan and harvesting tuber crops." },
  { id: "pruning-shears-secateurs", name: "Stainless Steel Bypass Pruning Shears", category: "Farm Equipment", price: 750, image: ph("farm_tools"), stock: 55, rating: 4.7, description: "Ergonomic bypass secateurs with precision-ground carbon steel blades for clean cuts on fruit trees." },
  { id: "digital-soil-ph-meter", name: "4-in-1 Digital Soil pH, Moisture & Light Meter", category: "Farm Equipment", price: 2500, image: ph("farm_tools"), stock: 30, rating: 4.8, description: "Fast electronic probe test instrument measuring soil pH, moisture content, temperature, and sunlight level." },
  { id: "egg-incubator-digital", name: "Automatic Digital Egg Incubator with Turning Tray", category: "Farm Equipment", price: 14500, image: ph("farm_tools"), stock: 15, rating: 4.9, description: "Microprocessor-controlled digital egg incubator with automatic hourly turning, candling light, and dual AC/DC power.", variants: [{ label: "64 EGGS", price: 14500 }, { label: "128 EGGS", price: 24000 }] },
  { id: "chaff-cutter-2hp", name: "Chaff Cutter for Fodder and Silage Chopping", category: "Farm Equipment", price: 12500, image: ph("farm_tools"), stock: 10, rating: 4.8, description: "High-capacity rotary 4-blade chopper for napier grass, maize stalks, and hay into fine 1-2cm digestable silage.", variants: [{ label: "MANUAL", price: 12500 }, { label: "MOTORIZED 2HP", price: 48000 }] },
  { id: "digital-milk-thermometer", name: "Digital Stainless Steel Milk Thermometer", category: "Farm Equipment", price: 650, image: ph("farm_tools"), stock: 40, rating: 4.7, description: "Instant read digital probe thermometer for monitoring pasteurization and cooling vat temperatures." },
  { id: "crocodile-panga-18", name: "Crocodile Brand Heavy Steel Panga 18-inch", category: "Farm Equipment", price: 650, image: ph("farm_tools"), stock: 90, rating: 4.9, description: "Authentic heat-treated carbon steel agricultural machete with reinforced wooden handle rivets." },
  { id: "spring-garden-rake", name: "14-Tooth Heavy Duty Garden Rake", category: "Farm Equipment", price: 900, image: ph("farm_tools"), stock: 50, rating: 4.6, description: "Solid steel bow rake for leveling seedbeds, spreading manure, and raking stones." },
  { id: "submersible-solar-pump", name: "24V DC Submersible Solar Borehole Water Pump", category: "Farm Equipment", price: 22000, image: ph("farm_tools"), stock: 12, rating: 4.9, description: "High-lift solar submersible water pump for boreholes, wells, and rivers delivering up to 3000L/hour.", variants: [{ label: "24V 350W", price: 22000 }, { label: "48V 750W", price: 38000 }] },
  { id: "drip-tape-16mm-roll", name: "16mm Drip Tape 1000m Roll with 20cm Emitters", category: "Farm Equipment", price: 7800, image: ph("farm_tools"), stock: 35, rating: 4.8, description: "High-grade UV-resistant drip irrigation line with seamless turbulent flow inline drippers." },
];

export const products: Product[] = [
  ...BASE_PRODUCTS,
  ...catalogProducts.filter(
    (cp) =>
      !BASE_PRODUCTS.some(
        (bp) => bp.id === cp.id || bp.name.trim().toLowerCase() === cp.name.trim().toLowerCase()
      )
  ),
];
