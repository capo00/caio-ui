//@@viewOn:imports
import { createComponent, useDataList, useDataObject, useUpdateEffect, useMemo, Utils, useEffect } from "uu5g05";
import Config from "./config/config";
import OcElements from "../caio-ui-elements";
//@@viewOff:imports

const [PageContext, usePage] = Utils.Context.create();
const ENTITY = "eccPage";

const PageProvider = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "PageProvider",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { id, children } = props;

    const dto = useDataObject({
      skipInitialLoad: !id,
      handlerMap: {
        load: () => OcElements.Call.cmdGet(ENTITY + "/load", { id }),
        create: (dtoIn) => OcElements.Call.cmdPost(ENTITY + "/create", dtoIn),
        updateSectionOrder: (sectionIdList) =>
          OcElements.Call.cmdPost(ENTITY + "/updateSectionOrder", { id: dto.data.id, sectionList: sectionIdList }),
        createSectionBefore: ({ sectionId }) =>
          OcElements.Call.cmdPost(ENTITY + "/createSectionBefore", { id: dto.data.id, sectionId }),
        createSectionAfter: ({ sectionId }) =>
          OcElements.Call.cmdPost(ENTITY + "/createSectionAfter", { id: dto.data.id, sectionId }),
        deleteSection: ({ sectionId }) =>
          OcElements.Call.cmdPost(ENTITY + "/deleteSection", { id: dto.data.id, sectionId }),
      },
    });

    const dataList = useDataList({
      skipInitialLoad: true,
      itemHandlerMap: {
        lock: (dtoIn) => OcElements.Call.cmdPost("eccSection/lock", dtoIn),
        unlock: (dtoIn) => OcElements.Call.cmdPost("eccSection/unlock", dtoIn),
      },
    });

    useUpdateEffect(() => {
      if (id && (!dto.data || id !== dto.data.id)) dto.handlerMap.load();
    }, [id]);

    useEffect(() => {
      if (dto.data?.sectionList) {
        dataList.handlerMap.setData(dto.data.sectionList);
      }
    }, [dto.data?.sectionList]);

    const value = useMemo(() => {
      return {
        ...dto,
        data: dto.data
          ? {
              ...dto.data,
              sectionList: [...dataList.newData, ...(dataList.data ?? [])],
            }
          : dto.data,
      };
    }, [dto, dataList]);

    //@@viewOn:render
    return (
      <PageContext.Provider value={value}>
        {typeof children === "function" ? children(value) : children}
      </PageContext.Provider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { PageProvider, usePage };
export default PageContext;
//@@viewOff:exports
