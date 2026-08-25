//@@viewOn:imports
import {
  createVisualComponent,
  AppBackgroundProvider,
  RouteProvider,
  LanguageListProvider,
  LanguageProvider,
} from "uu5g05";
import OcAuth from "../caio-ui-auth";
import Config from "./config/config";
//@@viewOff:imports

//@@viewOn:constants
// Which languages the app offers -- what Uu5Elements.LanguageSelector lists and what
// LSI objects are read for. An app that is not Czech-only passes its own.
const DEFAULT_LANGUAGE_LIST = ["cs"];
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const SpaProvider = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SpaProvider",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render({ children, cmdPrefix, languageList = DEFAULT_LANGUAGE_LIST }) {
    //@@viewOn:private
    //@@viewOff:private

    //@@viewOn:render
    return (
      <AppBackgroundProvider>
        <LanguageListProvider languageList={languageList}>
          <LanguageProvider>
            <OcAuth.SessionProvider cmdPrefix={cmdPrefix}>
              <RouteProvider>{children}</RouteProvider>
            </OcAuth.SessionProvider>
          </LanguageProvider>
        </LanguageListProvider>
      </AppBackgroundProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { SpaProvider };
export default SpaProvider;
//@@viewOff:exports
