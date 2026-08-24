//@@viewOn:imports
import { createComponent, useDataList, useUpdateEffect, useMemo, Utils } from "uu5g05";
import Config from "./config/config";
import Call from "./call";
//@@viewOff:imports

function getCalls(entity) {
  return {
    list: (dtoIn) => Call.cmdGet(entity + "/list", dtoIn),
    createItem: (dtoIn) => Call.cmdPost(entity + "/create", dtoIn),
    createMany: (dtoIn) => Call.cmdPost(entity + "/createMany", dtoIn),
    updateItem: (dtoIn) => Call.cmdPost(entity + "/update", dtoIn),
    deleteItem: (dtoIn) => Call.cmdPost(entity + "/delete", dtoIn),
    deleteMany: (dtoIn) => Call.cmdPost(entity + "/deleteMany", dtoIn),
  };
}

const CrudContext = {
  create(entity) {
    const [CrudContext, useCrud] = Utils.Context.create();

    const CrudProvider = createComponent({
      //@@viewOn:statics
      uu5Tag: Config.TAG + "CrudProvider",
      //@@viewOff:statics

      //@@viewOn:propTypes
      propTypes: {},
      //@@viewOff:propTypes

      //@@viewOn:defaultProps
      defaultProps: {
        pageSize: 1000,
      },
      //@@viewOff:defaultProps

      render(props) {
        const { children, calls = getCalls(entity), pageSize, dtoIn, refreshKey } = props;

        const handlerMap = {
          load: calls.list,
          create: calls.createItem,
          deleteMany: calls.deleteMany,
        };

        if (calls.createMany) handlerMap.createMany = calls.createMany;

        const dataList = useDataList({
          initialDtoIn: dtoIn,
          pageSize,
          handlerMap,
          itemHandlerMap: {
            delete: calls.deleteItem,
            update: calls.updateItem,
          },
        }, [refreshKey]);

        useUpdateEffect(
          () => {
            dataList.handlerMap.load(dtoIn);
          },
          dtoIn ? Object.values(dtoIn) : [],
        );

        const value = useMemo(() => {
          return {
            ...dataList,
            data: [...dataList.newData, ...(dataList.data ?? [])],
            pageSize,
          };
        }, [dataList, pageSize]);

        //@@viewOn:render
        return (
          <CrudContext.Provider value={value}>
            {typeof children === "function" ? children(value) : children}
          </CrudContext.Provider>
        );
        //@@viewOff:render
      },
    });

    return [CrudProvider, useCrud];
  },
};

//@@viewOn:exports
export { CrudContext };
export default CrudContext;
//@@viewOff:exports
