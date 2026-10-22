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
fs.writeFileSync("/app/backend/seed.json", JSON.stringify(out));
console.log(`products=${out.products.length} articles=${out.articles.length} threads=${out.threads.length}`);
