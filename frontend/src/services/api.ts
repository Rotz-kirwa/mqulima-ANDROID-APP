// Single data-access layer. Swap these implementations for real HTTP calls later.
import { articles, Article } from "@/src/data/articles";
import { products, Product } from "@/src/data/products";
import { serviceCategories, ServiceCategory } from "@/src/data/services";
import { threads, Thread } from "@/src/data/forum";
import { marketPrices } from "@/src/data/tools";
import { aiReplies, aiFallback } from "@/src/data/pages";

const delay = <T,>(data: T, ms = 600): Promise<T> => new Promise((r) => setTimeout(() => r(data), ms));

export const api = {
  getProducts: (category = "All", q = ""): Promise<Product[]> =>
    delay(
      products.filter(
        (p) => (category === "All" || p.category === category) && p.name.toLowerCase().includes(q.trim().toLowerCase()),
      ),
    ),
  getFeaturedProducts: (): Promise<Product[]> => delay(products.filter((p) => p.featured)),
  getProduct: (id: string): Promise<Product | undefined> => delay(products.find((p) => p.id === id), 300),

  getArticles: (group = "All"): Promise<Article[]> => delay(articles.filter((a) => group === "All" || a.group === group)),
  getArticle: (id: string): Promise<Article | undefined> => delay(articles.find((a) => a.id === id), 300),

  getServiceCategories: (): Promise<ServiceCategory[]> => delay(serviceCategories),
  getServiceCategory: (id: string): Promise<ServiceCategory | undefined> => delay(serviceCategories.find((c) => c.id === id), 300),

  getThreads: (): Promise<Thread[]> => delay(threads),
  getMarketPrices: () => delay(marketPrices),

  search: (q: string) => {
    const t = q.trim().toLowerCase();
    if (!t) return delay({ products: [], articles: [], services: [] }, 200);
    return delay(
      {
        products: products.filter((p) => p.name.toLowerCase().includes(t) || p.category.toLowerCase().includes(t)),
        articles: articles.filter((a) => a.title.toLowerCase().includes(t)),
        services: serviceCategories.flatMap((c) => c.subs.filter((s) => s.title.toLowerCase().includes(t)).map((s) => ({ ...s, categoryId: c.id }))),
      },
      300,
    );
  },

  askAI: (message: string): Promise<string> => {
    const m = message.toLowerCase();
    const hit = aiReplies.find((r) => r.keys.some((k) => m.includes(k)));
    return delay(hit ? hit.reply : aiFallback, 1200);
  },
};
