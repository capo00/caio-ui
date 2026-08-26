//@@viewOn:imports
import { createVisualComponent, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Uu5ImagingTools from "uu5imagingg01-tools";
import Config from "./config/config";
import Crud from "./crud";
import Image from "./image";
import FormFile from "./form-file";
import { BinaryProvider } from "./binary-context";
//@@viewOff:imports

//@@viewOn:helpers
function Bytes({ value, roundingPosition = -1 }) {
  const UNITS = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte", "petabyte"];
  let unit, finalValue;

  if (!+value) {
    unit = UNITS[0];
    finalValue = 0;
  } else {
    const k = 1024;
    const i = Math.floor(Math.log(value) / Math.log(k));
    unit = UNITS[i];
    finalValue = value / Math.pow(k, i);
  }

  return <Uu5Elements.Number value={finalValue} unit={unit} roundingPosition={roundingPosition} />;
}

const CONFIG = {
  file: {
    label: { cs: "Soubor", en: "File" },
    output: (value, item) => {
      if (!item.data.uri) return undefined;
      return item.data.mimeType?.startsWith("image") ? (
        <Image src={item.data.uri} alt={item.data.name} height={32} />
      ) : (
        <Uu5Elements.Link href={item.data.uri} download={item.data.name} />
      );
    },
    columnProps: { maxWidth: "m" },
    input: {
      Component: FormFile,
      props: ({ operation }) => ({ required: operation === "create" }),
    },
  },
  name: {
    label: { cs: "Název", en: "Name" },
    sort: true,
    input: { Component: Uu5Forms.FormText },
  },
  size: {
    label: { cs: "Velikost", en: "Size" },
    output: (value) => <Bytes value={value} />,
    columnProps: { maxWidth: "m", horizontalAlignment: "right" },
    sort: true,
  },
  mts: {
    label: { cs: "Datum", en: "Date" },
    output: (value, item) => <Uu5Elements.DateTime value={item.data.sys.mts} />,
    sort: (_, __, a, b) => a.data.sys.mts.localeCompare(b.data.sys.mts),
  },
  mimeType: {
    label: { cs: "Typ", en: "Type" },
  },
};

const { seriesList, columnList, sorterList, filterList } = Crud.generate(CONFIG);
//@@viewOff:helpers

/**
 * A ready-made admin table over caio-server's BinaryStore (docs/binary.md, R7). An app that
 * needs its own extra fields (e.g. tags) is expected to compose its own Crud config with
 * Crud.generate() the same way this one does, rather than configuring this component for it.
 */
const BinaryCrud = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "BinaryCrud",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:render
    return (
      <BinaryProvider>
        {(dataList) => (
          <Crud
            header={<Lsi lsi={{ cs: "Soubory", en: "Files" }} />}
            {...props}
            dataList={dataList}
            seriesList={seriesList}
            columnList={columnList}
            sorterDefinitionList={sorterList}
            filterDefinitionList={filterList}
            onPreSubmit={async (e) => {
              const origFile = e.data.value.file;
              if (origFile instanceof File && origFile.type?.startsWith("image")) {
                const { imageFile } = await Uu5ImagingTools.Adjustment.resizeMax(origFile, 2048);
                const { imageFile: webpFile } = await Uu5ImagingTools.Adjustment.changeType(imageFile, "webp", 0.75);
                e.data.value.file = new File([webpFile], webpFile.name, {
                  type: webpFile.type,
                  lastModified: origFile.lastModified,
                });
              }
            }}
          >
            {({ type }) => (
              <Uu5Forms.Form.View gridLayout={{ xs: "name, file", s: "name file" }}>
                {Crud.generateInputs(CONFIG, { operation: type })}
              </Uu5Forms.Form.View>
            )}
          </Crud>
        )}
      </BinaryProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { BinaryCrud };
export default BinaryCrud;
//@@viewOff:exports
