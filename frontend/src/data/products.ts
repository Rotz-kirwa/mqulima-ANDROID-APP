const P = "https://www.mqulima.com/images";

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
};

export const productCategories = ["All", "Inputs & Agrochemicals", "Seeds", "Fertilizers", "Animal Feeds", "Animal Health", "Farm Equipment"];

const DESC = "Certified genuine agricultural input for farm use.";

const ph = (n: string) => `${P}/placeholders/${n}.webp`;

export const products: Product[] = [
  // Featured collection — Farm Essentials
  { id: "farm-tools", name: "Farm Tools", category: "Farm Equipment", price: 1200, image: ph("farm_tools"), stock: 20, featured: true, rating: 4.6, description: "Durable hand tools for everyday farm work — jembes, pangas, rakes and pruners from verified suppliers.", variants: [{ label: "Jembe", price: 1200 }, { label: "Panga", price: 650 }, { label: "Rake", price: 900 }] },
  { id: "20l-heavy-duty-knapsack-sprayer", name: "20L Heavy Duty Knapsack Sprayer", category: "Farm Equipment", price: 3500, image: `${P}/products/knapsack_sprayer_20l.webp`, stock: 12, featured: true, rating: 4.8, description: "Heavy duty 20 litre manual knapsack sprayer with adjustable brass nozzle, padded straps and pressure chamber for even spray coverage." },
  { id: "smoothsale-high-protein-dairy-mash", name: "SmoothSale High-Protein Dairy Mash", category: "Animal Feeds", price: 2900, image: `${P}/products/dairy_mash.webp`, stock: 30, featured: true, rating: 4.7, description: "Balanced high-protein dairy mash formulated to increase milk yield and maintain body condition in lactating cows.", variants: [{ label: "35KG", price: 2900 }, { label: "70KG", price: 5600 }] },
  { id: "high-yield-layer-chicken-feed", name: "High-Yield Layer Chicken Feed", category: "Animal Feeds", price: 3400, image: `${P}/products/chicken_feed.webp`, stock: 25, featured: true, rating: 4.6, description: "Complete layers mash with calcium and essential amino acids for strong shells and consistent egg production.", variants: [{ label: "50KG", price: 3400 }, { label: "10KG", price: 780 }] },
  { id: "high-protein-dairy-meal", name: "High-Protein Dairy Meal", category: "Animal Feeds", price: 3100, image: `${P}/products/high_yield_dairy_meal.webp`, stock: 18, featured: true, rating: 4.5, description: "Premium dairy meal with by-pass protein and minerals for high producing dairy herds." },
  { id: "smoothsale-motorized-backpack-knapsack-sprayer", name: "SmoothSale Motorized Backpack Knapsack Sprayer", category: "Farm Equipment", price: 14500, image: `${P}/products/motorized_knapsack.webp`, stock: 5, featured: true, rating: 4.9, description: "Petrol-powered 25L motorized backpack mist blower for fast spraying of large orchards and fields." },
  { id: "smoothsale-npk-17-17-17-fertilizer", name: "SmoothSale NPK 17:17:17 Fertilizer", category: "Fertilizers", price: 4200, image: `${P}/products/yara_npk_17_17_17.webp`, stock: 40, featured: true, rating: 4.7, description: "Balanced compound fertilizer for planting and top dressing a wide range of crops.", variants: [{ label: "50KG", price: 4200 }, { label: "25KG", price: 2200 }, { label: "10KG", price: 950 }] },
  { id: "premium-npk-20-20-20-fertilizer", name: "Premium NPK 20:20:20 Fertilizer", category: "Fertilizers", price: 850, image: `${P}/products/npk_20_20_20.webp`, stock: 22, featured: true, rating: 4.6, description: "Water-soluble foliar & fertigation fertilizer for vigorous vegetative growth.", variants: [{ label: "1KG", price: 850 }, { label: "5KG", price: 3900 }] },
  { id: "seaweed-organic-growth-booster", name: "Seaweed Organic Growth Booster", category: "Fertilizers", price: 1100, image: `${P}/products/seaweed_growth_booster.webp`, stock: 15, featured: true, rating: 4.8, description: "Organic seaweed extract biostimulant that improves root development, flowering and stress tolerance." },
  // Shop listing
  { id: "twigalick-10kg", name: "TWIGALICK 10KG", category: "Animal Health", price: 600, image: ph("livestock"), stock: 2, rating: 4.5, description: DESC },
  { id: "ex-kupe", name: "ex-kupe", category: "Animal Health", price: 150, image: ph("livestock"), stock: 4, rating: 4.3, description: DESC },
  { id: "weedal-480sl", name: "WEEDAL 480SL", category: "Inputs & Agrochemicals", price: 500, image: ph("agrochemical"), stock: 30, rating: 4.4, description: DESC, variants: [{ label: "500ML", price: 500 }, { label: "200ML", price: 300 }] },
  { id: "biosol-100gms", name: "BIOSOL 100GMS", category: "Fertilizers", price: 150, image: ph("fertilizer"), stock: 30, rating: 4.2, description: DESC },
  { id: "algreen-planta-p", name: "ALGREEN (PLANTA-P)", category: "Fertilizers", price: 500, image: ph("fertilizer"), stock: 6, rating: 4.5, description: DESC, variants: [{ label: "500ML", price: 500 }, { label: "1L", price: 1000 }] },
  { id: "diamond-foliar-1l", name: "DIAMOND FOLIAR 1L", category: "Fertilizers", price: 150, image: ph("fertilizer"), stock: 30, rating: 4.1, description: DESC },
  { id: "zetanil-240gms", name: "ZETANIL 240GMS", category: "Inputs & Agrochemicals", price: 500, image: ph("agrochemical"), stock: 30, rating: 4.4, description: DESC },
  { id: "coopers-50gms", name: "COOPERS 50GMS", category: "Animal Health", price: 100, image: ph("livestock"), stock: 6, rating: 4.6, description: DESC },
  { id: "norbrook-milking-salve-100gms", name: "NORBROOK MILKING SALVE 100GMS", category: "Animal Health", price: 100, image: ph("livestock"), stock: 30, rating: 4.7, description: DESC },
  { id: "spinach-fordhook-giant", name: "SPINACH FORDHOOK GIANT", category: "Seeds", price: 100, image: ph("seeds"), stock: 10, rating: 4.5, description: DESC, variants: [{ label: "10GMS", price: 100 }, { label: "25GMS", price: 150 }] },
  { id: "macarena-tm-100ml", name: "MACARENA TM 100ML", category: "Inputs & Agrochemicals", price: 600, image: ph("agrochemical"), stock: 4, rating: 4.3, description: DESC },
  { id: "unizyme-100ml", name: "UNIZYME 100ML", category: "Fertilizers", price: 350, image: ph("fertilizer"), stock: 3, rating: 4.4, description: DESC },
  { id: "cytomone", name: "CYTOMONE", category: "Fertilizers", price: 1200, image: ph("fertilizer"), stock: 4, rating: 4.6, description: DESC, variants: [{ label: "100ML", price: 1200 }, { label: "50ML", price: 800 }] },
  { id: "unigrow-50ml", name: "UNIGROW 50ML", category: "Fertilizers", price: 400, image: ph("fertilizer"), stock: 4, rating: 4.2, description: DESC },
  { id: "hispeid-25ml", name: "HISPEID 25ML", category: "Inputs & Agrochemicals", price: 100, image: ph("agrochemical"), stock: 8, rating: 4.1, description: DESC },
  { id: "aquawet-15sl", name: "AQUAWET 15SL", category: "Inputs & Agrochemicals", price: 400, image: ph("agrochemical"), stock: 1, rating: 4.3, description: DESC, variants: [{ label: "500ML", price: 400 }, { label: "100ML", price: 100 }, { label: "30ML", price: 100 }] },
  { id: "dabendozole-tablets", name: "DABENDOZOLE TABLETS", category: "Animal Health", price: 30, image: ph("livestock"), stock: 30, rating: 4.4, description: DESC },
  { id: "hygienic-7-5sc-20ml", name: "HYGIENIC 7.5%SC 20ML", category: "Inputs & Agrochemicals", price: 100, image: ph("agrochemical"), stock: 30, rating: 4.2, description: DESC },
];

export const ksh = (n: number) => `KSh ${n.toLocaleString("en-US")}`;
