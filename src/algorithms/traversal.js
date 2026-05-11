import { buildAdj, buildReverseAdj } from "../utils/graph"

export function dfs(start, graph) {
    const adj = buildAdj(graph)

    const visited = []
    const seen = new Set()
    const stack = [start]

    while (stack.length) {
        const v = stack.pop()

        if (seen.has(v)) continue

        seen.add(v)
        visited.push(v)

            ;[...(adj[v] || [])]
                .reverse()
                .forEach(n => {
                    if (!seen.has(n)) {
                        stack.push(n)
                    }
                })
    }

    return visited
}

export function dfsAdj(start, adj) {
    const visited = new Set()
    const order = []

    function visit(v) {
        if (visited.has(v)) return

        visited.add(v)

        order.push(v)

        for (const next of adj[v] || []) {
            visit(next)
        }
    }

    visit(start)

    return order
}

export function bfs(start, graph) {
    const adj = buildAdj(graph)

    const visited = []
    const seen = new Set([start])
    const queue = [start]

    while (queue.length) {
        const v = queue.shift()

        visited.push(v)

            ; (adj[v] || []).forEach(n => {
                if (!seen.has(n)) {
                    seen.add(n)
                    queue.push(n)
                }
            })
    }

    return visited
}