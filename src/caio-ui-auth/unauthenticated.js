//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import { useSession } from "./session";
//@@viewOff:imports

const Unauthenticated = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Unauthenticated",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { login } = useSession();

    //@@viewOn:render
    return (
      <Uu5Elements.PlaceholderBox
        code="account"
        borderRadius="full"
        header="Nejdříve se přihlaste"
        {...props}
        nestingLevel={props.nestingLevel ?? "area"}
        actionList={[
          {
            children: "Přihlásit se",
            onClick: () => login(),
            colorScheme: "primary",
            significance: "highlighted",
          },
          {
            children: "Registrovat se",
            onClick: () => register(),
            colorScheme: "primary",
            significance: "subdued",
            disabled: true,
          },
        ]}
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Unauthenticated };
export default Unauthenticated;
//@@viewOff:exports
