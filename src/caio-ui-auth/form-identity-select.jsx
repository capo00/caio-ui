import { createVisualComponent, useLayoutEffect } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import OcElements from "../caio-ui-elements";
import Config from "./config/config";
import IdentityItem from "./identity-item";

const FormIdentitySelect = createVisualComponent({
  uu5Tag: Config.TAG + "FormIdentitySelect",

  render(props) {
    const { initialValue } = props;

    const formApi = Uu5Forms.useFormApi();

    useLayoutEffect(() => {
      if (formApi.itemMap[props.name]?.value?.find((v) => typeof v === "string")) {
        formApi.setItemValue(props.name, formApi.itemMap[props.name].value.map((item) => ({
          value: item,
          children: <IdentityItem identity={item} size="xs" />,
        })));
      }
    }, [formApi.itemMap[props.name]]);

    let correctInitialValue;
    if (Array.isArray(initialValue)) {
      correctInitialValue = initialValue.map((item) => ({
        value: item,
        children: <IdentityItem identity={item} size="xs" />,
      }));
    }

    const onSearch = async (e) => {
      const value = e.data.value;
      if (!value || value.length < 1) {
        return undefined;
      }

      try {
        const result = await OcElements.Call.cmdGet("identity/search", { query: value });
        const list = (result.itemList || []).map((item) => ({
          value: item.identity,
          children: <IdentityItem identity={item.identity} name={item.name} photo={item.photo} size="s" />,
        }));
        return list;
      } catch (e) {
        console.error("Identity search failed", e);
        return [];
      }
    };

    return (
      <Uu5Forms.FormTextSelectAsync
        {...props}
        initialValue={correctInitialValue}
        onSearch={onSearch}
      />
    );
  },
});

export { FormIdentitySelect };
export default FormIdentitySelect;
