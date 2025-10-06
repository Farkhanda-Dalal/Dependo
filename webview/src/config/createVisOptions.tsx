import type { Options } from "vis-network";
import type { EnhancedGraphData } from "../../../src/types/enhancedgraphdata.interface";

/**
 * Creates the options object for the vis-network graph.
 * @param isHorizontal A boolean to determine the layout direction.
 * @param filteredGraphData The filtered graph data, used to determine group physics.
 * @returns The vis-network Options object.
 */
export const createVisOptions = (
  filteredGraphData: EnhancedGraphData
): Options => {
  const uniqueGroups = new Set<string>();
  filteredGraphData.nodes.forEach((node) => {
    const pathParts = node.id.split('/');
    const group = pathParts.length > 1 ? pathParts[0] : 'root';
    uniqueGroups.add(group);
  });

  const groupPhysicsConfig: { [key: string]: { physics: boolean } } = {};
  uniqueGroups.forEach((g: string) => {
    groupPhysicsConfig[g] = { physics: true };
  });

  // Base options shared by both layouts, preserving all your detailed settings
  const baseOptions: Options = {
    nodes: {
      shape: 'box',
      font: {
        color: '#374151',
        face: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        size: 14,
      },
      color: {
        background: '#f8fafc',
        border: '#0066cc',
        highlight: { background: '#dbeafe', border: '#2563eb' },
        hover: { background: '#eff6ff', border: '#3b82f6' },
      },
      margin: { top: 12, right: 16, bottom: 12, left: 16 },
      borderWidth: 2,
      borderWidthSelected: 3,
      shadow: {
        enabled: true,
        color: 'rgba(37, 99, 235, 0.15)',
        size: 8,
        x: 0,
        y: 2,
      },
    },
    edges: {
      color: {
        color: '#60a5fa',
        highlight: '#2563eb',
        hover: '#3b82f6',
        inherit: false,
      },
      width: 2,
      widthConstraint: { maximum: 4 },
      font: {
        align: 'middle',
        size: 12,
        color: '#1e40af',
        background: '#ffffff',
        strokeWidth: 3,
        strokeColor: '#ffffff',
      },
      arrows: { to: { enabled: true, scaleFactor: 1.2, type: 'arrow' } },
      smooth: { enabled: true, type: 'dynamic', roundness: 0.5 },
      shadow: {
        enabled: true,
        color: 'rgba(59, 130, 246, 0.1)',
        size: 4,
        x: 0,
        y: 1,
      },
    },
    interaction: {
      hover: true,
      tooltipDelay: 200,
      hideEdgesOnDrag: false,
      hideNodesOnDrag: false,
      dragView: true,
      zoomView: true,
    },
    groups: groupPhysicsConfig,
    configure: { enabled: false },
  };


    // Options for your original, organic layout
    return {
      ...baseOptions,
      layout: {
        improvedLayout: true,
      },
      physics: {
        enabled: true,
        barnesHut: {
          gravitationalConstant: -25000,
          centralGravity: 0.2,
          springLength: 100,
          springConstant: 0.05,
          damping: 0.15,
          avoidOverlap: 1,
        },
        minVelocity: 0.75,
        solver: 'barnesHut',
      },
    };
  }
