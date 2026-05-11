import { buildAdj, buildReverseAdj } from '../utils/graph'

export function calcFecho(start, graph, reverse = false) {

  const adj = reverse
    ? buildReverseAdj(graph)
    : buildAdj(graph)

  const reach = new Set()

  const queue = [start]

  const visited = new Set([start])

  while (queue.length) {

    const v = queue.shift()

      ; (adj[v] || []).forEach(neighbor => {

        if (!visited.has(neighbor)) {

          visited.add(neighbor)

          reach.add(neighbor)

          queue.push(neighbor)
        }
      })
  }

  return [...reach]
}