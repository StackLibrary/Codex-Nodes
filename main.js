const canvas = document.getElementById("canvas");
const viewport = document.getElementById("viewport");
const nodesLayer = document.getElementById("nodes-layer");
const edgeLayer = document.getElementById("edge-layer");
const addNodeBtn = document.getElementById("add-node");
const connectBtn = document.getElementById("start-connection");
const nodeForm = document.getElementById("node-form");
const deleteNodeBtn = document.getElementById("delete-node");
const selectionSummary = document.getElementById("selection-summary");
const typeForm = document.getElementById("type-form");
const typesList = document.getElementById("types-list");

const state = {
  nodes: [],
  edges: [],
  types: [
    { id: "idea", name: "Idea", description: "General thought or concept", color: "#7a84f7" },
    { id: "action", name: "Action", description: "Task or commitment", color: "#5dd3ff" },
    { id: "risk", name: "Risk", description: "Caution or concern", color: "#ff6b6b" },
  ],
  selectedNodeId: null,
  connectionStart: null,
  pan: { x: 80, y: 80 },
  zoom: 1,
};

function generateId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function applyTransform() {
  viewport.style.transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`;
}

function addNode() {
  const center = {
    x: (canvas.clientWidth / state.zoom - state.pan.x) / 2,
    y: (canvas.clientHeight / state.zoom - state.pan.y) / 2,
  };
  const type = state.types[0];
  const node = {
    id: generateId("node"),
    title: "New Node",
    description: "Describe the idea",
    content: "Add details or next steps.",
    typeId: type.id,
    color: type.color,
    x: center.x,
    y: center.y,
  };
  state.nodes.push(node);
  selectNode(node.id);
  render();
}

function selectNode(id) {
  state.selectedNodeId = id;
  updateSelectionSummary();
  populateForm();
  render();
}

function deleteNode() {
  const id = state.selectedNodeId;
  if (!id) return;
  state.nodes = state.nodes.filter((n) => n.id !== id);
  state.edges = state.edges.filter((e) => e.source !== id && e.target !== id);
  state.selectedNodeId = null;
  updateSelectionSummary();
  populateForm();
  render();
}

function updateSelectionSummary() {
  if (!state.selectedNodeId) {
    selectionSummary.textContent = "No node selected.";
    return;
  }
  const node = state.nodes.find((n) => n.id === state.selectedNodeId);
  if (!node) return;
  selectionSummary.textContent = `${node.title} · ${node.typeId}`;
}

function populateForm() {
  const node = state.nodes.find((n) => n.id === state.selectedNodeId);
  const disabled = !node;
  nodeForm.querySelectorAll("input, textarea, select, button").forEach((el) => {
    el.disabled = disabled;
  });
  if (!node) {
    nodeForm.reset();
    return;
  }
  nodeForm.title.value = node.title;
  nodeForm.description.value = node.description;
  nodeForm.content.value = node.content;
  nodeForm.type.value = node.typeId;
  nodeForm.color.value = node.color;
}

function renderTypes() {
  typesList.innerHTML = "";
  const frag = document.createDocumentFragment();
  state.types.forEach((type) => {
    const pill = document.createElement("div");
    pill.className = "type-pill";
    pill.innerHTML = `
      <div class="meta">
        <strong>${type.name}</strong>
        <small>${type.description || "No description"}</small>
      </div>
      <span class="badge" style="background:${type.color}33;border-color:${type.color};">${type.color}</span>
    `;
    frag.appendChild(pill);
  });
  if (!state.types.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Create a type to start grouping nodes.";
    frag.appendChild(empty);
  }
  typesList.appendChild(frag);
  renderTypeOptions();
}

function renderTypeOptions() {
  const select = nodeForm.type;
  select.innerHTML = "";
  state.types.forEach((type) => {
    const opt = document.createElement("option");
    opt.value = type.id;
    opt.textContent = type.name;
    select.appendChild(opt);
  });
}

function createNodeElement(node) {
  const el = document.createElement("div");
  el.className = `node${state.selectedNodeId === node.id ? " selected" : ""}`;
  el.dataset.id = node.id;
  el.style.transform = `translate(${node.x}px, ${node.y}px)`;
  el.style.borderColor = node.color;

  const type = state.types.find((t) => t.id === node.typeId);

  el.innerHTML = `
    <div class="node-header">
      <div class="node-title">${node.title}</div>
      <span class="badge" style="background:${(type?.color || node.color)}33;border-color:${type?.color || node.color};">${type?.name || "Type"}</span>
    </div>
    <p class="node-description">${node.description}</p>
    <div class="node-content">${node.content}</div>
    <div class="node-footer">
      <span class="badge" style="border-color:${node.color};color:${node.color};">${node.typeId}</span>
      <div class="handle" title="Start connection"></div>
    </div>
  `;

  enableDragging(el, node.id);

  el.addEventListener("click", (e) => {
    e.stopPropagation();
    if (state.connectionStart && state.connectionStart !== node.id) {
      state.edges.push({ id: generateId("edge"), source: state.connectionStart, target: node.id });
      state.connectionStart = null;
      connectBtn.classList.remove("connection-mode");
      render();
      return;
    }
    selectNode(node.id);
  });

  el.querySelector(".handle")?.addEventListener("click", (e) => {
    e.stopPropagation();
    state.connectionStart = node.id;
    connectBtn.classList.add("connection-mode");
  });

  return el;
}

function enableDragging(element, nodeId) {
  let dragging = false;
  let start = { x: 0, y: 0 };
  element.addEventListener("pointerdown", (e) => {
    dragging = true;
    start = { x: e.clientX - state.pan.x, y: e.clientY - state.pan.y };
    element.setPointerCapture(e.pointerId);
    element.style.cursor = "grabbing";
  });

  element.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const node = state.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const dx = (e.clientX - state.pan.x - start.x) / state.zoom;
    const dy = (e.clientY - state.pan.y - start.y) / state.zoom;
    node.x += dx;
    node.y += dy;
    start = { x: e.clientX - state.pan.x, y: e.clientY - state.pan.y };
    renderNodes();
    renderEdges();
  });

  element.addEventListener("pointerup", (e) => {
    dragging = false;
    element.releasePointerCapture(e.pointerId);
    element.style.cursor = "grab";
  });
}

function renderNodes() {
  nodesLayer.innerHTML = "";
  const frag = document.createDocumentFragment();
  state.nodes.forEach((node) => frag.appendChild(createNodeElement(node)));
  nodesLayer.appendChild(frag);
}

function getNodeBox(node) {
  const el = nodesLayer.querySelector(`[data-id="${node.id}"]`);
  if (!el) return null;
  const width = el.offsetWidth;
  const height = el.offsetHeight;
  return { x: node.x, y: node.y, width, height };
}

function getIntersectionPoint(source, target) {
  const start = { x: source.x + source.width / 2, y: source.y + source.height / 2 };
  const end = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const directions = [
    { x: source.x + source.width, y: start.y, vx: 1, vy: 0 },
    { x: source.x, y: start.y, vx: -1, vy: 0 },
    { x: start.x, y: source.y + source.height, vx: 0, vy: 1 },
    { x: start.x, y: source.y, vx: 0, vy: -1 },
  ];

  for (const point of directions) {
    const t = point.vx !== 0 ? (point.x - start.x) / dx : (point.y - start.y) / dy;
    if (t > 0 && t < 1) {
      const ix = start.x + dx * t;
      const iy = start.y + dy * t;
      const withinX = ix >= source.x && ix <= source.x + source.width;
      const withinY = iy >= source.y && iy <= source.y + source.height;
      if ((point.vx !== 0 && withinY) || (point.vy !== 0 && withinX)) {
        return { x: ix, y: iy };
      }
    }
  }
  return start;
}

function buildPath(source, target) {
  const start = getIntersectionPoint(source, target);
  const end = getIntersectionPoint(target, source);
  const dx = Math.abs(end.x - start.x) * 0.6 + 40;
  const control1 = { x: start.x + dx, y: start.y };
  const control2 = { x: end.x - dx, y: end.y };
  return `M ${start.x} ${start.y} C ${control1.x} ${control1.y} ${control2.x} ${control2.y} ${end.x} ${end.y}`;
}

function renderEdges() {
  edgeLayer.innerHTML = "";
  const frag = document.createDocumentFragment();
  state.edges.forEach((edge) => {
    const sourceNode = state.nodes.find((n) => n.id === edge.source);
    const targetNode = state.nodes.find((n) => n.id === edge.target);
    if (!sourceNode || !targetNode) return;
    const sourceBox = getNodeBox(sourceNode);
    const targetBox = getNodeBox(targetNode);
    if (!sourceBox || !targetBox) return;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const type = state.types.find((t) => t.id === sourceNode.typeId);
    const stroke = type?.color || sourceNode.color;
    path.setAttribute("d", buildPath(sourceBox, targetBox));
    path.setAttribute("stroke", stroke);
    path.style.filter = `drop-shadow(0 0 12px ${stroke}33)`;
    frag.appendChild(path);
  });
  edgeLayer.appendChild(frag);
}

function render() {
  renderNodes();
  renderEdges();
  renderTypes();
}

addNodeBtn.addEventListener("click", () => {
  addNode();
});

connectBtn.addEventListener("click", () => {
  state.connectionStart = null;
  connectBtn.classList.toggle("connection-mode");
});

canvas.addEventListener("click", () => {
  state.connectionStart = null;
  connectBtn.classList.remove("connection-mode");
  selectNode(null);
});

nodeForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const node = state.nodes.find((n) => n.id === state.selectedNodeId);
  if (!node) return;
  node.title = nodeForm.title.value || node.title;
  node.description = nodeForm.description.value;
  node.content = nodeForm.content.value;
  node.typeId = nodeForm.type.value;
  node.color = nodeForm.color.value;
  render();
  updateSelectionSummary();
});

deleteNodeBtn.addEventListener("click", deleteNode);

typeForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = typeForm.name.value.trim();
  const description = typeForm.description.value.trim();
  const color = typeForm.color.value;
  if (!name) return;
  const id = name.toLowerCase().replace(/\s+/g, "-") || generateId("type");
  state.types.push({ id, name, description, color });
  typeForm.reset();
  typeForm.color.value = "#5dd3ff";
  renderTypes();
});

let isPanning = false;
let panStart = { x: 0, y: 0 };

canvas.addEventListener("pointerdown", (e) => {
  if (e.target.closest(".node")) return;
  isPanning = true;
  panStart = { x: e.clientX - state.pan.x, y: e.clientY - state.pan.y };
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", (e) => {
  if (!isPanning) return;
  state.pan.x = e.clientX - panStart.x;
  state.pan.y = e.clientY - panStart.y;
  applyTransform();
});

canvas.addEventListener("pointerup", (e) => {
  isPanning = false;
  canvas.releasePointerCapture(e.pointerId);
});

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const scaleAmount = -e.deltaY * 0.0015;
  const newZoom = Math.min(2.2, Math.max(0.4, state.zoom + scaleAmount));
  const rect = canvas.getBoundingClientRect();
  const offsetX = (e.clientX - rect.left - state.pan.x) / state.zoom;
  const offsetY = (e.clientY - rect.top - state.pan.y) / state.zoom;
  state.zoom = newZoom;
  state.pan.x = e.clientX - rect.left - offsetX * state.zoom;
  state.pan.y = e.clientY - rect.top - offsetY * state.zoom;
  applyTransform();
}, { passive: false });

window.addEventListener("keydown", (e) => {
  if (e.key === "Delete" || e.key === "Backspace") {
    deleteNode();
  }
});

// Initial render
applyTransform();
addNode();

