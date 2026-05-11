export const NODE_R = 22

export const PALETTE = [
  '#ff6b35',
  '#f7c59f',
  '#00a6fb',
  '#57cc99',
  '#c77dff',
  '#e63946',
  '#a8dadc',
  '#ffe66d',
  '#06d6a0'
]

export function getColor(i) {
  return PALETTE[i % PALETTE.length]
}