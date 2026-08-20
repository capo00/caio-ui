//@@viewOn:imports
import { createVisualComponent, ErrorBoundary } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import SpaError from "./spa-error";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const Spa = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Spa",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render({ children }) {
    //@@viewOn:private
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <ErrorBoundary fallback={SpaError}>
        <Uu5Elements.ModalBus>
          <Uu5Elements.AlertBus>{children}</Uu5Elements.AlertBus>
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
