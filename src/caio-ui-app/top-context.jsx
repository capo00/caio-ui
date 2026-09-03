//@@viewOn:imports
import { createComponent, useMemo, useState, Utils } from "uu5g05";
import Config from "./config/config";
//@@viewOff:imports

//@@viewOn:constants
const INITIAL = { stuck: false, height: 0 };
//@@viewOff:constants

// Stejný vzor jako caio-ui-ecc/page-context.jsx -- Utils.Context.create vrací [Context, useContext].
const [TopContext, useTopContext] = Utils.Context.create(INITIAL, Config.TAG + "TopContext");

/**
 * Drží stav horní lišty (`stuck`, `height`) a dává ho k dispozici i obsahu stránky,
 * který je vedle lišty, ne v ní.
 *
 * Proč context a ne render-prop: `Top` je sourozenec `<main>`, takže svůj stav nemá jak
 * předat dolů. Provider je proto v `Page` nad oběma a `Top` do něj stav jen zapisuje.
 */
const TopProvider = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TopProvider",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render({ children }) {
    const [state, setState] = useState(INITIAL);

    // setState je stabilní, takže se `value` mění jen při skutečné změně stavu lišty.
    const value = useMemo(() => ({ ...state, _setState: setState }), [state]);

    return <TopContext.Provider value={value}>{children}</TopContext.Provider>;
  },
});

/**
 * Stav horní lišty pro appku: `{ stuck, height }`.
 *
 * `stuck` je true, když lišta při scrollování dosedla na horní hranu -- appka podle toho
 * může měnit vzhled čehokoli, nejen samotné lišty (na tu stačí funkční tvar propsů,
 * viz `Top`).
 */
function useTop() {
  const { stuck, height } = useTopContext();
  return { stuck, height };
}

/** Interní: `Top` si tímhle hlásí svůj stav nahoru do provideru. */
function _useTopStateWriter() {
  return useTopContext()._setState;
}

//@@viewOn:exports
export { TopProvider, TopContext, useTop, _useTopStateWriter };
export default TopProvider;
//@@viewOff:exports
