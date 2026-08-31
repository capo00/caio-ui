//@@viewOn:imports
import { createVisualComponent, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Uu5ImagingTools from "uu5imagingg01-tools";
import importLsi from "../lsi/import-lsi";
import Config from "./config/config";
import Crud from "./crud";
import Image from "./image";
import FormFile from "./form-file";
import { BinaryProvider } from "./binary-context";
//@@viewOff:imports

const LSI_PATH = ["elements", "binaryCrud"];

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
    label: { import: importLsi, path: [...LSI_PATH, "file"] },
    // The file name and extension come from the server: caio-server stores every object with a
    // Content-Disposition carrying its name, so the browser saves it correctly even though the
    // uri is a bare UUID on a cross-origin host. The `download` attribute cannot do that job --
    // per the fetch/HTML spec it is a same-origin-only hint, and storage.googleapis.com ignores
    // it -- it is kept only for the case where a uri ever becomes same-origin.
    output: (value, item) => {
      if (!item.data.uri) return undefined;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
          {item.data.mimeType?.startsWith("image") && (
            <Image src={item.data.uri} alt={item.data.name} height={32} />
          )}
          <Uu5Elements.Link href={item.data.uri} download={item.data.name} target="_blank">
            <Lsi import={importLsi} path={[...LSI_PATH, "download"]} />
          </Uu5Elements.Link>
        </div>
      );
    },
    columnProps: { maxWidth: "m" },
    input: {
      Component: FormFile,
      props: ({ operation }) => ({ required: operation === "create" }),
    },
  },
  name: {
    label: { import: importLsi, path: [...LSI_PATH, "name"] },
    sort: true,
    input: { Component: Uu5Forms.FormText },
  },
  size: {
    label: { import: importLsi, path: [...LSI_PATH, "size"] },
    output: (value) => <Bytes value={value} />,
    columnProps: { maxWidth: "m", horizontalAlignment: "right" },
    sort: true,
  },
  mts: {
    label: { import: importLsi, path: [...LSI_PATH, "date"] },
    output: (value, item) => <Uu5Elements.DateTime value={item.data.sys.mts} />,
    sort: (_, __, a, b) => a.data.sys.mts.localeCompare(b.data.sys.mts),
  },
  mimeType: {
    label: { import: importLsi, path: [...LSI_PATH, "type"] },
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
