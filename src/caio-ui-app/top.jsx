//@@viewOn:imports
import {
  createVisualComponent,
  withStickyTop,
  useBackground,
  useEffect,
  useRef,
  useState,
  useRoute,
  BackgroundProvider,
  PropTypes,
  Utils,
} from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config";
import { _useTopStateWriter } from "./top-context";
//@@viewOff:imports

//@@viewOn:constants
// Stejná výška, jakou má Top v uu_plus4u5g02-elements (Tools.TOP_HEIGHT). Dvouřádkový
// obsah (Uu5Elements.Header s title + subtitle) se do ní vejde.
const TOP_HEIGHT = 56;

// Ikona sbaleného menu. ActionGroup má default "uugds-dots-vertical", což je vzor pro
// aplikační akce; lišta webu chce hamburger. Nastavuje se vždy, není to prop.
const MENU_ICON = "uugds-menu";

// withStickyTop nám umí poslat menší zIndex; 900 je hodnota, pod kterou lišta nesmí spadnout,
// aby ji nepřekryly absolutně pozicované prvky obsahu. Nad ní jsou modal (1000) i popover
// a alert (2000), takže otevřené menu uu5 komponent lištu naopak překryje správně.
// Stejná pojistka je v uu_plus4u5g02-elements/_top/top-view.js.
const MIN_Z_INDEX = 900;

// Přechody vzhledu lišty (podklad, text, stín po dosednutí). MUSÍ jít do inline stylu, ne
// do třídy: withStickyTop posílá vlastní inline `transition: top 300ms` a inline zápis
// `transition` ze třídy celý přebije -- vzhled by pak přeskakoval skokem. Proto se obě
// hodnoty spojují (viz `usedProps` v renderu).
const APPEARANCE_TRANSITION = "background 160ms ease, color 160ms ease, box-shadow 160ms ease";
//@@viewOff:constants

//@@viewOn:helpers
/**
 * Props vzhledu jdou zadat i jako funkci stavu lišty, takže se dá reagovat na „dosedla".
 *
 *   cssBackground={({ stuck }) => (stuck ? "#FBF9F0" : "transparent")}
 */
function resolve(value, state) {
  return typeof value === "function" ? value(state) : value;
}

/** `href` začínající `#` je kotva na aktuální stránce, cokoli jiného je routa. */
function isAnchor(href) {
  return typeof href === "string" && href.startsWith("#");
}

const SCROLL_DURATION = 1000;

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

/**
 * Plynulý scroll na `targetY` za přesně `SCROLL_DURATION` ms -- vlastní rAF smyčka,
 * ne `scrollIntoView({ behavior: "smooth" })`, ta dobu neumí zadat a jede prohlížečovou
 * neznámou rychlostí. Respektuje `prefers-reduced-motion`: pak skočí rovnou.
 */
function animateScrollTo(targetY) {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo(0, targetY);
    return;
  }

  const startY = window.scrollY;
  const distance = targetY - startY;
  const startTime = performance.now();

  function step(now) {
    const t = Math.min((now - startTime) / SCROLL_DURATION, 1);
    window.scrollTo(0, startY + distance * easeInOutQuad(t));
    if (t < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

/**
 * Skok na kotvu.
 *
 * Odsazení pod sticky lištou se NEPOČÍTÁ tady -- respektuje se `scroll-margin-block-start`
 * cílového prvku (stejně jako u nativního `scrollIntoView`), takže si ho každá appka řídí
 * v CSS své sekce.
 */
function scrollToAnchor(href) {
  const el = document.getElementById(href.slice(1));
  if (!el) {
    animateScrollTo(0);
    return;
  }
  const scrollMarginTop = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  animateScrollTo(el.getBoundingClientRect().top + window.scrollY - scrollMarginTop);
}

/** Stín při dosednutí. Stejný GDS efekt, jaký kreslí withStickyTop (elevationUpper). */
function getStuckShadow() {
  const e = Uu5Elements.UuGds.EffectPalette.getValue(["elevationUpper"]);
  if (!e) return undefined;
  return `${e.offsetX ?? 0}px ${e.offsetY ?? 0}px ${e.blurRadius ?? 0}px ${e.spreadRadius ?? 0}px ${e.color}`;
}

/**
 * Dosedla lišta na horní hranu?
 *
 * Vlastní detekce místo `stickyTopStuck` z withStickyTop schválně: ten svůj stub prvek
 * pozicuje přes CSS `anchor()` a jméno ukotvení nastavuje JEN tehdy, když je scroll
 * kontejner HTMLElement. Když stránku scrolluje okno (běžná webová stránka, ne uu5 appka
 * s vlastním scrollovacím divem), ukotvení se nenajde, stub spadne na fallback
 * `top: -1000000px` s výškou milion pixelů, takže viewport protíná VŽDY -- a `stuck`
 * proto nikdy nepřepne. Ověřeno v Chrome 152.
 *
 * Sentinel je nulově vysoký prvek hned nad lištou: jak se dostane nad horní hranu
 * viewportu, lišta dosedla. Měří se na scroll eventu, ne IntersectionObserverem --
 * ten (stejně jako rAF) v neaktivním panelu nedoručuje callbacky, takže by stav
 * na pozadí zůstal zamrzlý.
 */
function useStuck() {
  const sentinelRef = useRef();
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return undefined;

    const check = () => setStuck(el.getBoundingClientRect().top < 0);
    check(); // stav po reloadu uprostřed stránky

    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check, { passive: true });
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  return { sentinelRef, stuck };
}

/**
 * Doplní položkám menu chování podle `href`: kotva scrolluje, routa naviguje.
 * Rekurzivně, protože položka může mít `itemList` (dropdown).
 */
function withItemBehaviour({ href, params, itemList, ...item }, setRoute) {
  if (itemList) item.itemList = itemList.map((it) => withItemBehaviour(it, setRoute));

  if (href) {
    // Dropdown reaguje na onLabelClick, obyčejná položka na onClick.
    const key = itemList ? "onLabelClick" : "onClick";
    if (isAnchor(href)) {
      // href zůstává v DOM, aby to byl skutečný odkaz (SEO, otevření v novém panelu),
      // ale skok si odbavíme sami -- nativní skok kotvy ignoruje sticky lištu.
      item.href = href;
      item[key] = (e) => {
        e?.preventDefault?.();
        scrollToAnchor(href);
      };
    } else {
      item[key] = () => setRoute(href, params);
    }
  }

  return item;
}

/**
 * Odjetá lišta (`visibility: "onScrollUp"`) zůstává v DOM, takže se do ní dá vrátit
 * tabulátorem -- fokus by pak seděl na odkazu nad horní hranou viewportu, kam uživatel
 * nevidí. Když se to stane, srolujeme o pixel nahoru: withStickyTop z toho vyrobí směr
 * "up" a lištu vysune. Levnější než duplikovat jeho stav, a na vrcholu stránky (lišta
 * v toku, rect.top >= 0) se nestane nic.
 */
function revealOnFocus(e) {
  if (e.currentTarget.getBoundingClientRect().top < 0) window.scrollBy(0, -1);
}

/**
 * Logo jako node | uri | { uri, href, target, onClick, tooltip }.
 *
 * `TouchButton` (RichIcon pod kapotou) místo ručního `<img>` v `Link`u -- `imageSrc` dá
 * logu pořádný touch target (min. velikost, hover/focus/pressed stavy z GDS) zadarmo,
 * `tooltip` prop dodá i popisek. `height` přebíjí GDS size stupně stejným číslem, jaké
 * dřív dostával `<img>`, ať zůstane sladěné s výškou lišty.
 */
function renderLogo(logo) {
  if (!logo) return null;
  if (typeof logo !== "string" && typeof logo !== "object") return null;
  if (typeof logo === "object" && !logo.uri) return logo; // už je to node

  const { uri, href, target, onClick, tooltip } = typeof logo === "string" ? { uri: logo } : logo;

  return (
    <Uu5Elements.TouchButton
      imageSrc={uri}
      tooltip={tooltip}
      height={TOP_HEIGHT - 16}
      href={href}
      target={target}
      onClick={
        href && isAnchor(href)
          ? (e) => {
            e?.preventDefault?.();
            scrollToAnchor(href);
            onClick?.(e);
          }
          : onClick
      }
      colorScheme="building"
      significance={logo.significance ?? "common"}
    />
  );
}
//@@viewOff:helpers

const TopView = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Top",
  nestingLevel: "areaCollection",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    logo: PropTypes.oneOfType([PropTypes.node, PropTypes.string, PropTypes.object]),
    menu: PropTypes.shape({
      itemList: PropTypes.array,
      alignment: PropTypes.oneOf(["left", "right"]),
    }),
    // Vzhled: každý z těchhle propsů bere i funkci ({ stuck }) => hodnota.
    transparent: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
    cssBackground: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    cssColor: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    colorScheme: PropTypes.oneOfType([PropTypes.colorScheme("building", "meaning", "basic"), PropTypes.func]),
    maxWidth: PropTypes.oneOfType([PropTypes.unit, PropTypes.func]),
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    logo: undefined,
    menu: undefined,
    transparent: false,
    cssBackground: undefined,
    cssColor: undefined,
    colorScheme: "building",
    maxWidth: undefined,
    noPrint: true,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { logo, menu, children, style } = props;

    const [, setRoute] = useRoute();
    const ambientBackground = useBackground();
    const setTopState = _useTopStateWriter();
    const { sentinelRef, stuck } = useStuck();

    const state = { stuck };

    const transparent = resolve(props.transparent, state);
    const colorScheme = resolve(props.colorScheme, state);
    const cssBackground = resolve(props.cssBackground, state);
    const cssColor = resolve(props.cssColor, state);
    const maxWidth = resolve(props.maxWidth, state);

    // Barvy z GDS podle colorScheme; cssBackground/cssColor je přebijí.
    const gdsColors = Uu5Elements.UuGds.getValue(["Shape", "background", "full", colorScheme, "highlighted"])?.default
      ?.colors;

    const background = transparent ? "transparent" : (cssBackground ?? gdsColors?.background);
    const color = cssColor ?? gdsColors?.foreground;

    // Aby uu5 komponenty v liště volily čitelné odstíny, musí vědět, na čem stojí.
    // Průhledná lišta dědí okolí, jinak se to odvodí ze skutečné barvy podkladu.
    let contentBackground = ambientBackground;
    if (!transparent) {
      const solid = cssBackground ?? gdsColors?.background;
      if (gdsColors?.gdsBackground && !cssBackground) contentBackground = gdsColors.gdsBackground;
      else if (typeof solid === "string" && /^(#|rgba?\(|hsla?\()/.test(solid)) {
        contentBackground = Utils.Color.isLight(solid) ? "light" : "dark";
      }
    }

    // Stav lišty nahoru do TopProvideru, ať na něj může reagovat i obsah stránky.
    const height = TOP_HEIGHT;
    useEffect(() => {
      setTopState?.((prev) => (prev.stuck === stuck && prev.height === height ? prev : { stuck, height }));
    }, [setTopState, stuck, height]);

    const itemList = menu?.itemList?.map((item) => withItemBehaviour(item, setRoute));
    //@@viewOff:private

    //@@viewOn:render
    // Inline style dodává withStickyTop (top, position, zIndex, transition). Naše přechody
    // se k jeho `top` PŘIPOJUJÍ, nenahrazují ho -- kdyby se přepsal, lišta by se při
    // `onScrollUp` neposouvala plynule, jen by problikávala.
    const usedProps = {
      ...props,
      style: {
        ...style,
        zIndex: style?.zIndex != null && style.zIndex < MIN_Z_INDEX ? MIN_Z_INDEX : style?.zIndex,
        transition: [style?.transition, APPEARANCE_TRANSITION].filter(Boolean).join(", "),
      },
    };

    // getAttrs, ne splitProps: obal lišty je obyčejný <div>, takže mu nesmí protéct
    // uu5 props (elementRef, elementAttrs, noPrint) -- React by na nich hlásil warning.
    const attrs = Utils.VisualComponent.getAttrs(
      usedProps,
      Config.Css.css({
        background,
        color,
        blockSize: TOP_HEIGHT,
        boxShadow: stuck ? getStuckShadow() : undefined,
        // `transition` tady schválně NENÍ -- viz APPEARANCE_TRANSITION.
      }),
    );

    return (
      <BackgroundProvider background={contentBackground}>
        {/* Sentinel pro detekci dosednutí -- musí být MIMO sticky prvek a hned nad ním. */}
        <div ref={sentinelRef} aria-hidden="true" className={Config.Css.css({ blockSize: 0 })} />
        {/* elementRef MUSÍ jít na tenhle div -- withStickyTop přes něj element pozoruje.
            Bez toho se lišta vůbec nelepí. */}
        <div {...attrs} ref={props.elementRef} onFocus={revealOnFocus}>
          <div
            className={Config.Css.css({
              maxWidth,
              marginInline: maxWidth ? "auto" : undefined,
              blockSize: "100%",
              display: "flex",
              alignItems: "center",
              gap: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "e"]),
              paddingInline: Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "d"]),
            })}
          >
            {/* flex: none na logu a menu (a 1 1 auto na obsahu) schválně na konkrétních
                prvcích, ne přes `&>*` -- to má stejnou specificitu jako třída potomka
                a pak o výsledku rozhoduje pořadí emotion stylů. */}
            {logo != null && (
              <div className={Config.Css.css({ flex: "none", display: "flex", alignItems: "center" })}>
                {renderLogo(logo)}
              </div>
            )}
            {children != null && (
              <div className={Config.Css.css({ flex: "0 1 auto", minInlineSize: 0 })}>
                {typeof children === "function" ? children(state) : children}
              </div>
            )}
            {itemList?.length > 0 && (
              // Menu musí dostat VŠECHNU zbylou šířku (flex: 1 1 auto), ne se smrsknout
              // na obsah. ActionGroup se totiž rozhoduje podle šířky svého elementu --
              // ve `flex: none` obalu naměří skoro nic a sbalí položky do menu i na desktopu.
              // Zarovnání vpravo řeší ActionGroup sám přes alignment.
              <div className={Config.Css.css({ flex: "1 1 auto", minInlineSize: 0 })}>
                {/* ActionGroup měří položky a sám je sbaluje full -> ikona -> menu podle
                    šířky kontejneru, takže mobil a tablet nepotřebují vlastní větev. */}
                <Uu5Elements.ActionGroup
                  itemList={itemList}
                  alignment={menu?.alignment ?? "right"}
                  collapsedMenuProps={{ icon: MENU_ICON, iconOpen: null, iconClosed: null }}
                />
              </div>
            )}
          </div>
        </div>
      </BackgroundProvider>
    );
    //@@viewOff:render
  },
});

/**
 * Horní lišta appky: logo + obsah (children) + menu.
 *
 * Lepení k horní hraně (position: sticky, offset, z-index) řeší `withStickyTop` z uu5g05.
 * `sticky` prop se na jeho props mapuje v `page.jsx`, protože je musí dostat HOC, ne view.
 *
 * `render: false` vypíná pomocné prvky HOC (stub pro detekci dosednutí + stín). Na stránce
 * scrollované oknem totiž jeho detekce nefunguje (viz `useStuck`), takže by ty prvky jen
 * ležely v DOM a stín by se nikdy neukázal. Dosednutí i stín si proto kreslíme sami --
 * stín ze stejného GDS efektu (elevationUpper), takže vypadá stejně.
 *
 * `gatherMetrics` je vypnuté taky: s ním hook na každý scroll event nakrátko přepne lištu
 * na `position: static`, aby změřil offset. Výška lišty je konstanta (TOP_HEIGHT).
 *
 * `visibility: "onScrollUp"` = lišta při scrollu dolů odjede pryč a vrátí se, jakmile
 * uživatel scrolluje nahoru. Appka to přepíná propem `sticky` na `Page`/`Spa`
 * (`"always"` = pořád vidět, `false` = vůbec se nelepí).
 *
 * Jak to hook dělá: sám žádnou třídu ani `display` nenastavuje -- jen v `style` odečte od
 * `top` výšku lišty, takže sjede na `top: -56px` a je celá nad hranou viewportu; zpátky
 * na `top: 0` ji vrátí vlastní přechod (`top 400ms`). Proto to funguje i s `render: false`
 * (ten vypíná jen pomocné prvky HOC, ne pozicování) a proto musí `elementRef` sedět na
 * tomtéž divu -- z něj se měří výška, o kterou se lišta schovává. Směr scrollu hook čte
 * ze `scroll` eventu, stejně jako naše detekce dosednutí; pozor při ověřování, že
 * neaktivní panel prohlížeče scroll eventy vůbec nedoručuje a stav v něm zamrzne.
 */
const Top = withStickyTop(TopView, { visibility: "onScrollUp", render: false });

//@@viewOn:exports
export { Top, TOP_HEIGHT };
export default Top;
//@@viewOff:exports
