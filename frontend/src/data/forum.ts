export type Comment = {
  id: string;
  author: string;
  text: string;
  time: string;
  user_id?: string | null;
  parent_id?: string | null;
};

export type Thread = {
  id: string;
  author: string;
  handle: string;
  date: string;
  created_at?: string;
  tag: string;
  title?: string;
  text: string;
  image?: string;
  images?: string[];
  county: string;
  location: string;
  likes: number;
  liked?: boolean;
  saved?: boolean;
  resolved?: boolean;
  comments: Comment[];
  user_id?: string | null;
};

export type SokoItem = {
  id: string;
  commodity: string;
  type: "crop" | "livestock";
  price: number;
  quantity: string;
  location: string;
  image: string;
  description: string;
  sellerName: string;
  sellerHandle: string;
  phone: string;
  createdAt: string;
};

export type PulseAlert = {
  id: string;
  title: string;
  content: string;
  category: "Market Trend" | "Policy Update" | "Agronomy Alert";
  date: string;
};

export type VerifiedFarmer = {
  username: string;
  name: string;
  county: string;
  natureOfAgriculture: string;
  crops: string[];
  livestock: string[];
  yearsFarming: number;
  reputationScore: number;
  followersCount: number;
  bio: string;
  phone: string;
};

export const postTags = ["🌱 Farm Progress", "🌾 Harvest Update", "💡 Farming Tips", "❓ Question", "🏆 Success Story"];

export const verifiedFarmers: VerifiedFarmer[] = [];

export const sokoListings: SokoItem[] = [];

export const pulseAlerts: PulseAlert[] = [];

export const network: { name: string; county: string }[] = [];

export const threads: Thread[] = [];
