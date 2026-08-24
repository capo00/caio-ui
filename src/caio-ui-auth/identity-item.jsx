import { createVisualComponent, useDataObject } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import OcElements from "../caio-ui-elements";
import Config from "./config/config";

const View = createVisualComponent({
  uu5Tag: Config.TAG + "IdentityItem.View",
  render(props) {
    const { identity, firstName, surname, name, photo, pending, subtitle, ...restProps } = props;
    const fullName = firstName && surname ? `${firstName} ${surname}` : name;

    let propsToPass = {
      title: fullName,
      subtitle: subtitle ?? identity,
      imageSrc: photo,
    };
    if (pending) {
      propsToPass = {
        title: <Uu5Elements.Skeleton height="1em" width="10em" borderRadius="moderate" />,
        subtitle: <Uu5Elements.Skeleton height="1em" width="10em" borderRadius="moderate" />,
        imageSrc: photo,
      };
    }
    return <Uu5Elements.InfoItem {...restProps} {...propsToPass} />;
  },
});

const ViewLoader = createVisualComponent({
  uu5Tag: Config.TAG + "IdentityItem.ViewLoader",
  render(props) {
    const { identity, ...restProps } = props;

    const dto = useDataObject({
      handlerMap: { load: () => OcElements.Call.cmdGet("identity/get", { identity }) },
    });

    return (
      <View
        {...restProps}
        identity={identity}
        firstName={dto.data?.firstName}
        surname={dto.data?.surname}
        name={dto.data?.name}
        photo={dto.data?.photo}
        pending={dto.state === "pendingNoData"}
      />
    );
  },
});

const IdentityItem = createVisualComponent({
  uu5Tag: Config.TAG + "IdentityItem",

  render(props) {
    const { identity, firstName, surname, name, photo, ...restProps } = props;
    return (firstName && surname) || name ? <View {...props} /> : <ViewLoader identity={identity} {...restProps} />;
  },
});

export { IdentityItem };
export default IdentityItem;
