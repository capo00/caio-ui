// Lazy LSI in the shape uu5g05 expects (its own lsi/import-lsi.js is the model): the default
// export is a function of the language, `libraryCode` keys the shared LSI store that
// useLazyLsi() reads, and setDefaultLsi() seeds that store synchronously so the very first
// render already has text instead of nothing.
//
// Consumed as `<Lsi import={importLsi} path={[...]} />` or `useLsi(importLsi, [...])`. The
// path is the key path into the JSON, so every component here keeps its own LSI_PATH prefix
// and the JSON stays grouped by module (app / elements / ecc). Adding a language means adding
// <lang>.json next to these and one line to IMPORT_BY_LANGUAGE below.
import { Utils } from "uu5g05";
import cs from "./cs.json";

// The uu5 libraries use "<name>@<version>" because several versions can be loaded side by
// side. caio-ui ships as source and gets bundled into the app exactly once, so the bare name
// is unambiguous -- and it cannot go stale against package.json the way a version literal can.
const libraryCode = "caio-ui";

// Jazyky jsou vyjmenované, ne globované. uu5g05 si píše `import(`./${lang}.json`)`, protože
// ho staví webpack; Vite (a tím caio-devkit) to odmítne s "variable imports cannot import
// their own directory". Tohle je cena za to, že cs.json a en.json leží vedle tohohle souboru
// -- přidání jazyka je pak i jeden řádek sem, ne jen nový JSON.
const IMPORT_BY_LANGUAGE = {
  cs: () => import("./cs.json"),
  en: () => import("./en.json"),
};

const importLsi = (lang) =>
  IMPORT_BY_LANGUAGE[lang]?.() ?? Promise.reject(new Error(`No caio-ui LSI for language "${lang}".`));
importLsi.libraryCode = libraryCode;

// Seeded with cs, not en as the uu5 libraries do: this stack is Czech-first, so seeding en
// would flash English on first paint before cs.json finished loading.
Utils.Lsi.setDefaultLsi(libraryCode, { cs });

export default importLsi;
