import type { EnhancedGraphData } from "../../../src/types/enhancedgraphdata.interface";

/**
 * Handles the search functionality to filter graph nodes and links based on a query.
 * @param event The keyboard event from the search input.
 * @param allGraphData The complete, unfiltered graph data.
 * @param setFilteredGraphData The state setter for the filtered graph data.
 */
export const handleSearch = (
  event: React.KeyboardEvent<HTMLInputElement>,
  allGraphData: EnhancedGraphData,
  setFilteredGraphData: (data: EnhancedGraphData) => void
) => {
  if (event.key === "Enter") {
    const query = event.currentTarget.value.toLowerCase();
    if (query === "") {
      setFilteredGraphData(allGraphData);
    } else {
      const matchingNodes = allGraphData.nodes.filter((node) =>
        node.id.toLowerCase().includes(query)
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

      const filteredNodes = allGraphData.nodes.filter((node) =>
        allRelatedNodeIds.has(node.id)
      );

      setFilteredGraphData({
        ...allGraphData,
        nodes: filteredNodes,
        links: filteredLinks,
      });
    }
  }
};