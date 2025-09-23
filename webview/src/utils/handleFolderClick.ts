import type { EnhancedGraphData } from "../../../src/types/enhancedgraphdata.interface";

/**
 * Handles a click on a folder in the sidebar to filter the graph.
 * @param folderPath The path of the clicked folder.
 * @param allGraphData The complete graph data.
 * @param setFilteredGraphData The state setter for the filtered graph data.
 */
export const handleFolderClick = (
  folderPath: string,
  allGraphData: EnhancedGraphData,
  setFilteredGraphData: (data: EnhancedGraphData) => void
) => {
  const normalizedFolderPath = folderPath.replace(/\\/g, "/");
  const query = normalizedFolderPath === "root" ? "" : `${normalizedFolderPath}/`;

  if (query === "") {
    setFilteredGraphData(allGraphData);
  } else {
    const matchingNodes = allGraphData.nodes.filter((node) => {
      const nodeId = node.id.toLowerCase();
      const queryLower = query.toLowerCase();
      return nodeId.startsWith(queryLower);
    });

    if (matchingNodes.length === 0) {
      const flexibleMatchingNodes = allGraphData.nodes.filter((node) => {
        const nodeId = node.id.toLowerCase();
        const folderPathLower = normalizedFolderPath.toLowerCase();
        return nodeId.includes(folderPathLower);
      });

      if (flexibleMatchingNodes.length > 0) {
        const matchingNodeIds = new Set(flexibleMatchingNodes.map((node) => node.id));
        const filteredLinks = allGraphData.links.filter(
          (link) => matchingNodeIds.has(link.source) || matchingNodeIds.has(link.target)
        );

        const allRelatedNodeIds = new Set<string>();
        filteredLinks.forEach((link) => {
          allRelatedNodeIds.add(link.source);
          allRelatedNodeIds.add(link.target);
        });

        const filteredNodes = allGraphData.nodes.filter((node) => allRelatedNodeIds.has(node.id));

        setFilteredGraphData({
          ...allGraphData,
          nodes: filteredNodes,
          links: filteredLinks,
        });
      } else {
        setFilteredGraphData({ nodes: [], links: [], cycles: [] });
      }
      return;
    }

    const matchingNodeIds = new Set(matchingNodes.map((node) => node.id));
    const filteredLinks = allGraphData.links.filter(
      (link) => matchingNodeIds.has(link.source) || matchingNodeIds.has(link.target)
    );

    const allRelatedNodeIds = new Set<string>();
    filteredLinks.forEach((link) => {
      allRelatedNodeIds.add(link.source);
      allRelatedNodeIds.add(link.target);
    });

    const filteredNodes = allGraphData.nodes.filter((node) => allRelatedNodeIds.has(node.id));

    setFilteredGraphData({
      ...allGraphData,
      nodes: filteredNodes,
      links: filteredLinks,
    });
  }
};