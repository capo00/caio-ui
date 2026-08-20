//@@viewOn:imports
import { createVisualComponent, Utils } from "uu5g05";
import Config from "./config/config.js";
//@@viewOff:imports

const Image = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Image",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:render
    const {
      elementAttrs,
      componentProps: { nestingLevel, ...componentProps },
    } = Utils.VisualComponent.splitProps(props);
    return <img referrerPolicy="no-referrer" {...componentProps} {...elementAttrs} />;
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Image };
export default Image;
//@@viewOff:exports
