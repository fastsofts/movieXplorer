import { useState, useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { relationshipAPI } from '../services/api'
import type { GraphData, GraphNode, GraphLink } from '../types'
import Loading from '../components/Loading'

export default function RelationshipsPage() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [data, setData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadRelationships()
  }, [])

  useEffect(() => {
    if (data && svgRef.current) {
      renderGraph()
    }
  }, [data, collapsedNodes])

  const loadRelationships = async () => {
    setLoading(true)
    try {
      const response = await relationshipAPI.getRelationships()
      setData(response.data)
    } catch (error) {
      console.error('Error loading relationships:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleNode = (nodeId: string) => {
    setCollapsedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  const renderGraph = () => {
    if (!data || !svgRef.current) return

    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    const filteredNodes = data.nodes.filter(node => {
      if (collapsedNodes.has(node.id)) return false
      const parentLink = data.links.find(l => l.target === node.id)
      if (parentLink && typeof parentLink.source === 'string') {
        return !collapsedNodes.has(parentLink.source)
      }
      return true
    })

    const filteredLinks = data.links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id
      return !collapsedNodes.has(sourceId) && !collapsedNodes.has(targetId)
    })

    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)

    const defs = svg.append('defs')

    const colorMap = {
      root: { base: '#7c3aed', light: '#a78bfa', bright: '#ddd6fe' },
      movie: { base: '#2563eb', light: '#60a5fa', bright: '#dbeafe' },
      actor: { base: '#059669', light: '#34d399', bright: '#d1fae5' },
      director: { base: '#d97706', light: '#fbbf24', bright: '#fef3c7' }
    }

    // Create shiny radial gradients
    Object.entries(colorMap).forEach(([type, colors]) => {
      const gradient = defs.append('radialGradient')
        .attr('id', `gradient-${type}`)
        .attr('cx', '30%')
        .attr('cy', '30%')
    
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', colors.bright)
        .attr('stop-opacity', 1)
    
      gradient.append('stop')
        .attr('offset', '50%')
        .attr('stop-color', colors.light)
        .attr('stop-opacity', 1)
    
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', colors.base)
        .attr('stop-opacity', 1)
    })

    // Arrow markers
    Object.keys(colorMap).forEach(type => {
      defs.append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 10)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#94a3b8')
        .attr('opacity', 0.6)
    })

    const g = svg.append('g')

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom)

    // Rating-based size scale for movies
    const ratingScale = d3.scaleSqrt()
      .domain([0, 10])
      .range([20, 55])

    const processedNodes = filteredNodes.map((node: any) => {
      let radius = 20
      if (node.type === 'root') {
        radius = 60
      } else if (node.type === 'movie' && node.details?.rating) {
        radius = ratingScale(node.details.rating)
      } else if (node.type === 'director') {
        radius = 22
      } else if (node.type === 'actor') {
        radius = 20
      }
      return { ...node, computedRadius: radius }
    })

    // Create a deep copy of links to avoid mutation issues
    const processedLinks = filteredLinks.map(link => ({
      source: typeof link.source === 'string' ? link.source : link.source.id,
      target: typeof link.target === 'string' ? link.target : link.target.id
    }))

    const simulation = d3.forceSimulation(processedNodes as any)
      .force('link', d3.forceLink(processedLinks)
        .id((d: any) => d.id)
        .distance(120))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.computedRadius + 15))

    const link = g.append('g')
      .selectAll('path')
      .data(processedLinks)
      .enter()
      .append('path')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .attr('marker-end', 'url(#arrow-movie)')

    const node = g.append('g')
      .selectAll('g')
      .data(processedNodes)
      .enter()
      .append('g')
      .call(d3.drag<any, any>()
         .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        }))

    // Main circle with gradient
    node.append('circle')
      .attr('r', (d: any) => d.computedRadius)
      .attr('fill', (d: any) => `url(#gradient-${d.type})`)
      .style('cursor', 'pointer')
      .on('click', (event, d: any) => {
        event.stopPropagation()
        setSelectedNode(d)
      })
      .on('dblclick', (event, d: any) => {
        event.stopPropagation()
        if (d.type !== 'root') {
          toggleNode(d.id)
        }
      })

    // Thin inner ring for depth
    node.append('circle')
      .attr('r', (d: any) => d.computedRadius - 2)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255,255,255,0.25)')
      .attr('stroke-width', 1)
      .style('pointer-events', 'none')

    // Text with proper sizing
    node.each(function(d: any) {
      const nodeGroup = d3.select(this)
      const radius = d.computedRadius
      const rating = d.details?.rating
    
      // Font size scales with radius: smaller circles = smaller text
      const baseFontSize = Math.max(6, Math.min(14, radius * 0.22))
      const lineHeight = baseFontSize * 1.25
    
      const words = d.name.split(/\s+/)
      const lines: string[] = []
      let currentLine = ''
      const maxWidth = radius * 1.4
    
      words.forEach((word: string) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        const estimatedWidth = testLine.length * baseFontSize * 0.48
      
        if (estimatedWidth > maxWidth && currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          currentLine = testLine
        }
      })
    
      if (currentLine) lines.push(currentLine)
    
      const maxLines = rating ? 2 : 3
      const titleLines = lines.slice(0, maxLines)
      if (titleLines.length === maxLines && lines.length > maxLines) {
        const maxChars = Math.floor(maxWidth / (baseFontSize * 0.48))
        titleLines[maxLines - 1] = titleLines[maxLines - 1].substring(0, maxChars - 3) + '...'
      }
    
      const allLines = rating ? [...titleLines, `★ ${rating.toFixed(1)}`] : titleLines
    
      const totalHeight = allLines.length * lineHeight
      const startY = -(totalHeight / 2) + (lineHeight / 2.3)
    
      allLines.forEach((line, i) => {
        const isRating = rating && i === allLines.length - 1
        nodeGroup.append('text')
          .text(line)
          .attr('text-anchor', 'middle')
          .attr('dy', startY + (i * lineHeight))
          .attr('font-size', isRating ? baseFontSize * 1.15 : baseFontSize)
          .attr('font-weight', isRating ? '700' : '600')
          .attr('fill', '#ffffff')
          .attr('opacity', 0.95)
          .style('pointer-events', 'none')
          .style('user-select', 'none')
      })
    })

    simulation.on('tick', () => {
      link.attr('d', (d: any) => {
        const sx = d.source.x
        const sy = d.source.y
        const tx = d.target.x
        const ty = d.target.y

        const dx = tx - sx
        const dy = ty - sy
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Get the correct target radius from the node object
        const targetRadius = d.target.computedRadius || 20

        // Create control point for quadratic Bezier curve
        const midX = (sx + tx) / 2
        const midY = (sy + ty) / 2
        const offsetDistance = 30
        const cx = midX + (-dy / distance) * offsetDistance
        const cy = midY + (dx / distance) * offsetDistance

        // Calculate the direction from control point to target
        const dx2 = tx - cx
        const dy2 = ty - cy
        const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)

        // Calculate endpoint at edge of target circle (accounting for curve)
        const ratio = Math.max(0, (distance2 - targetRadius - 2) / distance2)
        const ex = cx + dx2 * ratio
        const ey = cy + dy2 * ratio

        return `M${sx},${sy} Q${cx},${cy} ${ex},${ey}`
      })

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b px-4 py-3" style={{ flexShrink: 0 }}>
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-2">Relationship Network</h1>
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-600"></div>
              <span>Root</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span>Movies</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span>Actors</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span>Directors</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Click to view details • Double-click to collapse/expand • Drag to move nodes • Scroll to zoom
          </p>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <Loading />
          </div>
        ) : (
          <>
            <svg ref={svgRef} className="w-full h-full bg-gray-50"></svg>
            {selectedNode && (
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-10">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{selectedNode.name}</h3>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-sm space-y-1">
                  <p><span className="font-semibold">Type:</span> {selectedNode.type}</p>
                  {selectedNode.details && Object.entries(selectedNode.details).map(([key, value]) => (
                    <p key={key}>
                      <span className="font-semibold">{key}:</span> {String(value)}
                    </p>
                  ))}
                </div>
                {selectedNode.type !== 'root' && (
                  <button
                    onClick={() => toggleNode(selectedNode.id)}
                    className="mt-3 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                  >
                    {collapsedNodes.has(selectedNode.id) ? 'Expand' : 'Collapse'}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}