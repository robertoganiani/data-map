const mapDataUrl = 'https://d3js.org/world-50m.v1.json'

const dataUrl = 'https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/meteorite-strike-data.json'

const divTooltip = d3.select('body')
  .append('div')
  .attr('class', 'tool-tip')

const width = window.innerWidth - 50,
  height = window.innerHeight - 50

let active = d3.select(null)

const projection = d3.geoMercator()
  .center([0, 30])
  .scale(180)
  .translate([width / 2, height / 2])

const zoom = d3.zoom()
  .scaleExtent([1, 8])
  .on('zoom', zoomed)

const path = d3.geoPath()
  .projection(projection)

const svg = d3.select('svg')
  .attr('width', width)
  .attr('height', height)
  .on('click', stopped, true)

svg.append('rect')
  .attr('class', 'background')
  .attr('width', width)
  .attr('click', reset)

const g = svg.append('g')

svg.call(zoom)

// load map data
d3.json(mapDataUrl, mapData => {

  const countries = topojson.feature(mapData, mapData.objects.countries).features

  g.selectAll('.country')
    .data(countries)
    .enter().append('path')
    .attr('class', 'country')
    .attr('d', path)
    .on('mouseover', function (d) {
      d3.select(this).classed('hovered', true)
    })
    .on('mouseout', function (d) {
      d3.select(this).classed('hovered', false)
    })
    .on('click', clicked)

  // load meteor data
  d3.json(dataUrl, data => {

    const colorScale = d3.scaleOrdinal(d3.schemeDark2)

    g.selectAll('.meteor')
      .data(data.features)
      .enter().append('circle')
      .attr('class', 'meteor')
      .attr('r', d => calcRad(d.properties.mass))
      .attr('fill', d => colorScale(d.properties.mass))
      .attr('cx', d => projection([d.properties.reclong, d.properties.reclat])[0])
      .attr('cy', d => projection([d.properties.reclong, d.properties.reclat])[1])
      .on('mouseover', handleMouseOver)
      .on('mouseout', handleMouseOut)

  })

})

// helper functions
function clicked(d) {
  if (active.node() === this) return reset()
  active.classed('active', false)
  active = d3.select(this).classed('active', true)

  const bounds = path.bounds(d),
    dx = bounds[1][0] - bounds[0][0],
    dy = bounds[1][1] - bounds[0][1],
    x = (bounds[0][0] + bounds[1][0]) / 2,
    y = (bounds[0][1] + bounds[1][1]) / 2,
    scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height))),
    translate = [width / 2 - scale * x, height / 2 - scale * y]

  svg.transition()
    .duration(750)
    .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale))
}

function reset() {
  active.classed('active', false)
  active = d3.select(null)

  svg.transition()
    .duration(750)
    .call(zoom.transform, d3.zoomIdentity)
}

function zoomed() {
  g.style('stroke-width', 1.5 / d3.event.transform.k + 'px')
  g.attr('transform', d3.event.transform)
}

function stopped() {
  if (d3.event.defaultPrevented) d3.event.stopPropagation()
}

function calcRad(mass) {
  if (mass > 20000000) return 20
  else if (mass > 200000) return 15
  else if (mass > 20000) return 12
  else if (mass > 2000) return 7
  else if (mass > 20) return 3
  else return 1
}

function handleMouseOver(d) {
  d3.select(this)
    .attr('cursor', 'pointer')
  divTooltip.style('left', d3.event.pageX + 20 + 'px')
  divTooltip.style('top', d3.event.pageY - 25 + 'px')
  divTooltip.style('display', 'inline-block')
  divTooltip.transition()
    .duration(300)
    .style('opacity', 1)
  divTooltip.html(`Name: ${d.properties.name}
  Mass: ${d.properties.mass}
  Date: ${new Date(d.properties.year)}`)
}

function handleMouseOut(d) {
  divTooltip.style('display', 'none')
  divTooltip.transition()
    .duration(300)
    .style('opacity', 0)
}
