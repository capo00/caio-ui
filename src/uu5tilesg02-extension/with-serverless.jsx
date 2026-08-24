import { createComponent, PropTypes, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5TilesElements from "uu5tilesg02-elements";

function getType(v) {
  if (typeof v === "number") {
    return "number";
  } else if (/^http\S+$/.test(v)) {
    return "link";
  } else if (/^\d{4}(-\d{2}){2}T\d{2}(:\d{2}){2}.\d{3}(Z|[+-]\d{2}:\d{2})$/.test(v)) {
    return "date-time";
  } else if (/^\d{4}(-\d{2}){2}$/.test(v)) {
    return "date";
  }
}

function getValue(item, key) {
  return item.data && typeof item.data === "object" ? item.data[key] : item[key];
}

function withServerlessTable(Comp) {
  const comp = createComponent({
    uu5Tag: `withServerlessTable(${Comp.uu5Tag})`,

    propTypes: {
      loading: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
    },

    render({ data, loading, serieList, sorterDefinitionList, filterDefinitionList, columnList, ...props }) {
      if (loading) {
        data = Array.from({ length: typeof loading === "number" ? loading : 5 }, () => ({}));

        const dataItem = () => <Uu5Elements.Skeleton borderRadius="moderate" />;

        if (serieList) {
          serieList = serieList.map((item) => ({ ...item, dataItem }));
        } else {
          serieList = Array.from({ length: 5 }, (_, i) => ({ value: "a" + i, dataItem }));
        }

        if (columnList) {
          columnList = columnList.map((item) => ({ ...item, header: dataItem }));
        } else {
          columnList = serieList.map(({ value }) => ({ value, header: dataItem }));
        }
      } else if (!serieList) {
        const headerMap = {};
        data?.forEach((item) =>
          Object.keys(item).forEach((k) => {
            const headerItem = (headerMap[k] ||= {});
            const v = item[k];
            if (v != null) {
              const type = getType(v);
              if (headerItem.type) {
                if (headerItem.type !== type) headerItem.type = null;
              } else if (headerItem.type === undefined) headerItem.type = type;

              headerItem.values ||= new Set();
              headerItem.values.add(v);
            }
          }),
        );

        const headerList = Object.keys(headerMap);

        serieList = headerList.map((value) => ({
          value,
          label: value,
          dataItem: (item) => {
            let v = getValue(item, value);

            if (v == null) {
              // because of header width to be wider then 1 char
              v = <span style={{ visibility: "hidden" }}>{value}</span>;
            } else {
              switch (headerMap[value].type) {
                case "number":
                  v = <Uu5Elements.Number value={v} roundingPosition={-2} />;
                  break;
                case "link":
                  v = <Uu5Elements.Link href={v}>{v}</Uu5Elements.Link>;
                  break;
                case "date-time":
                  v = <Uu5Elements.DateTime value={v} timeFormat="long" />;
                  break;
                case "date":
                  v = <Uu5Elements.DateTime value={v} timeFormat="none" />;
                  break;
              }
            }

            return v;
          },
        }));

        filterDefinitionList = headerList
          .map((key) => {
            const type = headerMap[key].type;

            return headerMap[key].values.size <= 1
              ? null
              : {
                  key,
                  label: key,
                  filter: (item, value) => {
                    if (value === undefined) return true;
                    const itemValue = getValue(item, key);

                    if (!type) {
                      return value.indexOf(itemValue) > -1;
                    } else if (typeof value === "string") {
                      if (typeof itemValue === "string") {
                        return itemValue.toLowerCase().includes(value.toLowerCase());
                      }
                    } else if (Array.isArray(value)) {
                      // range
                      let [start, end] = value;
                      if (type === "date-time") end += "T23:59:59.999Z";
                      return itemValue >= start && itemValue <= end;
                    }

                    return itemValue == value;
                  },
                  ...(type === "number"
                    ? { inputType: "number" }
                    : type?.startsWith("date")
                      ? { inputType: "date-range" }
                      : {
                          inputType: "text-select",
                          inputProps: {
                            itemList: [...headerMap[key].values].map((value) => ({ value })),
                            multiple: true,
                          },
                        }),
                };
          })
          .filter(Boolean);

        sorterDefinitionList = headerList.map((key) => ({
          key,
          sort(a, b) {
            const aValue = getValue(a, key);
            const bValue = getValue(b, key);

            let result;
            if (aValue == null) {
              result = -1;
            } else if (bValue == null) {
              result = 1;
            } else if (typeof aValue === "string" && typeof bValue === "string") {
              result = aValue.localeCompare(bValue);
            } else {
              result = aValue < bValue ? -1 : 1;
            }

            return result;
          },
        }));

        columnList = headerList.map((value) => ({
          value,
          headerComponent: (
            <Uu5TilesElements.Table.HeaderCell
              sorterKey={value}
              horizontalAlignment={headerMap[value].type === "number" ? "right" : undefined}
            />
          ),
          cellComponent:
            headerMap[value].type === "number" ? (
              <Uu5TilesElements.Table.Cell horizontalAlignment="right" />
            ) : undefined,
          minWidth: "min-content",
          maxWidth: "auto",
        }));
      }

      return (
        <Comp
          {...props}
          key={loading}
          data={data}
          serieList={serieList}
          filterDefinitionList={filterDefinitionList}
          sorterDefinitionList={sorterDefinitionList}
          columnList={columnList}
        />
      );
    },
  });

  Utils.Component.mergeStatics(comp, Comp);

  return comp;
}

export { withServerlessTable };
export default withServerlessTable;
