import { buildAdj, buildReverseAdj } from '../utils/graph'

export function kosarajuSCC(graph) {

  const vertices = Object.keys(graph.vertices)

  if (vertices.length === 0) {
    return []
  }

  const adj = buildAdj(graph)

  const reverseAdj = buildReverseAdj(graph)

  const visited = new Set()

  const finishOrder = []

  // FIRST DFS PASS

  vertices.forEach(start => {

    if (visited.has(start)) return

    const stack = [[start, false]]

    while (stack.length) {

      const [vertex, processed] = stack.pop()

      if (processed) {

        finishOrder.push(vertex)

        continue
      }

      if (visited.has(vertex)) continue

      visited.add(vertex)

      stack.push([vertex, true])

        ; (adj[vertex] || []).forEach(neighbor => {

          if (!visited.has(neighbor)) {

            stack.push([neighbor, false])
          }
        })
    }
  })

  // SECOND DFS PASS

  const visitedReverse = new Set()

  const stronglyConnectedComponents = []

  for (
    let i = finishOrder.length - 1;
    i >= 0;
    i--
  ) {

    const start = finishOrder[i]

    if (visitedReverse.has(start)) {
      continue
    }

    const component = []

    const stack = [start]

    while (stack.length) {

      const vertex = stack.pop()

      if (visitedReverse.has(vertex)) {
        continue
      }

      visitedReverse.add(vertex)

      component.push(vertex)

        ; (reverseAdj[vertex] || []).forEach(neighbor => {

          if (!visitedReverse.has(neighbor)) {

            stack.push(neighbor)
          }
        })
    }

    stronglyConnectedComponents.push(component)
  }

  return stronglyConnectedComponents
}