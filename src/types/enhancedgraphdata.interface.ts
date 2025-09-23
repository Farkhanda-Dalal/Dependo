import type{ Cycle } from "./cycle.interface";
import type{ GraphData } from "./graphdata.interface";

export interface EnhancedGraphData extends GraphData {
  cycles: Cycle[];
}