export interface Cycle {
  nodes: string[];
  links: { source: string; target: string; specifiers?: string[] }[];
}