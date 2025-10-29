import { useEffect } from 'react';
import type { Network } from 'vis-network/standalone';
import type { Cycle } from '../../../src/types/cycle.interface';

/**
 * Custom hook to fit the network view to cycles when activated.
 */
export const useCycleFitting = (
  networkRef: React.RefObject<Network | null>,
  showCycles: boolean,
  cycles: Cycle[]
) => {
  useEffect(() => {
    const network = networkRef.current;
    if (!network) return;

    if (showCycles && cycles.length > 0) {
      const cycleNodeIds = [...new Set(cycles.flatMap((cycle) => cycle.nodes))];
      if (cycleNodeIds.length > 0) {
        network.fit({ nodes: cycleNodeIds, animation: true });
      }
    }
  }, [networkRef, showCycles, cycles]);
};

