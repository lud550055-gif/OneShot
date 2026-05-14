import React, { useMemo } from 'react'
import type { TreeNode } from '../../types'

interface LayoutNode {
  node: TreeNode
  x: number
  y: number
  id: string
  parentId?: string
  edgeLabel?: string
}

const NODE_W = 140
const NODE_H = 60
const H_GAP = 20
const V_GAP = 80

const CLASS_COLORS: Record<string, string> = {
  malware: '#ef4444',
  benign:  '#10b981',
  phishing: '#ef4444',
  legit:   '#10b981',
  ddos:    '#ef4444',
  anomaly: '#f59e0b',
  normal:  '#10b981',
  'P1-critical': '#ef4444',
  'P2-high':     '#f59e0b',
  'P3-medium':   '#00d4ff',
  'P4-low':      '#10b981',
}

function getColor(node: TreeNode): string {
  if (!node.isLeaf) return '#1a2235'
  return (CLASS_COLORS[node.class ?? ''] ?? '#7c3aed') + '22'
}
function getBorderColor(node: TreeNode): string {
  if (!node.isLeaf) return '#1e2d45'
  return CLASS_COLORS[node.class ?? ''] ?? '#7c3aed'
}

function layoutTree(node: TreeNode, idPrefix = 'n'): LayoutNode[] {
  const result: LayoutNode[] = []

  function measure(n: TreeNode): number {
    if (n.isLeaf || !n.children) return 1
    return Object.values(n.children).reduce((s, c) => s + measure(c), 0)
  }

  function place(n: TreeNode, depth: number, offsetX: number, id: string, parentId?: string, edgeLabel?: string) {
    const width = measure(n)
    const x = offsetX + (width - 1) * (NODE_W + H_GAP) / 2
    result.push({ node: n, x, y: depth * (NODE_H + V_GAP), id, parentId, edgeLabel })

    if (!n.isLeaf && n.children) {
      let childX = offsetX
      Object.entries(n.children).forEach(([val, child], i) => {
        const childWidth = measure(child)
        place(child, depth + 1, childX, `${id}-${i}`, id, val)
        childX += childWidth * (NODE_W + H_GAP)
      })
    }
  }

  place(node, 0, 0, idPrefix)
  return result
}

export default function TreeViz({ tree, classLabels }: { tree: TreeNode; classLabels?: Record<string, string> }) {
  const nodes = useMemo(() => layoutTree(tree), [tree])

  const nodeMap = useMemo(() => {
    const m: Record<string, LayoutNode> = {}
    nodes.forEach(n => { m[n.id] = n })
    return m
  }, [nodes])

  const maxX = Math.max(...nodes.map(n => n.x + NODE_W))
  const maxY = Math.max(...nodes.map(n => n.y + NODE_H))
  const svgW = maxX + 40
  const svgH = maxY + 40

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 600 }}>
      <svg width={svgW} height={svgH} style={{ display: 'block' }}>
        {/* Edges */}
        {nodes.filter(n => n.parentId).map(n => {
          const parent = nodeMap[n.parentId!]
          if (!parent) return null
          const x1 = parent.x + NODE_W / 2
          const y1 = parent.y + NODE_H
          const x2 = n.x + NODE_W / 2
          const y2 = n.y
          const midY = (y1 + y2) / 2
          return (
            <g key={`edge-${n.id}`}>
              <path
                d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                fill="none"
                stroke="#1e2d45"
                strokeWidth={1.5}
              />
              {n.edgeLabel && (
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2}
                  textAnchor="middle"
                  fill="#4b5563"
                  fontSize={10}
                  fontFamily="IBM Plex Mono, monospace"
                >
                  {n.edgeLabel}
                </text>
              )}
            </g>
          )
        })}

        {/* Nodes */}
        {nodes.map(n => {
          const bg = getColor(n.node)
          const border = getBorderColor(n.node)
          const isRoot = !n.parentId
          return (
            <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
              <rect
                width={NODE_W}
                height={NODE_H}
                rx={6}
                fill={bg}
                stroke={border}
                strokeWidth={isRoot ? 2 : 1}
              />
              {n.node.isLeaf ? (
                <>
                  <text x={NODE_W / 2} y={22} textAnchor="middle" fill={border} fontSize={10} fontFamily="IBM Plex Mono, monospace" letterSpacing={1}>
                    КЛАСС
                  </text>
                  <text x={NODE_W / 2} y={40} textAnchor="middle" fill={border} fontSize={12} fontWeight="bold" fontFamily="IBM Plex Sans, sans-serif">
                    {classLabels?.[n.node.class ?? ''] ?? n.node.class ?? '?'}
                  </text>
                </>
              ) : (
                <>
                  <text x={NODE_W / 2} y={20} textAnchor="middle" fill="#94a3b8" fontSize={9} fontFamily="IBM Plex Mono, monospace" letterSpacing={1}>
                    ПРИЗНАК
                  </text>
                  <text x={NODE_W / 2} y={36} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="bold" fontFamily="IBM Plex Sans, sans-serif">
                    {n.node.feature}
                  </text>
                  <text x={NODE_W / 2} y={52} textAnchor="middle" fill="#4b5563" fontSize={9} fontFamily="IBM Plex Mono, monospace">
                    H={n.node.entropy?.toFixed(3)} n={n.node.sampleCount}
                  </text>
                </>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
