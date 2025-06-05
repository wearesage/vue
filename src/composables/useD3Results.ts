import { computed } from "vue";

function transformGraphQLToD3Format(data: any) {
  console.log(data);
  const nodes = (data || []).map((func: any) => ({
    id: func.name,
    group: 1,
    __typename: func.__typename,
  }));
  const edges: unknown[] = [];

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].id.toLowerCase().includes("schema") && nodes[j].id.toLowerCase().includes("schema")) {
        edges.push({
          source: nodes[i].id,
          target: nodes[j].id,
          value: 1,
        });
      }

      if (nodes[i].id.toLowerCase().includes("codebase") && nodes[j].id.toLowerCase().includes("codebase")) {
        edges.push({
          source: nodes[i].id,
          target: nodes[j].id,
          value: 1,
        });
      }
    }
  }

  return { nodes, edges };
}

export function useD3Results(data: any) {
  const transformed = computed(() => transformGraphQLToD3Format(data.value));
  const nodes = computed(() => transformed.value.nodes);
  const edges = computed(() => transformed.value.edges);

  return {
    nodes,
    edges,
  };
}
