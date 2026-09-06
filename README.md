# caio-ui

React komponenty postavené nad Unicorn **uu5g05**/uuSuite ekosystémem, navržené k párování s [`caio-server`](https://github.com/capo00/caio-server) (backend) a scaffoldu [`caio-devkit`](https://github.com/capo00/caio-devkit). Součást monorepa [`caio-architecture`](../README.md) — tam je popsané, jak tyhle tři repa dohromady tvoří appku.

---

## Prerekvizity

- **Přístup k registry `repo.plus4u.net`** — peer dependencies (`uu5*`) nejsou na npmjs:

  ```
  peerDependencies: uu5g05, uu5g05-elements, uu5g05-forms,
                    uu5tilesg02, uu5tilesg02-elements, uu5tilesg02-controls,
                    uu5codekitg01, uu5richtextg01-elements,
                    uu5imagingg01, uu5imagingg01-tools
  ```

- Backend, který servíruje `caio-server`ovou konvenci (`/auth/*`, `<entity>/list|create|createMany|update|delete|deleteMany`).

## Import

```javascript
import { UiApp, UiAuth, UiElements, UiEcc } from "caio-ui";
```

Root import **funguje od 2026-08-24**, kdy `caio-devkit` přestal uu5 bundlovat a začal je načítat přes `uu5loaderg01` — `uu5richtextg01-elements` si při inicializaci modulu dereferencuje `Utils.Uu5Loader.get("uu5g05-forms")` a loader mu ji teď vrátí. Ověřeno na referenční appce (nula chyb v konzoli).

Submoduly jdou importovat i přímo, ale ošklivě, protože `package.json` nemá `exports` mapu:

```javascript
import UiApp from "caio-ui/src/caio-ui-app";
```

Viz [Known issues](#known-issues).

## Vývoj: jak se změna dostane do appky

Appky konzumují `caio-ui` jako **lokální tarball** (`"caio-ui": "file:../../caio-architecture/caio-ui/dist/caio-ui-0.1.0.tgz"`),
takže po každé změně ve `src/` je potřeba přebalit **a přeinstalovat**:

```bash
cd caio-architecture/caio-ui && npm pack --pack-destination dist
cd ../../<appka>/client && rm -rf node_modules/caio-ui \
  && npm install --no-save --force file:../../caio-architecture/caio-ui/dist/caio-ui-0.1.0.tgz
```

Samotné `npm install` **nestačí**: verze v `package.json` se nemění, takže npm vezme balíček
z cache a novou verzi souborů ignoruje (ověřeno — nový soubor v tarballu se do
`node_modules` nedostal). Proto to `rm -rf` + `--force`. Až bude `caio-ui` v registry,
padá to celé.

---

## Texty (LSI)

Všechny texty komponent `caio-ui` leží v `src/lsi/cs.json` a `src/lsi/en.json` a čtou se přes `src/lsi/import-lsi.js` — stejný tvar lazy LSI, jaký používá uu5g05 pro své vlastní texty. Do 2026-08-31 byly rozeseté natvrdo po komponentách jako `{ cs: "Smazat" }`, takže knihovna uměla jen česky.

Appka do nich **nemá jak sáhnout zvenčí** a nemá to potřebovat: jsou to popisky tlačítek a dialogů `Crud`/`BinaryCrud`, ne obsah. Když appka potřebuje jiné znění, skládá si vlastní tabulku přes `Crud.generate()` (viz [Crud](#crud)) — což je stejná rada jako u vlastních sloupců.

Struktura JSONu kopíruje moduly:

```
app.top.*            UiApp.Top
elements.crud.*      UiElements.Crud
elements.binaryCrud.* UiElements.BinaryCrud
ecc.*                UiEcc
```

Přidání jazyka = nový `<lang>.json` **a** řádek v `IMPORT_BY_LANGUAGE` v `import-lsi.js` (proč ten výčet, viz `caio-devkit` README, 5.6).

---

## UiApp

Root wrapper appky a routing guard.

| Export | Desc |
|---|---|
| `SpaProvider` (`{ cmdPrefix = "/auth", languageList = ["cs"] }`) | Obalí appku providery: `AppBackgroundProvider`, `LanguageListProvider`, `LanguageProvider`, `UiAuth.SessionProvider` (dostane `cmdPrefix`), `RouteProvider`. `languageList` říká, které jazyky appka nabízí — s víc než jedním má `Uu5Elements.LanguageSelector` z čeho vybírat a LSI objekty se čtou v obou jazycích. |
| `Spa` (`{ top, footer, main, errorFallback }`) | Vizuální root: `ErrorBoundary` (fallback `SpaError`) + `Uu5Elements.ModalBus` + `Uu5Elements.AlertBus`. Když dostane `top` nebo `footer`, složí navíc celý rám stránky přes `Page` — appka pak nemá vlastní komponentu na hlavičku a patičku. Bez nich renderuje jen `children` (jako dřív). |
| `Page` (`{ top, sticky, footer, maxWidth, padding, fullHeight }`) | Rám stránky: horní lišta + `<main>` + patička. Viz níž. |
| `useTop()` | `{ stuck, height }` horní lišty. Pro obsah stránky, který má reagovat na to, že lišta dosedla. |
| `withRoute(Component, { profileList })` | HOC pro route guard. Bez `profileList` prostě vyrenderuje `Component`. S `profileList` čte `UiAuth.useSession()`: `pending` → `null`, `notAuthenticated` → `UiAuth.Unauthenticated`, `authenticated` bez shody profilu → `UiAuth.Unauthorized`, jinak `Component`. Položka končící `:*` je **rozsahová** — viz níž. |

**`Top` se schválně NEEXPORTUJE.** Lišta se nastavuje výhradně přes prop `top` na `Page`/`Spa`,
aby na ni byla v celém stacku jedna cesta.

```javascript
import { UiApp } from "caio-ui";
import Uu5Elements from "uu5g05-elements";

function App() {
  return (
    <UiApp.SpaProvider cmdPrefix="/auth">
      <UiApp.Spa
        top={{
          logo: { uri: "/logo.svg", href: "#hero", tooltip: "Domů" },
          children: <Uu5Elements.Header title="Roubený ráj" subtitle="Český ráj" />,
          menu: { itemList: [{ children: "Galerie", href: "#galerie" }] },
          cssBackground: "#1E3E23",
          cssColor: "#FBF9F0",
          maxWidth: 1140,
        }}
        footer={<Footer />}
        main={{ padding: false }}
      >
        <Router />
      </UiApp.Spa>
    </UiApp.SpaProvider>
  );
}

// stránka dostupná jen profilům Admin/Manager
const AdminPage = UiApp.withRoute(PlayersPage, { profileList: ["Admin", "Manager"] });
```

#### Rozsahové profily (`role:*`)

`identity.profileList` je plochý seznam stringů, který jde beze změny do JWT. Role, která
platí pro **jeden záznam** místo pro celou appku, si proto nese rozsah ve vlastním jméně:
`teamEditor:6512ab34…`, `projectOwner:42`. Porovnání na přesnou shodu pak neumí vyjádřit
„kdokoli, kdo spravuje nějaký tým" — a přesně to route guard obvykle potřebuje, protože
*který* tým to je, si obrazovka zjistí až uvnitř.

Položka požadovaného seznamu končící **`:*`** proto matchuje jakýkoli profil s tím prefixem
a **neprázdným** rozsahem; holé `teamEditor` neprojde, protože „editor nějakého týmu" to není.
Položky bez `:*` se dál porovnávají přesně, takže se pro stávající volání nic nemění.

```javascript
const MatchesPage = UiApp.withRoute(Matches, { profileList: ["authorities", "teamEditor:*"] });

// uvnitř obrazovky: které týmy to vlastně jsou
const { identity } = UiAuth.useSession();
const myTeamIdList = UiAuth.getScopeList(identity, "teamEditor");   // ["6512ab34…", …]
```

Je to **UX, ne bezpečnostní hranice** — co uživatel smí, rozhoduje server. Guard jen zařídí,
že se nenabízí obrazovka, ze které by se stejně vrátilo 401.

### `top` — props horní lišty

| Prop | Typ | Default | Co dělá |
|---|---|---|---|
| `logo` | node \| uri \| `{ uri, href, target, onClick, tooltip }` | — | Node = vlastní blok. `href` začínající `#` scrolluje na kotvu. |
| `children` | node \| `({ stuck }) => node` | — | Volný obsah lišty. Typicky `Uu5Elements.Header` s `title` + `subtitle`. |
| `menu` | `{ itemList, alignment }` | — | `itemList` = položky `Uu5Elements.ActionGroup` (props `Button`/`Dropdown`) navíc s `href`. `href` s `#` = kotva, jinak routa. |
| `sticky` | `bool` \| `"always"` \| `"onScrollUp"` | `true` = `"onScrollUp"` | Lepení k horní hraně (`withStickyTop`). Prop se zadává na `Page`/`Spa`, ne do `top`. Viz níž. |
| `transparent` | `bool` \| `({ stuck }) => bool` | `false` | Průhledné pozadí lišty (např. nad hero fotkou). |
| `cssBackground` | `string` \| `({ stuck }) => string` | z `colorScheme` | Pozadí lišty jako CSS. Přebíjí `colorScheme`. |
| `cssColor` | `string` \| `({ stuck }) => string` | z `colorScheme` | Barva textu. |
| `colorScheme` | GDS colorScheme \| fn | `"building"` | Barvy z GDS palety (`Shape.background.full.<scheme>.highlighted`). |
| `maxWidth` | `unit` \| fn | — | Šířka vycentrovaného obsahu lišty. |

**Reakce na dosednutí:** každý prop vzhledu bere i funkci `({ stuck }) => hodnota`; `children`
můžou být render-prop se stejným argumentem; a kdekoli v obsahu stránky je k dispozici
`UiApp.useTop()`. Při dosednutí lišta sama přidá stín (GDS `elevationUpper`).

**Chování při scrollu (`sticky`):** výchozí je `"onScrollUp"` — lišta při scrollu dolů
odjede nad hranu viewportu a vrátí se, jakmile uživatel scrolluje nahoru. Obsah tak má
při čtení celou výšku okna a navigace je na dosah jedním gestem. `"always"` = lišta je
vidět pořád, `false` = vůbec se nelepí.

Jak se to schovává: `withStickyTop` nemění `display` ani třídu, jen v `style` odečte od
`top` výšku lišty (`top: -56px`) a zpátky na `top: 0` ji vrátí přechodem. Praktické
důsledky:

- `elementRef` z HOC musí sedět na tomtéž `<div>`, který lištu kreslí — z něj se měří
  výška, o kterou se schovává. Funguje to i s `render: false` (ten vypíná jen pomocné
  prvky HOC, ne pozicování).
- Vlastní `transition` v `className` lišty by se neuplatnil — HOC posílá inline
  `transition: top ...` a inline zápis přebije třídu. `Top` proto svoje přechody
  (podklad, barva, stín) do toho inline stylu **připojuje**, ne aby je psal do třídy.
- Odjetá lišta zůstává v DOM a dá se do ní vrátit tabulátorem. `Top` proto při fokusu
  nad horní hranou sroluje o pixel nahoru, čímž si HOC vyrobí směr „up" a lištu vysune.
- `stuck` (a tedy i `useTop()`) znamená „scrollovali jsme za lištu", ne „lišta je vidět".
  Odjetá lišta je pořád `stuck`, jen ji není kam vykreslit.
- Skoky na kotvu se odsazují přes `scroll-margin-block-start` cílové sekce. Při skoku
  dolů lišta odjede, takže odsazení není potřeba; při skoku nahoru zůstane vidět a bez
  toho odsazení překryje prvních ~56 px sekce.

**Responzivita:** menu staví na `Uu5Elements.ActionGroup`, který položky měří a podle šířky
kontejneru je sbaluje `plný popisek → ikona → menu`. Na mobilu a tabletu tedy nav položky
spadnou pod jedno tlačítko s ikonou `uugds-menu` bez jakéhokoli nastavování. Položka
s `collapsed: "never"` zůstane vidět vždy (typicky hlavní CTA).

### `main` / `Page` — props obsahu

| Prop | Typ | Default | Co dělá |
|---|---|---|---|
| `maxWidth` | `unit` | — | Vycentrovaná šířka `<main>`. |
| `padding` | `bool` \| `unit` | `true` | `true` = výchozí odsazení appky (mobil menší), `false`/`0` = žádné (web si ho řeší v sekcích). |
| `fullHeight` | `bool` | `true` | `min-height: 100vh` na rámu, takže patička drží dole i u krátkého obsahu. |

### Identita v liště

Login/identity tlačítko se v současné verzi **nepřidává**. Do `Top` se vrátí až s `displayIdentity`
propem — dřív se přidávalo vždy, když `Top` dostal `menuList`, což je pro veřejný web bez
přihlašování cizí prvek.

---

## UiAuth

Session management napojený 1:1 na `Authentication` modul z `caio-server`.

| Export | Desc |
|---|---|
| `SessionProvider` (`{ cmdPrefix = "/auth" }`) | Při mountu zavolá `GET <cmdPrefix>` (s cookie) a uloží identitu. Poslouchá `postMessage({ type: "auth", identity })` — tím OAuth popup callback appce pošle výsledek přihlášení. |
| `useSession()` | `{ identity, state, login(), logout() }`. `state` je `"pending"` \| `"notAuthenticated"` \| `"authenticated"`. `login()` otevře popup na `/login.html` — přihlašovací stránku (viz níž). `logout()` zavolá `POST <cmdPrefix>/logout` a vynuluje identitu. |
| `Unauthenticated` | Placeholder box s tlačítkem „Přihlásit se“ (`login()`). Používá `withRoute` interně. |
| `Unauthorized` | Placeholder box „Nemáte oprávnění“. |
| `IdentityItem` (`{ identity, firstName?, surname?, name?, photo? }`) | Zobrazí uživatele (`Uu5Elements.InfoItem`). Když nedostane jméno/foto přímo v props, dotáhne je přes `identity/get`. |
| `FormIdentitySelect` | `uu5g05-forms` async select nad `identity/search` — pro výběr uživatele(ů) ve formuláři (např. přiřazení vlastníka záznamu). |
| `hasProfile(identity, profileList)` | Má identita aspoň jeden z požadovaných profilů? Položka končící `:*` je rozsahová (viz `withRoute`). Používá ho `withRoute` interně; appka ho volá tam, kde podmiňuje akci, ne celou obrazovku. |
| `getScopeList(identity, role)` | Rozsahy, které identita drží pro jednu roli: `getScopeList(identity, "teamEditor")` → `["6512ab34…"]`. |

```javascript
const { identity, state, login, logout } = UiAuth.useSession();
```

### Přihlašovací stránka `static/login/`

`login()` otevírá popup na **`/login.html`** — samostatnou stránku (`static/login/login.html`, `login.css`, `login.js`), ve které si uživatel vybere Google, Facebook, nebo se přihlásí či zaregistruje jménem a heslem.

Je to **čisté HTML, CSS a vanilla JS bez uu5 a bez Reactu**: popup se tím otevře v jednom requestu místo natažení celé appky. Není to tedy uu5 komponenta a nejde importovat — do buildu ji kopíruje `caio-devkit` (plugin `caio-devkit:login-page`) a při kopii do ní doplní jméno, `theme_color` a odkazy na favicony z `assets/meta/`.

Jak se chová:

- `GET /auth/config` jí řekne, **které providery** deployment vůbec má nakonfigurované a jaké je pravidlo na heslo — tlačítka i hláška u pole se tím řídí, takže pravidlo neexistuje dvakrát.
- **Tlačítka providerů drží jejich vlastní standardy**, ne paletu appky: Google bílé s rámečkem `#747775`, textem `#1f1f1f` a čtyřbarevným „G“ (v dark mode Googlem povolená tmavá varianta `#131314`/`#8e918f`/`#e3e3e3`), Facebook `#1877f2` s bílým „f“. V CSS jsou proto oddělená od tokenů tématu — obě značky svoje barvy, logo i formulaci textu vyžadují.
- Google/Facebook: naviguje **to samé okno** na `/auth/<provider>`. `window.opener` navigaci přežije, takže identitu pošle callback stránka ze serveru, jako dosud.
- Jméno a heslo: `POST /auth/login` nebo `/auth/register`, a stránka pak sama pošle `postMessage({ type: "auth", identity })` openerovi a zavře se — což `SessionProvider` už poslouchá.
- Otevřená přímo v tabu (bez openera) po úspěchu přesměruje na `/`.
- `/login.html`, ne `/login`: `caio-server` odpovídá na cesty bez přípony `index.html`, takže `/login` by vrátilo appku.
- **Reset hesla.** Stránka má čtyři režimy — `login`, `register`, `forgot` a `reset` — a přepíná je podle atributu `data-modes` na jednotlivých blocích. Odkaz „Zapomenuté heslo?“ se ukáže jen tehdy, když `GET /auth/config` hlásí `passwordResetEnabled` (tedy když má deployment nakonfigurovanou poštu), takže se nikdy nenabízí něco, co nemůže fungovat. `forgot` pošle `POST /auth/password/reset-request` a odpoví vždy stejně, ať e-mail známe nebo ne — server to neprozradí, tak ani stránka. Do režimu `reset` se přijde odkazem z mailu (`/login.html?reset=<token>`); po úspěšném `POST /auth/password/reset` **nepřijde cookie** (přístup do schránky není totéž co sezení u důvěryhodného zařízení), takže stránka přepne zpátky na `login`. Token se hned po použití vymaže z URL přes `history.replaceState`, aby nezůstal v historii ani v `Referer`.

Appka, která chce vlastní vzhled, si položí vlastní `client/public/login.html` — devkit svoji kopii v tom případě nevkládá.

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

Update i delete jsou u každého řádku vlastní viditelné ikony (ne schované v "..." menu) — `compact`
prop obojí přesune do menu, pokud je řádků moc na to, aby se tam vešly čtyři ikony vedle sebe.
Výběr řádků (checkboxy) odemkne hromadné mazání, které volá `entity/deleteMany({ idList })` a po
úspěchu tabulku sám reloadne (`handlerMap.load(dtoIn)`), takže smazané řádky zmizí okamžitě.

### Image

`<UiElements.Image>` — obyčejný `<img>` s `referrerPolicy="no-referrer"`. Nepotřebné pro `BinaryStore`
(Google Cloud Storage servíruje obsah přímo, žádný "no-referrer" quirk jako dřív Drive), ale
neškodí to nechat pro obrázky z jiných zdrojů, které to vyžadují.

### FormFile

`Uu5Forms`-kompatibilní form input pro `BinaryStore`. Existující hodnota (string `uri`) se ukáže
jako `Uu5Forms.Link` se zavíracím křížkem; `accept="image/*"` (bez čárky) přepne na
`Uu5Imaging.ImageInput`; jinak obyčejný `Uu5Forms.File`. Vyžaduje peer dependency `uu5imagingg01`.

### BinaryProvider / useBinary

`UiElements.BinaryProvider` / `UiElements.useBinary` -- už hotová dvojice z
`CrudContext.create("binary")`, napojená na `binary/list|get|create|update|delete|deleteMany` z
`caio-server`'s `BinaryStore.createApi()` (na rozdíl od `CrudContext.create(entity)` samotného se
tahle dvojice nevolá, jen se importuje). `BinaryCrud` ji používá interně, ale jde použít i
samostatně pro vlastní UI nad soubory (`<UiElements.BinaryProvider>{(dataList) => ...}</UiElements.BinaryProvider>`).

### BinaryCrud

Hotová admin tabulka souborů nad `BinaryProvider` (sloupce: náhled + odkaz *Stáhnout* -- u
obrázků obojí, u ostatních typů jen odkaz --, název, velikost, datum, mime type; formulář na
create/update používá `FormFile`). Před uploadem obrázek zmenší a převede na webp
(`uu5imagingg01-tools`, peer dependency). Appka, která potřebuje vlastní pole navíc (např. tagy),
si postaví vlastní `Crud`/`Crud.generate()` konfiguraci stejným způsobem, jakým je postavená
tahle — `BinaryCrud` samo o sobě je záměrně obecné, ne rozšiřitelné přes props.

Prop `collection` je **povinná**: `BinaryStore` sdružuje soubory do pojmenovaných kolekcí
a autorizaci řeší per kolekce, takže tabulka vždycky ukazuje právě jednu z nich. Slouží zároveň
jako filtr seznamu i jako pole na všem, co se tady vytvoří — ve formuláři pro ni pole není, uživatel
o ní nic nerozhoduje.

```javascript
import { UiElements } from "caio-ui";

function GalleryPage() {
  return <UiElements.BinaryCrud collection="gallery" />;
}
```

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
- ~~**Root barrel `caio-ui` se pod Vite nedá naimportovat.**~~ **Vyřešeno 2026-08-24** architekturou v `caio-devkit`: `uu5g05-forms` je v import mapě loaderu, takže `Utils.Uu5Loader.get("uu5g05-forms")`, které si `uu5richtextg01-elements` dělá při inicializaci modulu, dostane knihovnu. Dokud se uu5 bundlovalo, loader o ní nevěděl a padalo to na `Cannot read properties of null (reading 'get')` — a nešlo to obejít, protože zaregistrovat zbundlovanou knihovnu **veřejné API loaderu neumí** (`Uu5Loader.set` neexistuje, ověřeno za běhu; funguje jen `window.System.set`, což je sáhnutí mimo API).
- **Chybí `exports` mapa.** Submodul se musí importovat jako `caio-ui/src/caio-ui-app` místo `caio-ui/app`.
- **`config.js` čte `process.env.OUTPUT_NAME`**, které `createViteConfig` v `caio-devkit` nedefinuje → `ReferenceError: process is not defined`. Appka si ho musí dodefinovat sama.
- **`UiEcc` vyžaduje backend, který `caio-server` nedodává.** Viz sekce [UiEcc](#uiecc) — bez vlastní implementace `eccPage`/`eccSection` use cases appka spadne na 404 při prvním renderu `Page`.
- **`stickyTopStuck` z `uu5g05.withStickyTop` nefunguje, když stránku scrolluje okno** (zjištěno 2026-09-01, uu5g05 1.50.8, Chrome 152). Hook svůj měřicí stub pozicuje přes CSS `anchor()` a jméno ukotvení nastavuje **jen když je scroll kontejner `HTMLElement`**. U běžné webové stránky je scroll kontejner `window`, ukotvení se nenajde, stub spadne na fallback `top: -1000000px` s výškou milion pixelů — takže viewport protíná vždy, `isIntersecting` je pořád `true` a `stuck` nikdy nepřepne. Důsledek: nefunguje ani nativní stín při dosednutí. `Top` si proto dosednutí detekuje sám (nulový sentinel nad lištou + scroll listener) a stín kreslí ze stejného GDS efektu (`elevationUpper`). V uu5 appkách se scrollovacím divem to problém není.
- ~~**`UiAuth.Unauthenticated` volá nedefinované `register()`.**~~ **Opraveno 2026-08-25** — tlačítko je smazané, registrace se dělá na přihlašovací stránce.
