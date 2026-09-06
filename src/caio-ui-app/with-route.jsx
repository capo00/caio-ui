//@@viewOn:imports
import { createComponent } from "uu5g05";
import Config from "./config/config";
import OcAuth from "../caio-ui-auth";

//@@viewOff:imports

/**
 * Route guard.
 *
 * `profileList` accepts **scoped** entries: `"teamEditor:*"` matches any profile with that
 * prefix and a non-empty scope (`teamEditor:6512ab34…`). A scoped role names the record it
 * applies to inside its own profile string -- `identity.profileList` is a flat list that
 * goes into the JWT unchanged -- so without the wildcard there is no way to say "anyone who
 * edits some team may open this screen". Which team it is stays the screen's business;
 * `UiAuth.getScopeList(identity, "teamEditor")` hands it the list.
 *
 * Entries without `:*` keep matching exactly.
 */
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
            if (OcAuth.hasProfile(session.identity, profileList)) {
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
