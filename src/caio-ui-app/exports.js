export * from "./spa-provider";
export * from "./spa";
export * from "./page";
export * from "./with-route";
// Top se schválně neexportuje -- lišta se nastavuje přes `Page`/`Spa` prop `top`,
// ať je pro ni v celém stacku jedna cesta. useTop() je tu proto, aby na její stav
// (dosedla / nedosedla) mohl reagovat i obsah stránky.
export { useTop } from "./top-context";
