import { type FC, useMemo } from "react";

import { Tree, type TreeProps } from "antd";

import {
  ListRubricTyped,
  type RubricInfoFragment as Single,
} from "@generated/graphql";
import LoadingFallback from "@lib/components/Layout/LoadingFallback";
import { useQuery } from "@providers";

import { buildRubricTree, type RubricDataNode } from "./utils";

type RubricTreeListProps = Pick<TreeProps, "selectedKeys"> & {
  rubricatorId: string;
  onSelect?: (rubric: Single | null) => void;
  onDropRubric?: (info: {
    dragRubric: Single;
    dropRubric: Single;
    dropToGap: boolean;
  }) => void;
};

const RubricDisplay: FC<{ data: RubricDataNode }> = ({
  data: { rubric, children = [] },
}) => {
  if (children.length === 0) return rubric.name;
  return `${rubric.name} (${children.length})`;
};

// Функция для проверки, является ли узел RubricDataNode
const isRubricDataNode = (node: any): node is RubricDataNode => {
  return node && typeof node === 'object' && 'rubric' in node && 'value' in node;
};

const RubricTreeList: FC<RubricTreeListProps> = ({
  rubricatorId,
  onSelect,
  onDropRubric,
  ...rest
}) => {
  const { data, loading } = useQuery(ListRubricTyped, {
    fetchPolicy: "network-only",
    nextFetchPolicy: "cache-and-network",
    variables: { id: rubricatorId },
  });

  // В buildRubricTree возвращаем RubricDataNode[]
  const treeData: RubricDataNode[] = useMemo(
    () => buildRubricTree(data?.listRubricByRubricator || []),
    [data],
  );

  const handleDrop: TreeProps["onDrop"] = (info) => {
    const dragNode = info.dragNode;
    const dropNode = info.node;
    
    if (isRubricDataNode(dragNode) && isRubricDataNode(dropNode) && onDropRubric) {
      onDropRubric({ 
        dragRubric: dragNode.rubric, 
        dropRubric: dropNode.rubric, 
        dropToGap: info.dropToGap 
      });
    }
  };

  if (loading) return <LoadingFallback />;

  return (
    <Tree
      {...rest}
      defaultExpandAll
      showLine
      selectable={!!onSelect}
      treeData={treeData}
      titleRender={(node) => <RubricDisplay data={node as RubricDataNode} />}
      onSelect={(_, { selectedNodes }) => {
        const selectedNode = selectedNodes[0];
        if (isRubricDataNode(selectedNode)) {
          onSelect?.(selectedNode.rubric);
        } else {
          onSelect?.(null);
        }
      }}
      draggable
      onDrop={handleDrop}
    />
  );
};

export default RubricTreeList;