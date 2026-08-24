//@@viewOn:imports
import { createVisualComponent, Utils, useStickyTop, useRoute, useLsi, useState, useScreenSize, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import OcAuth from "../caio-ui-auth";
import Config from "./config/config";
import anonymousUri from "./assets/anonymous.png";
//@@viewOff:imports

function updateHref({ href, params, itemList, ...item }, setRoute) {
  if (itemList) item.itemList = itemList.map((it) => updateHref(it, setRoute));
  if (href) {
    const key = itemList ? "onLabelClick" : "onClick";
    item[key] = () => setRoute(href, params);
  }
  return item;
}

function Photo({ screenSize }) {
  const session = OcAuth.useSession();
  const title = useLsi({ cs: "Přihlášený uživatel" });
  const isSmall = screenSize === "xs";

  const [uri, setUri] = useState(session.identity.photo);

  return (
    <img
      alt="User"
      src={uri}
      height="90%"
      className={Config.Css.css({
        marginInlineStart: isSmall ? -24 : -8,
        marginInlineEnd: isSmall ? -24 : -4,
        borderRadius: "50%",
      })}
      title={title}
      onError={() => setUri(anonymousUri)}
      referrerPolicy="no-referrer"
    />
  );
}

function getLoginButton(session, screenSize, item) {
  let onClick,
    itemList,
    children,
    icon = "uugds-account";

  if (session.state === "notAuthenticated") onClick = () => session.login();
  else if (session.state === "authenticated") {
    icon = null;
    children = <Photo screenSize={screenSize} />;
    itemList = item?.itemList
      ? item.itemList
        .map(({ profile, ...it }) => (session.identity?.profileList?.includes(profile) ? it : null))
        .filter(Boolean)
      : [];
    itemList.unshift({ icon: "uugds-account", children: session.identity.identity });
    itemList.push({
      icon: "uugds-log-out",
      children: <Lsi lsi={{ cs: "Odhlásit" }} />,
      onClick: () => session.logout(),
    });
  }

  return { icon, onClick, itemList, children, iconOpen: null, iconClosed: null };
}

const Top = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Top",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    colorScheme: "building",
  },
  //@@viewOff:defaultProps

  render(props) {
    const { logoUri, logoHref, logoTarget, logoTooltip, menuList, colorScheme, header, ...restProps } = props;
    let { children } = restProps;

    const [, setRoute] = useRoute();
    const [screenSize] = useScreenSize();

    const { ref, style, visibilityMatches, metrics } = useStickyTop("onScrollUp", true);

    const spacing = Uu5Elements.useSpacing();

    const [hidden, setHidden] = useState(false);

    let img, logoStyles, coverStyles;
    if (logoUri) {
      const logoHeight = screenSize === "xs" ? 80 : 128;
      let buttonXlHeight = Uu5Elements.UuGds.SizingPalette.getValue(["spot", "basic", "xl"]).h;
      if (screenSize === "xs") buttonXlHeight /= 2;

      logoStyles = {
        position: "absolute",
        top: 0,
        height: logoHeight,
        cursor: logoHref ? "pointer" : undefined,
        transition: "height 300ms ease, left 300ms ease",
      };

      coverStyles = {
        position: "relative",
        margin: "0 auto",
        paddingLeft: logoStyles.height - (screenSize === "xs" ? 16 : 24),
        transition: "padding 300ms ease",
      };

      if (metrics?.offsetToStickyBoundary < 0) {
        logoStyles.height = buttonXlHeight;
        logoStyles.left = (logoHeight - logoStyles.height) / 2;

        if (visibilityMatches) {
          // small
          logoStyles.height = buttonXlHeight + 16;
          logoStyles.left = (logoHeight - logoStyles.height) / 2;
        } else {
          // hidden
        }
      } else {
        // big
        coverStyles.paddingTop = buttonXlHeight;
        logoStyles.left = 0;
      }

      img = logoUri && (
        <img
          alt={logoTooltip}
          src={logoUri}
          className={Config.Css.css(logoStyles)}
          title={logoTooltip}
        />
      );

      if (logoHref) {
        img = <Uu5Elements.Link href={logoHref} target={logoTarget}>{img}</Uu5Elements.Link>;
      }
    }

    // adding loginButton, because ButtonGroup does not support { component: LoginButton }
    const session = OcAuth.useSession();

    let itemList = [];
    if (menuList) {
      const identityItemIndex = menuList.findIndex((item) => item.key === "identity");
      const updatedMenuList = [...menuList];

      if (identityItemIndex > -1) {
        updatedMenuList[identityItemIndex] = getLoginButton(session, screenSize, menuList[identityItemIndex]);
      } else {
        updatedMenuList.push(getLoginButton(session, screenSize));
      }

      itemList = updatedMenuList.map((item) =>
        updateHref(item, (...args) => {
          setRoute(...args);
        }),
      );
      // if (screenSize === "xs") {
      //   const identityItem = itemList.splice(identityItemIndex > -1 ? identityItemIndex : itemList.length - 1, 1)[0];
      //   const hiddenIdentity = identityItem.itemList;
      //   delete identityItem.itemList;

      //   itemList = [
      //     { icon: "uugds-menu", itemList: itemList.map(({ collapsedChildren, ...item }) => ({ ...item, children: item.children ?? collapsedChildren })) },
      //     { ...identityItem, itemList: hiddenIdentity, iconOpen: null, iconClosed: null },
      //   ];
      // }
    }

    if (screenSize === "l" || screenSize === "xl") {
      // TODO necessary for TV device
      itemList.unshift({ icon: "uugds-chevron-up", onClick: () => setHidden(true) });
    }

    children = typeof children === "function" ? children({ topHeight: hidden ? 0 : metrics.height }) : children;

    // if (screenSize === "xs") {
    //   children = (
    //     <Uu5Elements.Drawer
    //       open={!!menu}
    //       onClose={() => setMenu(null)}
    //       content={menu ? <Uu5Elements.MenuList itemBorderRadius="moderate" itemList={menu} /> : null}
    //       position="right"
    //     >
    //       {children}
    //     </Uu5Elements.Drawer>
    //   );
    // }

    //@@viewOn:render
    const { elementProps } = Utils.VisualComponent.splitProps(
      restProps,
      Config.Css.css({
        ...style,
        paddingInline: spacing.d,
        ...(screenSize === "xs"
          ? {
            // because of Drawer (Menu) does not have a className and must be for whole height
            // in case small content the menu is small
            // TODO 72 calculate from ref of the top in layout effect
            "& + div": {
              minHeight: "calc(100vh - 72px)",
            },
          }
          : null),
      }),
    );

    return (
      <>
        {!hidden && (
          <Uu5Elements.Box
            {...elementProps}
            shape="background"
            colorScheme={colorScheme}
            significance="highlighted"
            elementRef={Utils.Component.combineRefs(elementProps.elementRef, ref)}
          >
            {logoUri ? (
              <div className={Config.Css.css(coverStyles)}>
                {img}
                {itemList && <Uu5Elements.ActionGroup itemList={itemList} size="xl" />}
              </div>
            ) : (
              <div className={header ? Config.Css.css({ display: "flex", alignItems: "center", gap: 16 }) : undefined}>
                {header}
                {itemList && <Uu5Elements.ActionGroup itemList={itemList} size="xl" />}
              </div>
            )}
          </Uu5Elements.Box>
        )}
        {children}
      </>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Top };
export default Top;
//@@viewOff:exports
