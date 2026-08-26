//@@viewOn:imports
import { createVisualComponent, Utils } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import Uu5Imaging from "uu5imagingg01";
import Config from "./config/config";
//@@viewOff:imports

const FormFile = Uu5Forms.withFormItem(
  createVisualComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + "FormFile",
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {},
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {},
    //@@viewOff:defaultProps

    render(props) {
      const { value, accept, ...linkProps } = props;
      //@@viewOn:render
      if (typeof value === "string") {
        return (
          <Uu5Forms.Link
            {...linkProps}
            value={value}
            iconRightList={[
              {
                icon: "uugds-close",
                onClick: (e) => props.onChange(new Utils.Event({ value: null }, e)),
              },
            ]}
          />
        );
      } else if (accept && accept.startsWith("image") && accept.indexOf(",") === -1) {
        return <Uu5Imaging.ImageInput {...linkProps} value={value} />;
      } else {
        return <Uu5Forms.File {...props} />;
      }
      //@@viewOff:render
    },
  }),
);

//@@viewOn:exports
export { FormFile };
export default FormFile;
//@@viewOff:exports
