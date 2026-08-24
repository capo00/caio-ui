//@@viewOn:imports
import { createComponent } from "uu5g05";
import Config from "./config/config";
import OcAuth from "../caio-ui-auth";

//@@viewOff:imports

function withRoute(Component, { profileList } = {}) {
  return createComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + "withRoute",
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {},
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {},
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:render
      const session = OcAuth.useSession();

      let result;
      if (!Array.isArray(profileList)) {
        result = <Component {...props} />;
      } else {
        switch (session.state) {
          case "pending":
            result = null;
            break;
          case "notAuthenticated":
            result = <OcAuth.Unauthenticated className={Config.Css.css({ marginBlockStart: 64 })} />;
            break;
          case "authenticated":
            if (profileList.some((profile) => session.identity.profileList?.includes(profile))) {
              result = <Component {...props} />;
            } else {
              result = <OcAuth.Unauthorized className={Config.Css.css({ marginBlockStart: 64 })} />;
            }
            break;
        }
      }

      return result;
      //@@viewOff:render
    },
  });
}

//@@viewOn:exports
export { withRoute };
export default withRoute;
//@@viewOff:exports
