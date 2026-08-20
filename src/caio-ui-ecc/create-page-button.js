//@@viewOn:imports
import { createVisualComponent, Lsi, useRef, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import { usePage } from "./page-context";
//@@viewOff:imports

const CreatePageButton = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "CreatePageButton",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { name, onCreate, ...restProps } = props;
    const page = usePage();

    const ref = useRef();

    if (page.state === "pending") {
      restProps.disabled = true;
      restProps.width = ref.current.getBoundingClientRect().width;
    }

    //@@viewOn:render
    return (
      <Uu5Elements.Button
        {...restProps}
        elementRef={ref}
        onClick={async () => {
          const pageObject = await page.handlerMap.create({ name: name.cs });
          onCreate?.(new Utils.Event(pageObject));
        }}
      >
        <Lsi lsi={{ cs: "Vytvořit stránku" }} />
      </Uu5Elements.Button>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { CreatePageButton };
export default CreatePageButton;
//@@viewOff:exports
