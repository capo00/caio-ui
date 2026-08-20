//@@viewOn:imports
import { createVisualComponent, useEffect, useState, Utils, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Uu5RichTextElements from "uu5richtextg01-elements";
import Uu5CodeKit from "uu5codekitg01";
import Config from "./config/config.js";

//@@viewOff:imports

function Editor({ value, onBlur, ...props }) {
  const [v, setV] = useState(value);

  useEffect(() => {
    setV(value);
  }, [value]);

  return (
    <Uu5RichTextElements.Editor
      {...props}
      value={v}
      onChange={(e) => setV(e.data.value)}
      onBlur={(e) => onBlur(new Utils.Event({ value: v }, e))}
    />
  );
}

function UpdateUu5StringModal({ value, onSubmit, onCancel }) {
  return (
    <Uu5Forms.Form.Provider onSubmit={(e) => onSubmit(new Utils.Event({ value: e.data.value.value }, e))}>
      <Uu5Elements.Modal
        open
        onClose={onCancel}
        header={<Lsi lsi={{ cs: "Upravit uu5String" }} />}
        footer={
          <Uu5Elements.Grid templateColumns="auto auto" justifyContent="end">
            <Uu5Forms.CancelButton onClick={onCancel} />
            <Uu5Forms.SubmitButton />
          </Uu5Elements.Grid>
        }
        width="full"
      >
        <Uu5Forms.Form.View>
          <Uu5CodeKit.FormUu5String name="value" initialValue={value} displayGutter={false} />
        </Uu5Forms.Form.View>
      </Uu5Elements.Modal>
    </Uu5Forms.Form.Provider>
  );
}

function RemoveSectionDialog({ onConfirm, onCancel }) {
  return (
    <Uu5Elements.Dialog
      open
      onClose={onCancel}
      header={<Lsi lsi={{ cs: "Smazat sekci?" }} />}
      icon={<Uu5Elements.Svg code="uugdssvg-svg-delete" />}
      info={<Lsi lsi={{ cs: "Data sekce nelze obnovit" }} />}
      actionDirection="horizontal"
      actionList={[
        {
          children: <Lsi lsi={{ cs: "Zrušit" }} />,
          onClick: onCancel,
        },
        {
          children: <Lsi lsi={{ cs: "Smazat" }} />,
          onClick: onConfirm,
          colorScheme: "negative",
          significance: "highlighted",
        },
      ]}
    />
  );
}

const SectionEditable = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SectionEditable",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { editMode, dto, onCreateBefore, onCreateAfter, onMoveUp, onMoveDown, onDelete, ...restProps } = props;

    const [edit, setEdit] = useState(false);
    const [updateModal, setUpdateModal] = useState();
    const [removeDialog, setRemoveDialog] = useState();

    async function save(e) {
      let uu5String = e.data.value ?? null;
      if (/^<uu5string\s*\\>/.test(uu5String ?? "")) {
        uu5String = Utils.Uu5String.toObject(uu5String);
      }
      await dto.handlerMap.unlock({ uu5String });
      setEdit(false);
    }

    let result;
    let borderStyle = "dashed";

    if (edit) {
      borderStyle = "solid";
      result = (
        <Editor
          autoFocus
          value={dto.data.uu5String ? "<uu5string/>" + Utils.Uu5String.toString(dto.data.uu5String) : undefined}
          onBlur={save}
          className={Config.Css.css({ margin: -10 })}
        />
      );
    } else if (dto.data?.uu5String) {
      result = Utils.Uu5String.toChildren(dto.data.uu5String);
    }

    const attrs = Utils.VisualComponent.getAttrs(
      restProps,
      Config.Css.css({
        margin: "-32px -16px -16px",
        padding: "0 15px 15px",
        border: `1px ${borderStyle} grey`,
        borderRadius: 8,

        // "&:hover > legend": {
        //   display: "block",
        // },
      }),
    );

    //@@viewOn:render
    return (
      <>
        <fieldset
          {...attrs}
          disabled={dto.state === "pending"}
          onClick={async () => {
            if (!edit) {
              await dto.handlerMap.lock();
              setEdit(true);
            }
          }}
        >
          <legend style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
            <Uu5Elements.ActionGroup
              itemList={[
                { icon: "uugds-insert-below", onClick: onCreateAfter },
                { icon: "uugds-insert-above", onClick: onCreateBefore },
                { icon: "uugds-up", onClick: onMoveUp },
                { icon: "uugds-down", onClick: onMoveDown },
                {
                  icon: "uugds-copy",
                  onClick: () => Utils.Clipboard.write({ uu5String: Utils.Uu5String.toString(dto.data.uu5String) }),
                },
                {
                  collapsed: true,
                  icon: "uugdsstencil-it-div",
                  children: <Lsi lsi={{ cs: "Upravit uu5String" }} />,
                  onClick: async () => {
                    await dto.handlerMap.lock();
                    setUpdateModal(true);
                  },
                },
                {
                  collapsed: true,
                  icon: "uugds-delete",
                  colorScheme: "negative",
                  children: <Lsi lsi={{ cs: "Smazat" }} />,
                  onClick: () => setRemoveDialog(true),
                },
              ]}
            />
          </legend>
          {result}
        </fieldset>
        {updateModal && (
          <UpdateUu5StringModal
            value={Utils.Uu5String.toString(dto.data.uu5String)}
            onSubmit={save}
            onCancel={() => setUpdateModal(false)}
          />
        )}
        {removeDialog && (
          <RemoveSectionDialog
            onConfirm={async (e) => {
              setRemoveDialog(false);
              onDelete();
            }}
            onCancel={() => setRemoveDialog(false)}
          />
        )}
      </>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { SectionEditable };
export default SectionEditable;
//@@viewOff:exports
