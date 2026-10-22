// Course previews for Mqulima Academy (launching 2026).
export type Lesson = { title: string; duration: string; preview?: boolean; summary?: string; points?: string[] };
export type Module = { title: string; lessons: Lesson[] };
export type Course = { id: string; n: string; title: string; level: string; duration: string; image: string; text: string; outcomes: string[]; modules: Module[] };

const I = "https://www.mqulima.com/images/services";

export const courses: Course[] = [
  {
    id: "foundations", n: "01", title: "Foundations", level: "Beginner", duration: "4 weeks • 12 lessons", image: `${I}/soil_testing_analysis.webp`,
    text: "Understand soil diagnostics, water budgeting, and variety seed selection before planting.",
    outcomes: ["Read a soil test report", "Plan water needs per acre", "Choose certified seed for your zone"],
    modules: [
      { title: "Know your soil", lessons: [
        { title: "Why soil testing pays for itself", duration: "6 min", preview: true, summary: "Most Kenyan farms lose 20–40% of fertilizer spend on nutrients the soil doesn't need. A soil test tells you pH, N-P-K and organic matter so every shilling goes where it counts.", points: ["Sample 15–20 spots per acre in a zig-zag", "Mix and send 500g to the lab", "Retest every 2–3 seasons"] },
        { title: "Understanding pH and liming", duration: "8 min" },
        { title: "Organic matter & soil life", duration: "7 min" },
      ] },
      { title: "Water budgeting", lessons: [{ title: "How much water does a crop need?", duration: "9 min" }, { title: "Rain-fed vs irrigated planning", duration: "8 min" }] },
      { title: "Seed selection", lessons: [{ title: "Certified vs recycled seed", duration: "6 min" }, { title: "Matching varieties to altitude", duration: "7 min" }] },
    ],
  },
  {
    id: "crop-management", n: "02", title: "Crop Management", level: "Intermediate", duration: "6 weeks • 18 lessons", image: `${I}/consult_agronomist.webp`,
    text: "Implement fertilizer application formulas and dynamic pest alert spray matrices.",
    outcomes: ["Calculate fertilizer rates", "Build a spray calendar", "Scout and identify key pests"],
    modules: [
      { title: "Fertilizer programmes", lessons: [
        { title: "Planting vs top-dressing explained", duration: "7 min", preview: true, summary: "Planting fertilizers (high phosphorus like DAP or NPK) build roots; top-dressing (nitrogen like CAN or Urea) drives leaf and grain growth. Timing matters as much as the product.", points: ["Apply planting fertilizer in the hole, not on the seed", "Top-dress maize at knee height (4–6 weeks)", "Never top-dress on dry soil"] },
        { title: "Foliar feeds and boosters", duration: "6 min" },
      ] },
      { title: "Integrated pest management", lessons: [{ title: "Scouting fall armyworm", duration: "8 min" }, { title: "Rotating chemical groups", duration: "7 min" }, { title: "Safe spraying & PPE", duration: "6 min" }] },
      { title: "Disease control", lessons: [{ title: "Blight in tomato and potato", duration: "9 min" }, { title: "Weather-based spray timing", duration: "7 min" }] },
    ],
  },
  {
    id: "agripreneurship", n: "03", title: "Agripreneurship", level: "Advanced", duration: "5 weeks • 15 lessons", image: `${I}/get_coaching.webp`,
    text: "Gain market access benchmarks, post-harvest logistics, and export certifications.",
    outcomes: ["Cost a farm enterprise", "Find and negotiate with buyers", "Prepare for GlobalG.A.P."],
    modules: [
      { title: "Farming as a business", lessons: [
        { title: "Know your cost per kilo", duration: "8 min", preview: true, summary: "Profit starts with knowing exactly what each kilo or litre costs you to produce. Track inputs, labour, transport and losses for one season and you'll know your break-even price.", points: ["Record every input and labour cost", "Divide total cost by total yield", "Never sell below your cost per kilo"] },
        { title: "Record keeping that works", duration: "6 min" },
      ] },
      { title: "Markets & value addition", lessons: [{ title: "Aggregation and cooperatives", duration: "7 min" }, { title: "Packaging for higher prices", duration: "8 min" }] },
      { title: "Export readiness", lessons: [{ title: "Certifications overview", duration: "9 min" }, { title: "Traceability with Mqulima Trace", duration: "6 min" }] },
    ],
  },
];
