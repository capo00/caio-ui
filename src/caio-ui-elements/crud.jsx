//@@viewOn:imports
import { createVisualComponent, createComponent, useCallback, useState, useLsi, Lsi, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Uu5TilesElements from "uu5tilesg02-elements";
// `uu5codekitg01-forms`, ne `uu5codekitg01`: formulářové vstupy editoru se odštěpily do
// vlastního balíčku, který jede na řadě 3.x (dnes 3.4.1), zatímco základní `uu5codekitg01`
// stojí na 2.8.3. Editor uvnitř je Monaco, ne Ace -- proto tu není `theme`.
import Uu5CodeKit from "uu5codekitg01-forms";
import { withServerlessTable, ListBlock } from "../uu5tilesg02-extension";
import importLsi from "../lsi/import-lsi";
import Config from "./config/config";

//@@viewOff:imports

const LSI_PATH = ["elements", "crud"];
function getSortFn(sort, code) {
  let fn;
  switch (typeof sort) {
    case "function":
      fn = (a, b) => (a.data ? sort(a.data[code], b.data[code], a, b) : 0);
      break;
    default:
      fn = (a, b) => {
        let result;
        if (!a.data) {
          result = 0;
        } else {
          if (sort === -1) [b, a] = [a, b];

          const aValue = a.data[code];
          const bValue = b.data[code];

          if (typeof aValue === "string" && typeof bValue === "string") {
            result = aValue.localeCompare(bValue);
          } else {
            result = aValue < bValue ? -1 : 1;
          }
        }

        return result;
      };
  }

  return fn;
}

function generate(cfg) {
  const seriesList = [];
  const columnList = [];
  const sorterList = [];
  const filterList = [];

  for (let code in cfg) {
    const { label, output, columnProps, sort, filterProps, visible } = cfg[code];

    if (output !== false) {
      seriesList.push({
        value: code,
        label,
        dataItem: output ? (item) => output(item.data.data[code], item.data) : undefined,
        visible,
      });
    }

    if (columnProps || sort) {
      const { horizontalAlignment, ...restColumnProps } = columnProps ?? {};
      columnList.push({
        value: code,
        ...(sort || horizontalAlignment
          ? {
            headerComponent: (
              <Uu5TilesElements.Table.HeaderCell
                horizontalAlignment={horizontalAlignment}
                sorterKey={sort ? code : undefined}
              />
            ),
          }
          : null),
        ...(horizontalAlignment
          ? {
            cellComponent: <Uu5TilesElements.Table.Cell horizontalAlignment={horizontalAlignment} />,
          }
          : null),
        ...restColumnProps,
      });
    }

    if (sort) {
      sorterList.push({
        key: code,
        label,
        sort: getSortFn(sort, code),
      });
    }

    if (filterProps) {
      filterList.push({
        key: code,
        label,
        ...filterProps,
        filter: (item, value) => {
          if (value === undefined || !item.data) return true;
          return filterProps.filter(item.data[code], value, item);
        },
      });
    }
  }

  return { seriesList, columnList, sorterList, filterList };
}

function normalizeInitValue(data) {
  return data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v ?? undefined])) : undefined;
}

function ModalFooter({ onClose }) {
  const count = onClose ? 2 : 1;

  return (
    <Uu5Elements.Grid
      templateColumns={{ xs: `repeat(${count}, 1fr)`, s: `repeat(${count}, auto)` }}
      columnGap={Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", "c"])}
      justifyContent={{ s: "end" }}
    >
      {onClose && <Uu5Forms.CancelButton onClick={onClose} />}
      <Uu5Forms.SubmitButton icon="uugds-check" />
    </Uu5Elements.Grid>
  );
}

const FormModal = createComponent({
  render(props) {
    const { onSubmit, onClose, open, initialValue, children, ...modalProps } = props;

    return (
      <Uu5Forms.Form.Provider key={open} onSubmit={onSubmit} initialValue={initialValue}>
        <Uu5Elements.Modal onClose={onClose} open={open} footer={<ModalFooter onClose={onClose} />} {...modalProps}>
          {children}
        </Uu5Elements.Modal>
      </Uu5Forms.Form.Provider>
    );
  },
});

const ServerlessTable = withServerlessTable(ListBlock);

const Crud = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Crud",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const {
      dataList,
      columnList,
      seriesList,
      sorterDefinitionList,
      initialSorterList,
      filterDefinitionList,
      initialFilterList,
      children,
      onPreSubmit,
      readOnly,
      hideColumns,
      tile,
      compact,
      actionList: propsActionList,
      getItemActionList: propsGetItemActionList,
      ...blockProps
    } = props;

    const [editData, setEditData] = useState();
    const [manyData, setManyData] = useState();
    const [removeData, setRemoveData] = useState();
    const [displayData, setDisplayData] = useState();

    // Tooltips and menu labels are plain strings on the uu5 action API, so these are read as
    // values rather than rendered as <Lsi> elements. Everything that lands in JSX below keeps
    // using <Lsi import={importLsi} path={...} /> instead.
    const moreLsi = useLsi(importLsi, [...LSI_PATH, "more"]);
    const deleteLsi = useLsi(importLsi, [...LSI_PATH, "delete"]);
    const updateLsi = useLsi(importLsi, [...LSI_PATH, "update"]);

    const { state, data, handlerMap, pageSize, dtoIn } = dataList;

    const onLoad = useCallback(
      ({ indexFrom, count }) => {
        let pageFrom = Math.floor(indexFrom / pageSize);
        let pageTo = Math.floor((indexFrom + count - 1) / pageSize);
        for (let i = pageFrom; i <= pageTo; i++) {
          handlerMap.loadNext({ pageInfo: { pageIndex: i } });
        }
      },
      [handlerMap.loadNext],
    );

    const disabled = state === "itemPending";
    const getActionList = useCallback(
      ({ data }) => {
        const items = [
          {
            icon: "uugdsstencil-it-json",
            children: <Lsi import={importLsi} path={[...LSI_PATH, "displayData"]} />,
            onClick: () => setDisplayData(data.data),
          },
          {
            icon: "uugds-copy",
            children: <Lsi import={importLsi} path={[...LSI_PATH, "copyId"]} />,
            onClick: () => Utils.Clipboard.write(data.data.id),
          },
        ];

        let actionList = [
          {
            icon: "uugds-dots-vertical",
            tooltip: moreLsi,
            itemList: items,
            iconOpen: null,
            iconClosed: null,
          },
        ];

        // Update and delete are each their own visible action by default (compact tucks
        // both into the "..." menu instead) -- delete used to always live inside the menu,
        // which hid it an extra click deep and, combined with icons not rendering, made it
        // easy to miss it was there at all.
        const deleteItem = {
          icon: "uugds-delete",
          tooltip: deleteLsi,
          colorScheme: "negative",
          disabled: data.state === "pending",
          onClick: () =>
            setRemoveData({
              callback: () => data.handlerMap.delete({ id: data.data.id }),
              header: <Lsi import={importLsi} path={[...LSI_PATH, "deleteItemHeader"]} />,
              // Two keys rather than one with an optional name: a translator cannot reasonably
              // be asked to make a single sentence read well both with and without the quoted
              // name spliced into it.
              info: data.data.name ? (
                <Lsi
                  import={importLsi}
                  path={[...LSI_PATH, "deleteNamedItemInfo"]}
                  params={{ name: data.data.name }}
                />
              ) : (
                <Lsi import={importLsi} path={[...LSI_PATH, "deleteItemInfo"]} />
              ),
            }),
        };

        if (compact) {
          deleteItem.children = <Lsi import={importLsi} path={[...LSI_PATH, "delete"]} />;
          items.push(deleteItem);
        } else {
          actionList.unshift(deleteItem);
        }

        // App-specific row actions (upload photos into this gallery, write the result of
        // this match). They go into the "..." menu rather than next to update/delete: the
        // row is narrow, and an app that adds two of them would otherwise push delete off
        // the edge. The callback gets the same argument as uu5tiles hands us, so it can
        // read `data.data` and call `data.handlerMap`.
        if (propsGetItemActionList) {
          const extra = propsGetItemActionList({ data }) ?? [];
          items.push(...extra);
        }

        if (children) {
          const updateItem = {
            icon: "uugds-pencil",
            tooltip: updateLsi,
            disabled: data.state === "pending",
            onClick: () => setEditData({ callback: data.handlerMap.update, data: data.data }),
          };

          if (compact) {
            updateItem.children = <Lsi import={importLsi} path={[...LSI_PATH, "update"]} />;
            items.unshift(updateItem);
          } else {
            actionList.unshift(updateItem);
          }
        }

        return actionList;
      },
      // The three lsi values are in here so switching the language re-creates the actions --
      // they are captured in the closure, so without them the tooltips would keep the text
      // that was current when the callback was last created.
      [disabled, compact, children, moreLsi, deleteLsi, updateLsi, propsGetItemActionList],
    );

    let actionList;
    if (children && !readOnly) {
      actionList = [
        {
          children: <Lsi import={importLsi} path={[...LSI_PATH, "create"]} />,
          icon: "uugds-plus",
          [handlerMap.createMany ? "onLabelClick" : "onClick"]: () => setEditData({ callback: handlerMap.create }),
          colorScheme: "primary",
          significance: "common",
          itemList: handlerMap.createMany ? [
            {
              children: <Lsi import={importLsi} path={[...LSI_PATH, "createMany"]} />,
              icon: "uugds-plus",
              onClick: () => setManyData({ callback: handlerMap.createMany }),
            },
          ] : undefined,
        },
        ...(propsActionList ?? []),
      ];
    } else if (propsActionList) {
      actionList = propsActionList;
    }

    //@@viewOn:render
    return (
      <>
        <ServerlessTable
          loading={state === "pendingNoData"}
          data={data}
          serieList={
            hideColumns
              ? seriesList.map((series) =>
                hideColumns.includes(series.value) ? { ...series, visible: false } : series,
              )
              : seriesList
          }
          filterDefinitionList={filterDefinitionList}
          initialFilterList={initialFilterList}
          sorterDefinitionList={sorterDefinitionList}
          initialSorterList={initialSorterList}
          selectable={readOnly || !handlerMap.deleteMany ? undefined : "multiple"}
          displaySeriesButton={!readOnly}
          {...blockProps}
          actionList={actionList}
          initialFilterBarExpanded={!!initialFilterList?.length}
          columnList={columnList}
          getItemActionList={readOnly ? undefined : getActionList}
          onLoad={onLoad}
          getBulkActionList={
            readOnly || !handlerMap.deleteMany
              ? undefined
              : (selectedData) => [
                {
                  icon: "uugds-delete",
                  children: <Lsi import={importLsi} path={[...LSI_PATH, "delete"]} />,
                  colorScheme: "negative",
                  onClick: (e) => {
                    setRemoveData({
                      // useDataList's generic list-level transform only knows how to fold a
                      // *single* item's result into the local list (by matching its id) -- a
                      // bulk deleteMany({ idList }) call doesn't fit that shape, so nothing gets
                      // removed locally on its own the way a single delete() does. Reloading
                      // afterward (with the same dtoIn/filters that were last in effect) is the
                      // straightforward fix.
                      callback: async () => {
                        await handlerMap.deleteMany({ idList: selectedData.map(({ data }) => data.id) });
                        await handlerMap.load(dtoIn);
                      },
                      header: <Lsi import={importLsi} path={[...LSI_PATH, "deleteItemsHeader"]} />,
                      info: <Lsi import={importLsi} path={[...LSI_PATH, "deleteItemsInfo"]} />,
                    });
                  },
                },
              ]
          }
        >
          {tile}
        </ServerlessTable>

        {children && !!editData && (
          <FormModal
            header={<Lsi import={importLsi} path={[...LSI_PATH, editData?.data ? "updateHeader" : "create"]} />}
            open={!!editData}
            onClose={() => setEditData()}
            onSubmit={async (e) => {
              if (onPreSubmit) await onPreSubmit(e);
              const { sys, ...submitData } = e.data.value;
              let newData = submitData;
              if (editData?.data) {
                newData = {};
                for (let k in submitData) {
                  if (submitData[k] !== editData.data[k]) newData[k] = submitData[k] ?? null;
                }
              }
              if (Object.keys(newData).length > 0) await editData.callback(newData);
              setEditData();
            }}
            initialValue={normalizeInitValue(editData?.data)}
          >
            {typeof children === "function" ? children({ type: editData?.data ? "update" : "create", data: editData?.data }) : children}
          </FormModal>
        )}

        {manyData && (
          <FormModal
            header={<Lsi import={importLsi} path={[...LSI_PATH, "createManyHeader"]} />}
            open={!!manyData}
            onClose={() => setManyData()}
            onSubmit={async (e) => {
              const { itemList } = e.data.value;
              if (itemList != null) await manyData.callback({ itemList: JSON.parse(itemList) });
              setManyData();
            }}
          >
            <Uu5Forms.Form.View>
              {/* `format="pretty"` ani `theme` se nepředává: formátování si Json.Input
                  nastavuje sám a barevné schéma jede z GDS podkladu (Monaco), ne z názvu
                  Ace tématu. */}
              <Uu5CodeKit.FormJson name="itemList" displayGutter={false} required />
            </Uu5Forms.Form.View>
          </FormModal>
        )}

        {displayData && (
          <Uu5Elements.Modal
            header={<Lsi import={importLsi} path={[...LSI_PATH, "dataHeader"]} />}
            open={!!displayData}
            onClose={() => setDisplayData()}
          >
            <Uu5CodeKit.Json.Input value={displayData} displayGutter={false} readOnly />
          </Uu5Elements.Modal>
        )}

        <Uu5Elements.Dialog
          open={!!removeData}
          onClose={() => setRemoveData()}
          icon={<Uu5Elements.Svg code="uugdssvg-svg-delete" />}
          header={removeData?.header}
          info={removeData?.info}
          actionDirection="horizontal"
          actionList={[
            {
              children: <Lsi import={importLsi} path={[...LSI_PATH, "cancel"]} />,
              onClick: () => setRemoveData(),
              significance: "distinct",
            },
            {
              children: <Lsi import={importLsi} path={[...LSI_PATH, "delete"]} />,
              onClick: (e) => {
                removeData.callback();
                setRemoveData();
              },
              colorScheme: "negative",
              significance: "highlighted",
            },
          ]}
        />
      </>
    );
    //@@viewOff:render
  },
});

Crud.generate = generate;

Crud.generateInputs = (cfg, { operation, orderList } = {}) => {
  const list = Object.entries(cfg);
  if (orderList) list.sort((a, b) => orderList.indexOf(a[0]) - orderList.indexOf(b[0]));
  
  return list.map(([name, { input, label }]) => {
    if (input) {
      const { Component, props } = input;
      return (
        <Component
          key={name}
          name={name}
          label={label}
          {...(typeof props === "function" ? props({ operation }) : props)}
        />
      );
    }
  });
}

//@@viewOn:exports
export { Crud };
export default Crud;
//@@viewOff:exports
