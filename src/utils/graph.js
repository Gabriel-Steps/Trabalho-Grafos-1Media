export function buildAdj(graph) {
  const adj = {}

  Object.keys(graph.vertices).forEach(v => {
    adj[v] = []
  })

  Object.values(graph.edges).forEach(edge => {
    adj[edge.from].push(edge.to)

    if (!graph.directed && edge.from !== edge.to) {
      adj[edge.to].push(edge.from)
    }
  })

  return adj
}

export function buildReverseAdj(graph) {
  const adj = {}

  Object.keys(graph.vertices).forEach(v => {
    adj[v] = []
  })

  Object.values(graph.edges).forEach(edge => {
    adj[edge.to].push(edge.from)
  })

  return adj
}

/**
 * @param {Object.<string, string[]>} adj
 * @returns {{
 *   vertex: string | null,
 *   degree: number
 * }}
 */
export function getHighestDegreeVertex(adj) {

  let maxVertex = null
  let maxDegree = -1

  Object.entries(adj).forEach(([vertex, neighbors]) => {

    if (neighbors.length > maxDegree) {
      maxDegree = neighbors.length
      maxVertex = vertex
    }

  })

  return {
    vertex: maxVertex,
    degree: maxDegree
  }
}