import type { EnhancedGraphData } from "../../../src/types/enhancedgraphdata.interface";

/**
 * Handles the search functionality to filter graph nodes and links based on a query.
 * @param query The search string.
 * @param allGraphData The complete, unfiltered graph data.
 * @param setFilteredGraphData The state setter for the filtered graph data.
 */
export const performSearch = (
  query: string,
  allGraphData: EnhancedGraphData,
  setFilteredGraphData: (data: EnhancedGraphData) => void
) => {
  const lowerCaseQuery = query.toLowerCase();
  if (lowerCaseQuery === "") {
    setFilteredGraphData(allGraphData);
  } else {
    const matchingNodes = allGraphData.nodes.filter((node) =>
      node.id.toLowerCase().includes(lowerCaseQuery)
    );
    const matchingNodeIds = new Set(matchingNodes.map((node) => node.id));

    const filteredLinks = allGraphData.links.filter(
      (link) =>
        matchingNodeIds.has(link.source) || matchingNodeIds.has(link.target)
    );

    const allRelatedNodeIds = new Set<string>();
    filteredLinks.forEach((link) => {
      allRelatedNodeIds.add(link.source);
      allRelatedNodeIds.add(link.target);
    });

    // Ensure that the originally matched nodes are also included, even if they have no links
    matchingNodeIds.forEach(id => allRelatedNodeIds.add(id));

    const filteredNodes = allGraphData.nodes.filter((node) =>
      allRelatedNodeIds.has(node.id)
    );

    setFilteredGraphData({
      ...allGraphData,
      nodes: filteredNodes,
      links: filteredLinks,
    });
  }
};
