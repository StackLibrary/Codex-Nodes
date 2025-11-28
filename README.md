# Codex-Nodes

## Introduction
Simple node-based editor canvas (dark-mode), this will accelerate our discussions and increase productivity. It is a shared workspace where we exchange by passing entities of the ideas, connect them and build needed data models and descriptions related to those entities.

## Core Functionality

1. Draggable nodes with titles, descriptions, and editable content.
2. Edge creation with Bezier curves for a visually appealing graph.
3. Interaction design includes insertion, drag-and-drop, selection, editing and deletion.
4. Zooming and panning are essential for canvas navigation.

### Choosing the Right Framework

- We need to ensuring a reliable custom solution.
- You can focus on framework that can offer state management and can handle the core engine.
- Potentially using reactflow, or any other selection of React.

### Property Panel Component

- This will allow users to edit the selected node's label, content, type (which controls color), and delete it.
- Integrate the Property Panel and manage the selected node state more explicitly.

### Edge Item
- Implement "Smart Intersections". Instead of connecting center-to-center, the edge will calculate the intersection point on the node's bounding box.
- This creates the effect of the line connecting to the "edge" of the node and sliding freely as you move the node around.

### Types Definition
- Users can define Types of the Nodes by adding editable elements to it (title, description, elements, ...etc).
- Add a color field to NodeData to support custom colors in the future, though we will primarily use Type for now.

---

## Running the playground

No build step is required. Open `index.html` in your browser or serve the repository with a simple static server (for example, `python -m http.server 4173`). The canvas supports mouse interactions for panning, zooming (scroll), creating nodes, connecting them via the handle, and editing via the property panel.
