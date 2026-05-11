import { getColor, NODE_R } from '../../utils/constants'

export function drawVertices(
    ctx,
    vertices,
    highlight
) {
    vertices.forEach((vertex, index) => {
        const isHl = highlight.nodes?.includes(vertex.id)
        const isSel = highlight.selected === vertex.id

        const color =
            vertex.color == null
                ? getColor(index)
                : vertex.color

        /*
         * Highlight glow
         */
        if (isHl || isSel) {
            const glow = ctx.createRadialGradient(
                vertex.x,
                vertex.y,
                NODE_R * 0.5,
                vertex.x,
                vertex.y,
                NODE_R * 2.5
            )

            glow.addColorStop(
                0,
                isSel
                    ? 'rgba(255,107,53,0.45)'
                    : 'rgba(255,255,255,0.25)'
            )

            glow.addColorStop(1, 'transparent')

            ctx.beginPath()

            ctx.arc(
                vertex.x,
                vertex.y,
                NODE_R * 2.5,
                0,
                Math.PI * 2
            )

            ctx.fillStyle = glow
            ctx.fill()
        }

        /*
         * Main circle
         */
        ctx.beginPath()

        ctx.arc(
            vertex.x,
            vertex.y,
            NODE_R,
            0,
            Math.PI * 2
        )

        ctx.fillStyle = color
        ctx.fill()

        /*
         * Border
         */
        ctx.strokeStyle =
            isSel
                ? '#ffffff'
                : color

        ctx.lineWidth =
            isSel
                ? 4
                : 2

        ctx.stroke()

        /*
         * Label
         */
        ctx.fillStyle = '#ffffff'

        ctx.font =
            `bold ${vertex.id.length > 2
                ? '11'
                : '14'
            }px monospace`

        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        ctx.fillText(
            vertex.id,
            vertex.x,
            vertex.y
        )
    })
}

export function drawEdges(
    ctx,
    edges,
    graph,
    highlight
) {
    edges.forEach(edge => {

        const from = graph.vertices[edge.from]
        const to = graph.vertices[edge.to]

        if (!from || !to) return

        const isHighlighted =
            highlight.edges?.some(e =>
                e.from === edge.from &&
                e.to === edge.to
            )

        ctx.strokeStyle =
            isHighlighted
                ? '#ff6b35'
                : 'rgba(255,255,255,0.15)'

        ctx.lineWidth =
            isHighlighted ? 2.5 : 1.5

        // SELF LOOP
        if (edge.from === edge.to) {

            const loopR = NODE_R * 0.9

            ctx.beginPath()

            ctx.arc(
                from.x,
                from.y - NODE_R - loopR * 0.6,
                loopR,
                0,
                Math.PI * 2
            )

            ctx.stroke()

            // ARROW FOR SELF LOOP
            if (graph.directed) {

                const ax = from.x + loopR * 0.5
                const ay = from.y - NODE_R - 2

                ctx.fillStyle =
                    isHighlighted
                        ? '#ff6b35'
                        : 'rgba(255,255,255,0.2)'

                ctx.beginPath()

                ctx.moveTo(ax, ay)

                ctx.lineTo(ax - 8, ay - 8)

                ctx.lineTo(ax + 4, ay - 6)

                ctx.closePath()

                ctx.fill()
            }

            return
        }

        // NORMAL EDGE
        const dx = to.x - from.x
        const dy = to.y - from.y

        const dist = Math.hypot(dx, dy)

        if (dist === 0) return

        const ux = dx / dist
        const uy = dy / dist

        const startX = from.x + ux * NODE_R
        const startY = from.y + uy * NODE_R

        const endX = to.x - ux * NODE_R
        const endY = to.y - uy * NODE_R

        ctx.beginPath()

        ctx.moveTo(startX, startY)

        ctx.lineTo(endX, endY)

        ctx.stroke()

        // DIRECTED ARROW
        if (graph.directed) {

            const angle =
                Math.atan2(
                    endY - startY,
                    endX - startX
                )

            ctx.fillStyle =
                isHighlighted
                    ? '#ff6b35'
                    : 'rgba(255,255,255,0.2)'

            ctx.beginPath()

            ctx.moveTo(endX, endY)

            ctx.lineTo(
                endX - 12 * Math.cos(angle - 0.4),
                endY - 12 * Math.sin(angle - 0.4)
            )

            ctx.lineTo(
                endX - 12 * Math.cos(angle + 0.4),
                endY - 12 * Math.sin(angle + 0.4)
            )

            ctx.closePath()

            ctx.fill()
        }
    })
}

export function drawGrid(ctx, width, height) {

    ctx.strokeStyle = 'rgba(255,255,255,0.03)'

    ctx.lineWidth = 1

    const spacing = 40

    // Vertical lines

    for (let x = 0; x < width; x += spacing) {

        ctx.beginPath()

        ctx.moveTo(x, 0)

        ctx.lineTo(x, height)

        ctx.stroke()
    }

    // Horizontal lines

    for (let y = 0; y < height; y += spacing) {

        ctx.beginPath()

        ctx.moveTo(0, y)

        ctx.lineTo(width, y)

        ctx.stroke()
    }
}