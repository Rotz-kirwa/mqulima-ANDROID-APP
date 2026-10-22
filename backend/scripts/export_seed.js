// Dumps the frontend mock data (products, articles, threads) to backend/seed.json
// Usage: cd /app/frontend && node /app/backend/scripts/export_seed.js
const babel = require("@babel/core");
const fs = require("fs");
const path = require("path");

const DATA = "/app/frontend/src/data";
const cache = {};
function load(name) {
  if (cache[name]) return cache[name];
  const src = fs.readFileSync(path.join(DATA, name + ".ts"), "utf8");
  const { code } = babel.transformSync(src, {
    filename: name + ".ts",
    presets: [["@babel/preset-typescript", { onlyRemoveTypeImports: false }]],
    plugins: ["@babel/plugin-transform-modules-commonjs"],
    babelrc: false, configFile: false,
  });
  const module = { exports: {} };
  const req = (p) => load(p.replace("./", ""));
  new Function("module", "exports", "require", code)(module, module.exports, req);
  cache[name] = module.exports;
  return module.exports;
}

const { products } = load("products");
const { catalogProducts } = load("catalog");
const { articles } = load("articles");
const { threads } = load("forum");
const out = { products: [...products, ...catalogProducts], articles, threads };
if (process.argv.includes("--operations")) {
  const services = load("services");
  const { courses } = load("academy");
  const categories = services.serviceCategories.map(({subs, ...category}) => ({...category, status: "published"}));
  const items = services.serviceCategories.flatMap(c => c.subs.map(s => ({...s, category_id: c.id, price: services.getSubService(s.id).price, steps: services.serviceSteps, includes: services.serviceIncludes, status: "published"})));
  fs.writeFileSync("/app/backend/operations_seed.json", JSON.stringify({service_categories: categories, services: items, courses: courses.map(c => ({...c, status: "published"}))}));
  console.log(`Exported ${categories.length} service categories, ${items.length} services, ${courses.length} courses`);
} else {
  fs.writeFileSync("/app/backend/seed.json", JSON.stringify(out));
  console.log(`products=${out.products.length} articles=${out.articles.length} threads=${out.threads.length}`);
}
