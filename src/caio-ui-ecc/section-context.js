//@@viewOn:imports
import { createComponent, useDataList, useMemo, Utils } from "uu5g05";
import Config from "./config/config.js";
import OcElements from "../caio-ui-elements";
//@@viewOff:imports

const [SectionContext, useSection] = Utils.Context.create();
const ENTITY = "eccSection";

const SectionProvider = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SectionProvider",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { children, initialData, pageId } = props;

    const dataList = useDataList({
      initialData,
      handlerMap: {
        load: (dtoIn) => OcElements.Call.cmdGet(ENTITY + "/list", dtoIn),
        createBefore: ({ id }) => OcElements.Call.cmdGet("eccPage/createSectionBefore", { id: pageId, sectionId: id }),
        createAfter: ({ id }) => OcElements.Call.cmdGet("eccPage/createSectionAfter", { id: pageId, sectionId: id }),
      },
      itemHandlerMap: {
        lock: (dtoIn) => OcElements.Call.cmdGet(ENTITY + "/lock", dtoIn),
        unlock: (dtoIn) => OcElements.Call.cmdGet(ENTITY + "/unlock", dtoIn),
      },
    });

    const value = useMemo(() => {
      return {
        ...dataList,
        data: [...dataList.newData, ...(dataList.data ?? [])],
      };
    }, [dataList]);

    //@@viewOn:render
    return (
      <SectionContext.Provider value={value}>
        {typeof children === "function" ? children(value) : children}
      </SectionContext.Provider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { SectionProvider, useSection };
export default SectionContext;
//@@viewOff:exports
