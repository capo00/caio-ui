import { useMemo } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Tiles from "uu5tilesg02";
import Uu5TilesElements from "uu5tilesg02-elements";
import Uu5TilesControls from "uu5tilesg02-controls";
import ServerlessControllerProvider from "./serverless-controller-provider";

function BulkActionBar({ getActionList }) {
  const { selectedData } = Uu5Tiles.useController();

  return <Uu5TilesControls.BulkActionBar actionList={getActionList(selectedData)} />;
}

function ListBlock({
  // Provider
  data,
  serieList,
  filterDefinitionList,
  initialFilterList,
  sorterDefinitionList,
  initialSorterList,
  selectable,

  viewType = "list",

  // List
  columnList,
  getItemActionList,
  onLoad,
  children,
  spacing,
  hideHeader,
  borderRadius = "moderate",
  cellHoverExtent,

  // FilterBar
  initialFilterBarExpanded,

  // BulkActionBar
  getBulkActionList,

  // Series
  displaySeriesButton = true,

  // Block
  actionList = [],
  headerType = "heading",

  ...blockProps
}) {
  const actionListDef = useMemo(
    () =>
      [
        { component: <Uu5TilesControls.SearchButton /> },
        { component: <Uu5TilesControls.FilterButton type="bar" disabled={!filterDefinitionList} /> },
        displaySeriesButton ? { component: <Uu5TilesControls.SerieButton disabled={!serieList?.[0]?.label} /> } : null,
        ...actionList,
      ].filter(Boolean),
    [actionList],
  );

  const ViewComp = viewType === "list" ? Uu5TilesElements.List : Uu5TilesElements.Table;

  return (
    <ServerlessControllerProvider
      data={data}
      serieList={serieList}
      filterDefinitionList={filterDefinitionList}
      initialFilterList={initialFilterList}
      sorterDefinitionList={sorterDefinitionList}
      initialSorterList={initialSorterList}
      selectable={selectable}
    >
      <Uu5Elements.Block actionList={actionListDef} headerType={headerType} {...blockProps}>
        <Uu5TilesControls.FilterBar initialExpanded={initialFilterBarExpanded} />
        <Uu5TilesControls.FilterManagerModal />
        <Uu5TilesControls.SerieManagerModal />
        {getBulkActionList && <BulkActionBar getActionList={getBulkActionList} />}

        <ViewComp
          columnList={columnList}
          tileMinWidth={400}
          tileMaxWidth={500}
          verticalAlignment="center"
          virtualization="table"
          borderRadius={borderRadius}
          getActionList={getItemActionList}
          onLoad={onLoad}
          spacing={spacing}
          hideHeader={hideHeader}
          cellHoverExtent={cellHoverExtent}
        >
          <Uu5TilesElements.Grid.DefaultTile />
        </ViewComp>
      </Uu5Elements.Block>
    </ServerlessControllerProvider>
  );
}

export { ListBlock };
export default ListBlock;
