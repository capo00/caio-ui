# caio-ui

React komponenty postavené nad Unicorn **uu5g05**/uuSuite ekosystémem, navržené k párování s [`caio-server`](https://github.com/capo00/caio-server) (backend) a scaffoldu [`caio-devkit`](https://github.com/capo00/caio-devkit). Součást monorepa [`caio-architecture`](../README.md) — tam je popsané, jak tyhle tři repa dohromady tvoří appku.

---

## Prerekvizity

- **Přístup k registry `repo.plus4u.net`** — peer dependencies (`uu5*`) nejsou na npmjs:

  ```
  peerDependencies: uu5g05, uu5g05-elements, uu5g05-forms,
                    uu5tilesg02, uu5tilesg02-elements, uu5tilesg02-controls,
                    uu5codekitg01, uu5richtextg01-elements
  ```

- Backend, který servíruje `caio-server`ovou konvenci (`/auth/*`, `<entity>/list|create|createMany|update|delete|deleteMany`).

## Import

```javascript
import { UiApp, UiAuth, UiElements, UiEcc } from "caio-ui";
```

**Pod Vite tenhle root import nefunguje** — zatáhne `UiEcc` → `uu5richtextg01-elements`, které se nedá bundlovat. Importuj submoduly:

```javascript
import UiApp from "caio-ui/src/caio-ui-app";
import UiElements from "caio-ui/src/caio-ui-elements";
```

Workaroundy viz [Known issues](#known-issues).

---

## UiApp

Root wrapper appky a routing guard.

| Export | Desc |
|---|---|
| `SpaProvider` | Obalí appku providery: `AppBackgroundProvider`, `LanguageListProvider` (`["cs"]`), `LanguageProvider`, `UiAuth.SessionProvider` (`cmdPrefix` prop se předá dál), `RouteProvider`. |
| `Spa` | Vizuální root: `ErrorBoundary` (fallback `SpaError`) + `Uu5Elements.ModalBus` + `Uu5Elements.AlertBus`. |
| `withRoute(Component, { profileList })` | HOC pro route guard. Bez `profileList` prostě vyrenderuje `Component`. S `profileList` čte `UiAuth.useSession()`: `pending` → `null`, `notAuthenticated` → `UiAuth.Unauthenticated`, `authenticated` bez shody profilu → `UiAuth.Unauthorized`, jinak `Component`. |
| `Top` | Horní lišta appky — logo, `menuList`, a automaticky přidané login/identity tlačítko (fotka + dropdown s `identity`/logout, když je uživatel přihlášený; „Přihlásit se“, když ne). |

```javascript
import { UiApp } from "caio-ui";

function App() {
  return (
    <UiApp.SpaProvider cmdPrefix="/auth">
      <UiApp.Spa>
        <UiApp.Top logoUri="/logo.svg" menuList={[{ children: "Hráči", href: "/players" }]} />
        <Router />
      </UiApp.Spa>
    </UiApp.SpaProvider>
  );
}

// stránka dostupná jen profilům Admin/Manager
const AdminPage = UiApp.withRoute(PlayersPage, { profileList: ["Admin", "Manager"] });
```

---

## UiAuth

Session management napojený 1:1 na `Authentication` modul z `caio-server`.

| Export | Desc |
|---|---|
| `SessionProvider` (`{ cmdPrefix = "/auth" }`) | Při mountu zavolá `GET <cmdPrefix>` (s cookie) a uloží identitu. Poslouchá `postMessage({ type: "auth", identity })` — tím OAuth popup callback appce pošle výsledek přihlášení. |
| `useSession()` | `{ identity, state, login(), logout() }`. `state` je `"pending"` \| `"notAuthenticated"` \| `"authenticated"`. `login()` otevře popup na `<cmdPrefix>/google`. `logout()` zavolá `POST <cmdPrefix>/logout` a vynuluje identitu. |
| `Unauthenticated` | Placeholder box s tlačítkem „Přihlásit se“ (`login()`). Používá `withRoute` interně. |
| `Unauthorized` | Placeholder box „Nemáte oprávnění“. |
| `IdentityItem` (`{ identity, firstName?, surname?, name?, photo? }`) | Zobrazí uživatele (`Uu5Elements.InfoItem`). Když nedostane jméno/foto přímo v props, dotáhne je přes `identity/get`. |
| `FormIdentitySelect` | `uu5g05-forms` async select nad `identity/search` — pro výběr uživatele(ů) ve formuláři (např. přiřazení vlastníka záznamu). |

```javascript
const { identity, state, login, logout } = UiAuth.useSession();
```

---

## UiElements

Datová vrstva a generické CRUD UI — protějšek `Crud`/`Dao` z `caio-server` na frontendu.

### Call

Fetch wrapper odpovídající tomu, co `App.init` na backendu čeká.

| Metoda | Desc |
|---|---|
| `Call.get(uri, dtoIn, opts)` / `Call.post(uri, dtoIn, opts)` | `get` serializuje `dtoIn` do query stringu; `post` pošle JSON, nebo `FormData` pokud je v `dtoIn` nějaký `File` (pro upload přes `BinaryStore`). Vždy `credentials: "include"`. Vrací `response` s `.data` (parsovaný JSON). Při `status >= 400` hodí `Error` s `.dtoIn`/`.dtoOut`. |
| `Call.cmdGet(...)` / `Call.cmdPost(...)` | Zkratky, které rovnou vrátí `response.data`. |

### CrudContext

```javascript
const [PlayerCrudProvider, usePlayerCrud] = UiElements.CrudContext.create("player");
```

`CrudContext.create(entity)` vytvoří dvojici `[Provider, useHook]` navázanou přes `useDataList` na REST konvenci `entity/list|create|createMany|update|delete|deleteMany` (přesně to, co produkuje `Crud`/`Dao` v `caio-server`). `Provider` props: `dtoIn` (filtr predaný do `list`, re-load při změně), `pageSize` (default 1000), `calls` (override, když endpointy nesedí na konvenci), `refreshKey`.

### Crud

Hotová CRUD obrazovka (tabulka/list + create/edit/delete/hromadné modály) postavená nad `dataList` z `CrudContext`.

| Statická metoda | Desc |
|---|---|
| `Crud.generate(cfg)` | Z deklarativní konfigurace polí (`{ [code]: { label, output, columnProps, sort, filterProps, visible } }`) vygeneruje `seriesList`/`columnList`/`sorterList`/`filterList` pro `Crud`. |
| `Crud.generateInputs(cfg, { operation, orderList })` | Z `cfg[code].input = { Component, props }` vygeneruje pole formulářových inputů pro create/edit modál. |

```javascript
import { UiElements } from "caio-ui";
import Uu5Forms from "uu5g05-forms";

const [PlayerCrudProvider, usePlayerCrud] = UiElements.CrudContext.create("player");

const fieldCfg = {
  firstName: { label: { cs: "Jméno" }, sort: true, input: { Component: Uu5Forms.FormText, props: { required: true } } },
  surname:   { label: { cs: "Příjmení" }, sort: true, input: { Component: Uu5Forms.FormText, props: { required: true } } },
  teamId:    { output: false, input: { Component: Uu5Forms.FormTextSelectAsync } },
};

const { seriesList, columnList, sorterList, filterList } = UiElements.Crud.generate(fieldCfg);

function PlayersPage() {
  return (
    <PlayerCrudProvider>
      {(dataList) => (
        <UiElements.Crud
          header={<Lsi lsi={{ cs: "Hráči" }} />}
          dataList={dataList}
          seriesList={seriesList}
          columnList={columnList}
          sorterDefinitionList={sorterList}
          filterDefinitionList={filterList}
        >
          {() => UiElements.Crud.generateInputs(fieldCfg)}
        </UiElements.Crud>
      )}
    </PlayerCrudProvider>
  );
}
```

Bez `children` (form inputů) je `Crud` jen read-only tabulka (`readOnly` prop to i explicitně vynutí).

### Image

`<UiElements.Image>` — obyčejný `<img>` s `referrerPolicy="no-referrer"` (nutné pro obrázky z Google Drive/Photos, viz `BinaryStore`/`capo-google-disk`).

---

## UiEcc

Stránka složená z editovatelných sekcí — in-place WYSIWYG editor pro uživatele s profilem `"operatives"`.

| Export | Desc |
|---|---|
| `Page` (`{ id, name, onCreate }`) | Načte stránku (`eccPage/load`) a vyrenderuje `sectionList`. Bez dat a s oprávněním nabídne `CreatePageButton`. |
| `CreatePageButton` | Zavolá `eccPage/create` a vyrenderuje výsledek přes `onCreate`. |
| `Section` / `SectionEditable` | Jedna sekce stránky. Mimo edit mód renderuje `dto.data.uu5String` (`Utils.Uu5String`) staticky. V edit módu (klik na sekci) sekci zamkne (`eccSection/lock`), otevře `uu5richtextg01-elements` `Editor`, po `onBlur` uloží a odemkne (`eccSection/unlock`). Akce v liště: přidat sekci před/za, přesunout nahoru/dolů, zkopírovat, upravit jako uu5String, smazat. |

**Backend pro `UiEcc` musí appka doimplementovat sama** — `caio-server` v základu nemá `eccPage`/`eccSection` use cases (žádný `Ecc` export). Očekávaná API konvence, kterou `UiEcc` volá:

| Use case | Desc |
|---|---|
| `eccPage/load` (`{ id }`) | Vrátí stránku vč. `sectionList`. |
| `eccPage/create` (`{ name }`) | Založí stránku. |
| `eccPage/createSectionBefore` / `createSectionAfter` (`{ id, sectionId }`) | Vloží novou sekci. |
| `eccPage/updateSectionOrder` (`{ id, sectionList }`) | Přeuspořádá sekce (pole id). |
| `eccPage/deleteSection` (`{ id, sectionId }`) | Smaže sekci. |
| `eccSection/list` (`{ ... }`) | Vrátí sekce. |
| `eccSection/lock` / `unlock` (`{ id, uu5String? }`) | Zamkne/odemkne sekci pro editaci; `unlock` s `uu5String` uloží obsah. |

Doporučený způsob implementace: postavit na `Dao`/`Crud` z `caio-server` (kolekce `eccPage`, `eccSection`) a use case handlery nad nimi doplnit ručně — konvence `list/create/update/delete` z `Crud` samotného nestačí (chybí pořadí sekcí, lock, before/after inserty).

---

## capo-google-disk

`Utils.image` — pomocné funkce pro práci s obrázky uloženými přes `caio-server`'s `BinaryStore` (soubory na Google Drive, `referrerPolicy="no-referrer"` v `Image`/`Photo` komponentách kvůli tomu, jak Drive servíruje soubory).

## uu5tilesg02-extension

Interní glue vrstva, na které stojí `UiElements.Crud` — veřejně použitelná i samostatně, pokud appka potřebuje `uu5tilesg02` List/Table napojit na vlastní REST endpoint místo výchozího uuApp/uuCloud bindingu.

| Export | Desc |
|---|---|
| `withServerlessTable(Component)` | HOC, který z prostého pole objektů (`data`) odvodí `serieList`/`columnList`/`filterDefinitionList`/`sorterDefinitionList` (typová detekce: číslo, odkaz, datum, date-time), pokud nejsou předané explicitně. Řeší i loading skeleton stav. |
| `ListBlock` | Skládá `uu5tilesg02` `List`/`Table` (`viewType`) do `Uu5Elements.Block` s filter barem, serie/filter/sorter manager modály a bulk action barem. `UiElements.Crud` používá `withServerlessTable(ListBlock)`. |
| `ServerlessControllerProvider` | `Uu5Tiles.ControllerProvider`, kde `serieList`/`filterList`/`sorterList` žijí jako lokální state (místo napojení na uuCloud controller). |

---

## Vývoj tohoto repa

```bash
npm install
```

Balíček se nepublikuje samostatně na npm registry — do appky se dostává buď z `repo.plus4u.net`, nebo (dokud tam není) přes lokální tarball, viz [caio-devkit README](../caio-devkit/README.md#vytvoření-appky-z-lokálních-tarballů):

```bash
npm pack --pack-destination dist
```

---

## Known issues

Reprodukované při rozjezdu appky na tomhle stacku. Kontext a plán úprav na straně buildu je v README `caio-devkit`, sekce *Frontend architektura: uu5 přes `Uu5Loader`, ne přes bundler*.

- ~~**JSX v souborech `.js`.**~~ **Opraveno 2026-08-24** — 23 zdrojů s JSX je přejmenovaných na `.jsx` a relativní importy jsou bez přípony. Appky už nepotřebují ten `enforce: "pre"` plugin s esbuild `loader: "jsx"`; ověřeno buildem referenční appky bez něj.
- **Root barrel `caio-ui` se pod Vite nedá naimportovat.** `src/index.js` exportuje `UiEcc` → `uu5richtextg01-elements`, a ten si **při inicializaci modulu** dereferencuje `Utils.Uu5Loader.get("uu5g05-forms")`. Když je `uu5g05-forms` zbundlované do appky, loader o něm neví a vrátí `undefined` → `Cannot read properties of null (reading 'get')`. (Dřív tu stálo, že loader nemá `set` a nejde do něj nic zaregistrovat — to je omyl, `Uu5Loader.set(name, { __useDefault: true, default: x })` existuje.) **Až se knihovny budou načítat přes loader místo bundlování, tenhle problém zmizí sám** — viz plán v README `caio-devkit`. Importuj submoduly: `import UiApp from "caio-ui/src/caio-ui-app"`. **`UiEcc` je pod Vite nepoužitelné.** Chtělo by to `exports` mapu a vyndat `UiEcc` z barrelu.
- **`config.js` čte `process.env.OUTPUT_NAME`**, které `createViteConfig` v `caio-devkit` nedefinuje → `ReferenceError: process is not defined`. Appka si ho musí dodefinovat sama.
- **`UiEcc` vyžaduje backend, který `caio-server` nedodává.** Viz sekce [UiEcc](#uiecc) — bez vlastní implementace `eccPage`/`eccSection` use cases appka spadne na 404 při prvním renderu `Page`.
- **`UiAuth.Unauthenticated` volá nedefinované `register()`.** Tlačítko „Registrovat se“ je `disabled`, takže to nevyskočí, ale `register` v `unauthenticated.js` neexistuje — po odblokování tlačítka to hodí `ReferenceError`.
