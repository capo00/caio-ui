//@@viewOn:imports
import { createVisualComponent, createComponent, useCallback, useState, Lsi, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Uu5TilesElements from "uu5tilesg02-elements";
import Uu5CodeKit from "uu5codekitg01";
import { withServerlessTable, ListBlock } from "../uu5tilesg02-extension";
import Config from "./config/config";

//@@viewOff:imports
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
      ...blockProps
    } = props;

    const [editData, setEditData] = useState();
    const [manyData, setManyData] = useState();
    const [removeData, setRemoveData] = useState();
    const [displayData, setDisplayData] = useState();

    const { state, data, handlerMap, pageSize } = dataList;

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
            children: <Lsi lsi={{ cs: "Zobrazit data" }} />,
            onClick: () => setDisplayData(data.data),
          },
          {
            icon: "uugds-copy",
            children: <Lsi lsi={{ cs: "Zkopírovat ID" }} />,
            onClick: () => Utils.Clipboard.write(data.data.id),
          },
        ];

        let actionList = [
          {
            icon: "uugds-dots-vertical",
            tooltip: { cs: "Více" },
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
          tooltip: { cs: "Smazat" },
          colorScheme: "negative",
          disabled: data.state === "pending",
          onClick: () =>
            setRemoveData({
              callback: () => data.handlerMap.delete({ id: data.data.id }),
              header: <Lsi lsi={{ cs: "Smazat položku?" }} />,
              info: (
                <Lsi
                  lsi={{
                    cs: `Opravdu chcete smazat položku${data.data.name ? ` "${data.data.name}"` : ""}?`,
                  }}
                />
              ),
            }),
        };

        if (compact) {
          deleteItem.children = <Lsi lsi={{ cs: "Smazat" }} />;
          items.push(deleteItem);
        } else {
          actionList.unshift(deleteItem);
        }

        if (children) {
          const updateItem = {
            icon: "uugds-pencil",
            tooltip: { cs: "Upravit" },
            disabled: data.state === "pending",
            onClick: () => setEditData({ callback: data.handlerMap.update, data: data.data }),
          };

          if (compact) {
            updateItem.children = <Lsi lsi={{ cs: "Upravit" }} />;
            items.unshift(updateItem);
          } else {
            actionList.unshift(updateItem);
          }
        }

        return actionList;
      },
      [disabled],
    );

    let actionList;
    if (children && !readOnly) {
      actionList = [
        {
          children: <Lsi lsi={{ cs: "Vytvořit" }} />,
          icon: "uugds-plus",
          [handlerMap.createMany ? "onLabelClick" : "onClick"]: () => setEditData({ callback: handlerMap.create }),
          colorScheme: "primary",
          significance: "common",
          itemList: handlerMap.createMany ? [
            {
              children: <Lsi lsi={{ cs: "Hromadně" }} />,
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
          selectable={readOnly ? undefined : "multiple"}
          displaySeriesButton={!readOnly}
          {...blockProps}
          actionList={actionList}
          initialFilterBarExpanded={!!initialFilterList?.length}
          columnList={columnList}
          getItemActionList={readOnly ? undefined : getActionList}
          onLoad={onLoad}
          getBulkActionList={
            readOnly
              ? undefined
              : (selectedData) => [
                {
                  icon: "uugds-delete",
                  children: "Delete",
                  colorScheme: "negative",
                  onClick: (e) => {
                    setRemoveData({
                      callback: () => handlerMap.deleteMany({ idList: selectedData.map(({ data }) => data.id) }),
                      header: <Lsi lsi={{ cs: "Smazat položky?" }} />,
                      info: (
                        <Lsi
                          lsi={{
                            cs: `Opravdu chcete smazat položky?`,
                          }}
                        />
                      ),
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
            header={<Lsi lsi={{ cs: editData?.data ? "Upravit" : "Vytvořit" }} />}
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
            header={<Lsi lsi={{ cs: "Vytvořit hromadně" }} />}
            open={!!manyData}
            onClose={() => setManyData()}
            onSubmit={async (e) => {
              const { itemList } = e.data.value;
              if (itemList != null) await manyData.callback({ itemList: JSON.parse(itemList) });
              setManyData();
            }}
          >
            <Uu5Forms.Form.View>
              <Uu5CodeKit.FormJson
                name="itemList"
                format="pretty"
                displayGutter={false}
                required
                theme="tomorrow_night"
              />
            </Uu5Forms.Form.View>
          </FormModal>
        )}

        {displayData && (
          <Uu5Elements.Modal
            header={<Lsi lsi={{ cs: "Data" }} />}
            open={!!displayData}
            onClose={() => setDisplayData()}
          >
            <Uu5CodeKit.Json.Input
              value={displayData}
              format="pretty"
              displayGutter={false}
              readOnly
              theme="tomorrow_night"
            />
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
              children: <Lsi lsi={{ cs: "Zrušit" }} />,
              onClick: () => setRemoveData(),
              significance: "distinct",
            },
            {
              children: <Lsi lsi={{ cs: "Smazat" }} />,
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
