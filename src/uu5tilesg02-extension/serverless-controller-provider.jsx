import { useState } from "uu5g05";
import Uu5Tiles from "uu5tilesg02";

function ServerlessControllerProvider(props) {
  const {
    serieList: seriesDefinitionList,
    filterDefinitionList,
    initialFilterList,
    sorterDefinitionList,
    initialSorterList,
    ...restProps
  } = props;

  const [serieList, setSerieList] = useState(seriesDefinitionList);
  const [filterList, setFilterList] = useState(initialFilterList);
  const [sorterList, setSorterList] = useState(initialSorterList);

  return (
    <Uu5Tiles.ControllerProvider
      {...restProps}
      serieList={serieList}
      onSerieChange={(e) => setSerieList(e.data.serieList)}
      filterDefinitionList={filterDefinitionList}
      filterList={filterList}
      onFilterChange={(e) => setFilterList(e.data.filterList)}
      sorterDefinitionList={sorterDefinitionList}
      sorterList={sorterList}
      onSorterChange={(e) => setSorterList(e.data.sorterList)}
    />
  );
}

export { ServerlessControllerProvider };
export default ServerlessControllerProvider;
