export type Comment = { id: string; author: string; text: string; time: string };
export type Thread = {
  id: string;
  author: string;
  handle: string;
  date: string;
  tag: string;
  text: string;
  image?: string;
  county: string;
  location: string;
  likes: number;
  comments: Comment[];
};

export const forumHero = {
  badge: "Mqulima Agricultural Community",
  title: "Where Farmers Connect, Share, and Grow Together",
  text: "Join Kenya’s dedicated farming identity platform. Share real-time crop & harvest updates, discover verified agricultural practices, and build lasting professional connections with fellow farmers across all 47 counties.",
  cta: "Create Your Farmer Profile",
  ctaSub: "Set up in under a minute • Free forever",
  image: "https://www.mqulima.com/images/farmers_illustration.webp",
  stats: ["5,000+ Active Farmers", "47 Counties"],
  steps: [
    { n: "01", title: "Build Your Profile", text: "Share details about your farm, location, and main agricultural focus areas." },
    { n: "02", title: "Share Your Journey", text: "Post farm progress, harvest achievements, crop photos, and ask questions." },
    { n: "03", title: "Grow Your Network", text: "Connect with buyers, agronomists, and peers to earn community reputation." },
  ],
};

export const postTags = ["🌱 Farm Progress", "🌾 Harvest Update", "💡 Farming Tips", "❓ Question", "🏆 Success Story"];

export const network = [
  { name: "colllins kiprop", county: "Nairobi" },
  { name: "Eliud Rotich", county: "Nairobi" },
  { name: "David Kariuki", county: "Nairobi" },
  { name: "KIPCHUMBA KIPRUTO", county: "Elgeyo-Marakwet" },
  { name: "Kosgei Kiprono", county: "Elgeyo-Marakwet" },
];

export const threads: Thread[] = [
  {
    id: "t1", author: "Kosgei Kiprono", handle: "@mqulima_kosgeikiprono", date: "2026-09-12", tag: "Farm Progress",
    text: "Check out what we harvested #Waruu", image: "https://www.mqulima.com/images/community/ec851063-44f4-4e29-a2fb-9c459e99e10c-0.webp",
    county: "Elgeyo-Marakwet", location: "Eldoret, Uasin Gishu", likes: 10,
    comments: [
      { id: "c1", author: "Eliud Rotich", text: "Great harvest! Which variety is this?", time: "2026-09-12" },
      { id: "c2", author: "David Kariuki", text: "Congratulations Kosgei 👏", time: "2026-09-13" },
    ],
  },
  {
    id: "t2", author: "Eliud Rotich", handle: "@mqulima_eliudrotich", date: "2026-09-10", tag: "Farming Tips",
    text: "Tip for poultry farmers: clean drinkers daily and add a little apple cider vinegar to water during hot weather. Our layers' egg production has been very consistent.",
    county: "Bungoma", location: "Bungoma", likes: 7,
    comments: [{ id: "c3", author: "colllins kiprop", text: "Thanks for this, will try it.", time: "2026-09-11" }],
  },
  {
    id: "t3", author: "KIPCHUMBA KIPRUTO", handle: "@mqulima_kipchumbakipruto", date: "2026-09-08", tag: "Question",
    text: "Which is the best top-dressing fertilizer for maize in Elgeyo-Marakwet at knee height? CAN or Urea?",
    county: "Elgeyo-Marakwet", location: "Iten, Elgeyo-Marakwet", likes: 4, comments: [],
  },
];
