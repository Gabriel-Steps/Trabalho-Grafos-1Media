import { useState } from 'react'

/**
 * @typedef Vertex
 * @property {string} id
 * @property {number} x
 * @property {number} y
 * @property {string=} color
 */

/**
 * @typedef Edge
 * @property {string} from
 * @property {string} to
 */

/**
 * @typedef Graph
 * @property {Object.<string, Vertex>} vertices
 * @property {Object.<string, Edge>} edges
 * @property {boolean} directed
 */

export function useGraph() {
  /** @type {Graph} */
  const initialGraph = {
    directed: false,
    vertices: {},
    edges: {}
  }

  const [graph, setGraph] = useState(initialGraph)

  function addVertex(id, x, y) {
    setGraph(prev => ({
      ...prev,

      vertices: {
        ...prev.vertices,

        [id]: {
          id,
          x,
          y
        }
      }
    }))
  }

  function replaceGraph(newGraph) {
    setGraph(newGraph)
  }

  function removeVertex(id) {
    setGraph(prev => {
      const vertices = { ...prev.vertices }
      delete vertices[id]

      const edges = Object.fromEntries(
        Object.entries(prev.edges).filter(([_, edge]) => {
          return edge.from !== id && edge.to !== id
        })
      )

      return {
        ...prev,
        vertices,
        edges
      }
    })
  }

  function addEdge(from, to) {
    const edgeId = `${from}-${to}`

    setGraph(prev => ({
      ...prev,

      edges: {
        ...prev.edges,

        [edgeId]: {
          id: edgeId,
          from,
          to,
          weight: 1
        }
      }
    }))
  }

  function removeEdge(edgeId) {
    setGraph(prev => {
      const edges = { ...prev.edges }

      delete edges[edgeId]

      return {
        ...prev,
        edges
      }
    })
  }

  function updateVertexPosition(id, x, y) {
    setGraph(prev => ({
      ...prev,

      vertices: {
        ...prev.vertices,

        [id]: {
          ...prev.vertices[id],

          x,
          y
        }
      }
    }))
  }

  const setGraphDirected = directed => {
    setGraph(prev => ({
      ...prev,
      directed,
      edges: {}
    }))
  }

  return {
    graph,
    addVertex,
    removeVertex,
    addEdge,
    removeEdge,
    updateVertexPosition,
    setGraphDirected,
    replaceGraph
  }
}