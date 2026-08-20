//@@viewOn:imports
import { Utils, createVisualComponent, PropTypes } from "uu5g05";
import Config from "./config/config.js";
//@@viewOff:imports

//@@viewOn:helpers
//@@viewOff:helpers

const SpaError = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SpaError",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    error: PropTypes.any,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    error: undefined,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { error } = props;
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props);
    return (
      <div {...attrs}>
        <h1>Unexpected error</h1>
        <pre>{JSON.stringify(error)}</pre>
      </div>
    );
    //@@viewOff:render
  },
});

export { SpaError };
export default SpaError;
