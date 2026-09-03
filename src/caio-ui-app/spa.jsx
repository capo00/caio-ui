//@@viewOn:imports
import { createVisualComponent, ErrorBoundary, PropTypes } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config";
import SpaError from "./spa-error";
import Page from "./page";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

/**
 * Obal celé appky: ErrorBoundary + busy komponenty uu5 + (volitelně) rám stránky.
 *
 * Když se předá `top` nebo `footer`, složí `Spa` i layout přes `Page` -- appka pak nemusí
 * mít vlastní komponentu na hlavičku a patičku. Bez nich se chová jako dřív a renderuje
 * jen `children`.
 */
const Spa = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Spa",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    top: Page.propTypes.top,
    footer: Page.propTypes.footer,
    // Zbytek props pro Page (maxWidth, padding, fullHeight, sticky).
    main: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
    errorFallback: PropTypes.elementType,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    top: undefined,
    footer: undefined,
    main: undefined,
    errorFallback: SpaError,
  },
  //@@viewOff:defaultProps

  render({ top, footer, main, errorFallback, children }) {
    //@@viewOn:private
    const hasLayout = (top || footer || main) && main !== false;
    //@@viewOff:private

    //@@viewOn:render
    const content = hasLayout ? (
      <Page top={top} footer={footer} {...(typeof main === "object" ? main : null)}>
        {children}
      </Page>
    ) : (
      children
    );

    return (
      <ErrorBoundary fallback={errorFallback}>
        <Uu5Elements.ModalBus>
          <Uu5Elements.AlertBus>{content}</Uu5Elements.AlertBus>
        </Uu5Elements.ModalBus>
      </ErrorBoundary>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Spa };
export default Spa;
//@@viewOff:exports
