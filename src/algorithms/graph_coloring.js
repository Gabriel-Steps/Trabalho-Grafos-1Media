import { buildAdj, getHighestDegreeVertex } from "../utils/graph"
import { getColor } from "../utils/constants"

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

/**
 * @typedef ColoringResult
 * @property {Graph} graph
 * @property {string[]} order
 */

/**
 * @typedef {Object.<string, string[]>} AdjacencyList
 */

/**
 * Seleciona qual o vertice com maior adjacencia de cores.
 *
 * @param {AdjacencyList} adj
 * @param {Map<string, number>} colored
 * @returns {string | null}
 */
function getNextVertex(adj, colored) {
    let bestVertex = null
    let bestScore = -1
    let bestDegree = -1

    Object.keys(adj).forEach(vertex => {
        if (colored.has(vertex)) return

        const neighborColors = new Set()

        adj[vertex].forEach(neighbor => {
            const color = colored.get(neighbor)

            if (color != null) {
                neighborColors.add(color)
            }
        })

        const score = neighborColors.size
        const degree = adj[vertex].length

        if (
            score > bestScore ||
            (score === bestScore && degree > bestDegree)
        ) {
            bestVertex = vertex
            bestScore = score
            bestDegree = degree
        }
    })

    return bestVertex
}


/**
 * Colore um grafo conforme a heuristica.
 *
 * @param {Graph} graph
 * @returns {ColoringResult}
 */
export function graphColoring(graph) {
    const adj = buildAdj({
        ...graph,
        directed: false
    })

    const colored = new Map()
    const order = []

    while (colored.size < Object.keys(graph.vertices).length) {
        const vertex = getNextVertex(adj, colored)

        const usedColors = new Set()

        adj[vertex].forEach(neighbor => {
            const color = colored.get(neighbor)

            if (color != null) {
                usedColors.add(color)
            }
        })

        let colorIndex = 0

        while (usedColors.has(colorIndex)) {
            colorIndex++
        }

        colored.set(vertex, colorIndex)
        order.push(vertex)
    }

    const newVertices = {}

    Object.entries(graph.vertices).forEach(([id, vertex]) => {
        const colorIndex = colored.get(id) ?? 0

        newVertices[id] = {
            ...vertex,
            color: getColor(colorIndex)
        }
    })

    return {
        graph: {
            ...graph,
            vertices: newVertices
        },
        order
    }
}