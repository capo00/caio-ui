//@@viewOn:imports
import { createVisualComponent, useScreenSize, PropTypes, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config";
import Top, { TOP_HEIGHT } from "./top";
import { TopProvider } from "./top-context";
//@@viewOff:imports

//@@viewOn:helpers
/**
 * `sticky` appky -> props, které čte withStickyTop HOC nad Topem.
 * Musí se to přeložit tady, protože ty props patří HOC, ne view komponentě.
 */
function getStickyProps(sticky) {
  if (sticky === false) return { stickyTopDisabled: true };
  if (sticky === "onScrollUp" || sticky === "always") return { stickyTopVisibility: sticky };
  return undefined; // true / undefined -> default HOC (visibility "always")
}
//@@viewOff:helpers

/**
 * Rám stránky: horní lišta + obsah + patička.
 *
 * Lišta se nastavuje **vždy přes `top`**, ne vlastní komponentou -- `Top` sám exportovaný
 * není. `TopProvider` je nad lištou i obsahem, takže obsah může přes `useTop()` reagovat
 * na to, jestli lišta dosedla.
 */
const Page = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Page",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    top: PropTypes.oneOfType([PropTypes.object, PropTypes.node, PropTypes.bool]),
    sticky: PropTypes.oneOfType([PropTypes.bool, PropTypes.oneOf(["always", "onScrollUp"])]),
    footer: PropTypes.oneOfType([PropTypes.node, PropTypes.bool]),
    maxWidth: PropTypes.unit,
    padding: PropTypes.oneOfType([PropTypes.unit, PropTypes.bool]),
    fullHeight: PropTypes.bool,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    top: undefined,
    sticky: true,
    footer: undefined,
    maxWidth: undefined,
    padding: true,
    fullHeight: true,
  },
  //@@viewOff:defaultProps

  render(props) {
    const { top, sticky, footer, maxWidth, padding, fullHeight, children } = props;

    const spacing = Uu5Elements.useSpacing();
    const [screenSize] = useScreenSize();
    const isMobile = screenSize === "xs";

    // padding: true -> výchozí odsazení appky, false/0 -> žádné (web si ho řeší v sekcích),
    // číslo -> vlastní.
    const usedPadding = padding === true ? (isMobile ? spacing.d : 40) : padding || 0;
    const usedPaddingBlock = padding === true ? (isMobile ? spacing.d : spacing.d + 8) : padding || 0;

    //@@viewOn:render
    const topJsx =
      top && typeof top === "object" && !top.type ? <Top {...getStickyProps(sticky)} {...top} /> : top || null;

    // getAttrs, ne {...restProps}: createVisualComponent dosype vlastní props (nestingLevel,
    // testId, elementRef, noPrint...) a na <div> nepatří -- React na nich hlásí
    // "React does not recognize the ... prop on a DOM element".
    const attrs = Utils.VisualComponent.getAttrs(
      props,
      Config.Css.css({
        minBlockSize: fullHeight ? "100vh" : undefined,
        display: "flex",
        flexDirection: "column",
      }),
    );

    return (
      <TopProvider>
        <div {...attrs}>
          {topJsx}
          <main
            className={Config.Css.css({
              flex: "1 0 auto",
              inlineSize: "100%",
              maxWidth,
              marginInline: maxWidth ? "auto" : undefined,
              paddingInline: usedPadding,
              paddingBlock: usedPaddingBlock,
            })}
          >
            {children}
          </main>
          {footer || null}
        </div>
      </TopProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Page, TOP_HEIGHT };
export default Page;
//@@viewOff:exports
