//@@viewOn:imports
import { createVisualComponent, Lsi, useState } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config";
import { PageProvider, usePage } from "./page-context";
import CreatePageButton from "./create-page-button";
import OcAuth from "../caio-ui-auth";
import Section from "./section";
//@@viewOff:imports

function moveItem(arr, item, direction) {
  const index = arr.indexOf(item);
  if (direction === "up" && index > 0) {
    // Swap with the previous item
    [arr[index], arr[index - 1]] = [arr[index - 1], arr[index]];
  } else if (direction === "down" && index < arr.length - 1) {
    // Swap with the next item
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
  }
  return arr;
}

const PageView = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "PageView",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { name, onCreate } = props;
    const { data, state, handlerMap } = usePage();
    const { identity } = OcAuth.useSession();

    const [edit, setEdit] = useState(false);

    let actionList;

    if (identity?.profileList?.includes("operatives")) {
      actionList = [{ children: "Upravit", onClick: () => setEdit((e) => !e) }];
    }

    //@@viewOn:render
    return (
      <Uu5Elements.Block headerType="heading" header={<Lsi lsi={name} />} actionList={actionList}>
        {state === "pendingNoData" ? (
          Array.from({ length: 5 }, (_, i) => <Uu5Elements.Skeleton key={i} borderRadius="moderate" height={160} />)
        ) : state === "readyNoData" ? (
          <CreatePageButton name={name} onCreate={onCreate} colorScheme="primary" significance="highlighted" />
        ) : (
          <Uu5Elements.Grid rowGap={40}>
            {data.sectionList.map((section, i) => {
              return (
                <Section
                  key={section.data?.id ?? i}
                  editMode={edit ? {} : null}
                  dto={section}
                  onCreateBefore={() => handlerMap.createSectionBefore({ sectionId: section.data.id })}
                  onCreateAfter={() => handlerMap.createSectionAfter({ sectionId: section.data.id })}
                  onMoveUp={() => {
                    const sectionList = moveItem(
                      data.sectionList.map(({ id }) => id),
                      section.data.id,
                      "up",
                    );
                    handlerMap.updateSectionOrder({ sectionList });
                  }}
                  onMoveDown={() => {
                    const sectionList = moveItem(
                      data.sectionList.map(({ id }) => id),
                      section.data.id,
                      "down",
                    );
                    handlerMap.updateSectionOrder({ sectionList });
                  }}
                  onDelete={() => handlerMap.deleteSection({ sectionId: section.data.id })}
                />
              );
            })}
          </Uu5Elements.Grid>
        )}
      </Uu5Elements.Block>
    );
    //@@viewOff:render
  },
});

const Page = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Page",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { id, name, onCreate } = props;

    //@@viewOn:render
    return (
      <PageProvider id={id}>
        <PageView name={name} onCreate={onCreate} />
      </PageProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Page };
export default Page;
//@@viewOff:exports
