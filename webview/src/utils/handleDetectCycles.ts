import type { EnhancedGraphData } from "../../../src/types/enhancedgraphdata.interface";

/**
 * Toggles the visibility of circular dependencies on the graph.
 * @param allGraphData The complete graph data.
 * @param showCycles The current state of the showCycles flag.
 * @param setShowCycles The state setter for the showCycles flag.
 */
export const handleDetectCycles = (
  allGraphData: EnhancedGraphData,
  showCycles: boolean,
  setShowCycles: (show: boolean) => void
) => {
  if (allGraphData.cycles.length === 0) {
    alert("No circular dependencies found in your project. Great!");
  } else {
    setShowCycles(!showCycles);
  }
};