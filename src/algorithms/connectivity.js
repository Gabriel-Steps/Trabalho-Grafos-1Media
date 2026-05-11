import { buildAdj, buildReverseAdj } from '../utils/graph'
import { dfs, dfsAdj } from './traversal'

export function isConnected(graph) {
  const vertices = Object.keys(graph.vertices)

  if (vertices.length <= 1) {
    return true
  }

  if (!graph.directed) {
    return dfs(vertices[0], graph).length === vertices.length
  }

  const adj = buildAdj(graph)
  const radj = buildReverseAdj(graph)

  return (
    dfsAdj(vertices[0], adj).length === vertices.length &&
    dfsAdj(vertices[0], radj).length === vertices.length
  )
}