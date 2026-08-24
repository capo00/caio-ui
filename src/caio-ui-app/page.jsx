//@@viewOn:imports
import { createVisualComponent, useScreenSize } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config";
import Top from "./top";
//@@viewOff:imports

const Page = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Page",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render({ children, topColorScheme, ...topProps }) {
    const spacing = Uu5Elements.useSpacing();

    const [screenSize] = useScreenSize();
    const isMobile = screenSize === "xs";

    //@@viewOn:render
    return (
      <Top {...topProps} colorScheme={topColorScheme}>
        {({ topHeight = 0 } = {}) => (
          <main
            className={isMobile ? Config.Css.css({
              padding: spacing.d,
            }) : Config.Css.css({
              paddingInline: 40,
              paddingBlock: spacing.d + 8,
              minHeight: `calc(100vh - ${topHeight}px)`,
              display: "flex",
              flexDirection: "column",
            })}
          >
            {children}
          </main>
        )}
      </Top >
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Page };
export default Page;
//@@viewOff:exports
