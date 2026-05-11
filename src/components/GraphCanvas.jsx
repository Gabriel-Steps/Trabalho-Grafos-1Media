import { useRef, useEffect, useCallback } from 'react'
import { getColor, NODE_R } from '../utils/constants'
import { drawVertices, drawEdges, drawGrid } from './graph/GraphRenderer'

export default function GraphCanvas({
  graph,
  highlight,
  draggingNode,
  setDraggingNode,
  onNodeClick,
  onCanvasClick,
  updateVertexPosition
}) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  const vertices = Object.values(graph.vertices)
  const edges = Object.values(graph.edges)

  const draw = useCallback(() => {
    const canvas = canvasRef.current

    if (!canvas) return

    const ctx = canvas.getContext('2d')

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    drawGrid(ctx, canvas.width, canvas.height)

    drawEdges(ctx, edges, graph, highlight)

    drawVertices(ctx, vertices, highlight)

  }, [graph, highlight])

  useEffect(() => {
    const loop = () => {
      draw()
      animRef.current = requestAnimationFrame(loop)
    }

    animRef.current = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(animRef.current)

  }, [draw])

  function getNodeAt(x, y) {
    return vertices.find(vertex => {
      return Math.hypot(
        vertex.x - x,
        vertex.y - y
      ) < NODE_R
    })
  }

  function handleMouseDown(e) {
    const rect = canvasRef.current.getBoundingClientRect()

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const node = getNodeAt(x, y)

    if (node) {
      setDraggingNode(node.id)
    } else {
      onCanvasClick(x, y)
    }
  }

  function handleMouseMove(e) {
    if (!draggingNode) return

    const rect = canvasRef.current.getBoundingClientRect()

    updateVertexPosition(
      draggingNode,
      e.clientX - rect.left,
      e.clientY - rect.top
    )
  }

  function handleMouseUp(e) {
    if (!draggingNode) return

    const rect = canvasRef.current.getBoundingClientRect()

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const vertex = graph.vertices[draggingNode]

    if (
      Math.hypot(x - vertex.x, y - vertex.y) < 5
    ) {
      onNodeClick(draggingNode)
    }

    setDraggingNode(null)
  }

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={500}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        cursor: draggingNode
          ? 'grabbing'
          : 'crosshair'
      }}
    />
  )
}