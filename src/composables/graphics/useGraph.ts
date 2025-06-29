import { ref, shallowRef, watch, onMounted, onUnmounted, toRaw, type Ref } from "vue";
import type { SimulationNodeDatum, Simulation, ForceLink } from "d3-force";
import { forceSimulation, forceLink, forceManyBody, forceCenter } from "d3-force";
import { useViewport } from "../../stores/viewport";
import { useZoom } from "./useZoom";
import { useCanvas2d } from "./useCanvas2d";
import { clone } from "../../util";

interface NodeData {
  id: string;
  dataId?: string;
  labels?: string[];
  properties?: Record<string, any>;
  x?: number;
  y?: number;
}

interface EdgeData {
  id?: string;
  source: string;
  target: string;
  type?: string;
  properties?: Record<string, any>;
}

interface D3Node extends SimulationNodeDatum {
  id: string;
  x: number;
  y: number;
  fx?: number | null;
  fy?: number | null;
  label: string;
  nodeType: string;
  properties: Record<string, any>;
}

interface D3Link {
  source: string | D3Node;
  target: string | D3Node;
  type: string;
}

interface Viewport {
  artboard: {
    width: number;
    height: number;
    dpr: number;
  };
}

export function useGraph(canvas: Ref<HTMLCanvasElement | null>) {
  const viewport = useViewport();
  const nodes = ref<NodeData[]>([]);
  const edges = ref<EdgeData[]>([]);

  interface CircleProps {
    x: number;
    y: number;
    radius: number;
    fillStyle?: string;
    strokeStyle?: string;
    lineWidth?: number;
    strokeWidth?: number;
  }

  const isDragging = ref<boolean>(false);
  const simulation = shallowRef<GraphSimulation | null>(null);
  const draggedNode = ref<D3Node | null>(null);

  // First get the transform and zoom behavior from useZoom with a simple filter
  // We'll update the filter behavior after we have access to mouse position
  const { transform, updateFilter } = useZoom(canvas, ref({}), (event) => {
    // Initially just filter based on isDragging
    return isDragging.value;
  });

  // Now get the canvas utilities including mouse position
  const { draw, clear, normalize, circle, mouse } = useCanvas2d(canvas, viewport.artboard, transform);

  // Helper function to find a node under the mouse cursor
  function findNodeUnderMouse(nodes: D3Node[], mousePos: [number, number]): D3Node | null {
    // The node radius used for hit detection
    const nodeRadius = 20;

    // Check each node to see if the mouse is over it
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const dx = mousePos[0] - node.x;
      const dy = mousePos[1] - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= nodeRadius) {
        return node;
      }
    }

    return null;
  }

  // Now that we have mouse position and simulation, update the zoom behavior's filter
  onMounted(() => {
    // Update the zoom behavior's filter function now that we have access to mouse position
    updateFilter((event: any) => {
      // Don't filter regular mouse move events
      if (event.type === "mousemove") return false;

      // For click/drag events, check if we're over a node
      if (!simulation.value || !mouse.value) return false;

      const simulationNodes = simulation.value.nodes();
      const node = findNodeUnderMouse(simulationNodes, mouse.value);

      // Filter zoom (return true) if over a node or currently dragging
      return !!node || isDragging.value;
    });
  });

  type GraphSimulation = Simulation<D3Node, D3Link>;

  // simulation, draggedNode, and isDragging are now defined above

  async function getData(): Promise<void> {
    const data = await fetch("http://localhost:3000/api/neo4j/graph").then((res) => res.json());
    nodes.value = data.nodes;
    edges.value = data.edges;
  }

  function getNodeLabel(node: NodeData): string {
    if (!node.properties) return node.id;
    if (node.properties.name) return node.properties.name;
    if (node.properties.title) return node.properties.title;
    if (node.properties.category) return node.properties.category;
    return node.labels?.[0] || node.id;
  }

  function getNodeColor(nodeType: string): string {
    const colorMap: Record<string, string> = {
      Artist: "#e41a1c",
      Album: "#377eb8",
      Track: "#4daf4a",
      Person: "#984ea3",
      Event: "#ff7f00",
      Award: "#ffff33",
      Genre: "#a65628",
      Lyrics: "#f781bf",
    };

    return colorMap[nodeType] || "#69b3a2";
  }

  function buildSimulation(nodes: NodeData[], edges: EdgeData[], viewport: Viewport): void {
    const d3Nodes: D3Node[] = clone(toRaw(nodes)).map((node: NodeData) => ({
      id: node.id,
      x: node.x ?? Math.random() * viewport.artboard.width,
      y: node.y ?? Math.random() * viewport.artboard.height,
      label: getNodeLabel(node),
      nodeType: node.labels?.[0] || "Node",
      properties: node.properties || {},
    }));

    const d3Links: D3Link[] = clone(toRaw(edges)).map((edge: EdgeData) => ({
      source: edge.source,
      target: edge.target,
      type: edge.type || "RELATED_TO",
    }));

    if (simulation.value) {
      simulation.value.stop();
    }

    simulation.value = forceSimulation(d3Nodes)
      .force(
        "link",
        forceLink(d3Links)
          .id((d) => (d as unknown as D3Node).id)
          .distance(100)
      )
      .force("charge", forceManyBody().strength(-200))
      .force("center", forceCenter(viewport.artboard.width / 2, viewport.artboard.height / 2))
      .on("tick", drawGraph)
      // Add an end event handler to ensure we redraw after simulation settles
      .on("end", () => {
        // Force a final redraw to ensure zoom still works
        drawGraph();
      });
  }

  function drawGraph(): void {
    if (!simulation.value) return;

    clear();
    normalize();

    draw((ctx: CanvasRenderingContext2D) => {
      if (!simulation.value) return;

      const linkForce = simulation.value.force("link") as ForceLink<D3Node, D3Link>;
      const links = linkForce.links();
      const simulationNodes = simulation.value.nodes();

      // Draw links first (so they appear behind nodes)
      ctx.strokeStyle = "#999";
      ctx.lineWidth = 1;

      links.forEach((link) => {
        // Cast source and target to D3Node to ensure they have x and y properties
        const source = typeof link.source === "string" ? simulationNodes.find((n) => n.id === link.source) : (link.source as D3Node);
        const target = typeof link.target === "string" ? simulationNodes.find((n) => n.id === link.target) : (link.target as D3Node);

        if (!source || !target) return;

        // Draw the link
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();

        // Draw the relationship label
        if (link.type) {
          // Calculate midpoint of the link
          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;

          // Draw relationship label
          ctx.save();
          ctx.fillStyle = "#555";
          ctx.font = "10px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          // Add a small white background for better readability
          const textWidth = ctx.measureText(link.type).width;
          ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
          ctx.fillRect(midX - textWidth / 2 - 2, midY - 7, textWidth + 4, 14);

          // Draw the text
          ctx.fillStyle = "#555";
          ctx.fillText(link.type, midX, midY);
          ctx.restore();
        }
      });

      // Draw nodes
      simulationNodes.forEach((node) => {
        // Draw the node circle
        circle({
          x: node.x,
          y: node.y,
          radius: 20,
          fillStyle: getNodeColor(node.nodeType),
          strokeStyle: "#fff",
          lineWidth: 2,
        } as CircleProps);

        // Draw the node label
        if (node.label) {
          ctx.save();
          ctx.font = "12px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          // Draw label below the node
          ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
          const textWidth = ctx.measureText(node.label).width;
          ctx.fillRect(node.x - textWidth / 2 - 2, node.y + 22, textWidth + 4, 16);

          ctx.fillStyle = "#333";
          ctx.fillText(node.label, node.x, node.y + 30);

          // Draw node type above the node (smaller)
          ctx.font = "10px Arial";
          ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
          const typeWidth = ctx.measureText(node.nodeType).width;
          ctx.fillRect(node.x - typeWidth / 2 - 2, node.y - 38, typeWidth + 4, 14);

          ctx.fillStyle = "#555";
          ctx.fillText(node.nodeType, node.x, node.y - 30);
          ctx.restore();
        }
      });
    });
  }

  // findNodeUnderMouse is now defined above

  watch(
    [() => nodes.value, () => edges.value],
    ([watchedNodes, watchedEdges]: [NodeData[], EdgeData[]]) => {
      if (!watchedNodes?.length || !watchedEdges?.length) return;

      buildSimulation(watchedNodes, watchedEdges, viewport);

      drawGraph();
    },
    { deep: true }
  );

  function handleMouseDown(_event: MouseEvent): void {
    if (!simulation.value || !mouse.value) return;
    const simulationNodes = simulation.value.nodes();
    const node = findNodeUnderMouse(simulationNodes, mouse.value);

    if (node) {
      // Prevent the event from being handled by d3-zoom
      _event.stopPropagation();
      _event.preventDefault();

      isDragging.value = true;
      draggedNode.value = node;
      draggedNode.value.fx = draggedNode.value.x;
      draggedNode.value.fy = draggedNode.value.y;
      simulation.value.alphaTarget(0);
    }
  }

  function handleMouseMove(_event: MouseEvent): void {
    if (!isDragging.value || !draggedNode.value || !mouse.value) return;

    // Prevent the event from being handled by d3-zoom when dragging
    _event.stopPropagation();
    _event.preventDefault();

    // Update the fixed position of the dragged node
    draggedNode.value.fx = mouse.value[0];
    draggedNode.value.fy = mouse.value[1];

    // Redraw without restarting simulation
    drawGraph();
  }

  function handleMouseUp(): void {
    if (!draggedNode.value) {
      isDragging.value = false;
      return;
    }

    // Release the node by clearing fx and fy
    draggedNode.value.fx = null;
    draggedNode.value.fy = null;

    // Reset dragging state
    isDragging.value = false;
    draggedNode.value = null;

    if (simulation.value) {
      // Restart with a higher alpha to ensure proper settling
      simulation.value.alpha(0.3).restart();

      // Force a redraw after a short delay to ensure zoom functionality is maintained
      setTimeout(() => {
        drawGraph();
      }, 100);
    }
  }

  onMounted(() => {
    getData();

    // Add event listeners for drag functionality
    if (canvas.value) {
      canvas.value.addEventListener("mousedown", handleMouseDown);
      canvas.value.addEventListener("mousemove", handleMouseMove);
      canvas.value.addEventListener("mouseup", handleMouseUp);
      canvas.value.addEventListener("mouseleave", handleMouseUp); // Handle case when mouse leaves canvas

      // Add listener for transform changes to ensure we redraw when zoom changes
      canvas.value.addEventListener("transform-changed", () => {
        drawGraph();
      });
    }
  });

  onUnmounted(() => {
    // Clean up event listeners
    if (canvas.value) {
      canvas.value.removeEventListener("mousedown", handleMouseDown);
      canvas.value.removeEventListener("mousemove", handleMouseMove);
      canvas.value.removeEventListener("mouseup", handleMouseUp);
      canvas.value.removeEventListener("mouseleave", handleMouseUp);
      canvas.value.removeEventListener("transform-changed", drawGraph);
    }
  });

  return {
    nodes,
    edges,
    getData,
    draw,
    mouse,
    drawGraph,
    buildSimulation,
    simulation,
    draggedNode,
    isDragging,
    findNodeUnderMouse,
  };
}
