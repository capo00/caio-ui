//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
//@@viewOff:imports

const Unauthorized = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Unauthorized",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:render
    return (
      <Uu5Elements.PlaceholderBox
        code="permission"
        borderRadius="full"
        header="Nemáte oprávnění"
        info="Nemáte oprávnění k provedení dané operace."
        {...props}
        nestingLevel={props.nestingLevel ?? "area"}
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Unauthorized };
export default Unauthorized;
//@@viewOff:exports
