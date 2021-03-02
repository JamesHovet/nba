var width = 1200;
var height = 800;

var resolution = 80;
var boxWidth = (height / resolution)
var boxMargin = 0.0;
var boxInnerWidth = boxWidth - 2 * boxMargin;

var heatmapSize = { width: height, height: height}

var histogramPosition = {x : 840, y: 780}
var histogramSize = {width: 340, height : 250 }
var histogramBarWidth = histogramSize.width / 35

var sliceSize = 50000;

var chart = d3.select("canvas");
chart.attr("width", heatmapSize.width)
    .attr("height", heatmapSize.height)
var context = chart.node().getContext("2d");
var svgRaw = d3.select("svg")
    .attr("width", width)
    .attr("height", height)
var bkSVG = d3.select("#bk-svg")
    .attr("width", heatmapSize.width)

var svg = svgRaw.append("g")

var courtG = svg.append("g").attr("id", "court");
var courtRadialOverlayG = svg.append("g").attr("id", "overlay")
var histG = svg.append("g").attr("id", "hist").attr("transform", `translate(${histogramPosition.x}, ${histogramPosition.y - histogramSize.height})`);
var histBarsG = histG.append("g")
var histYAxisG = histG.append("g").attr("transform", `translate(0, ${0})`)
let histXAxisG = histG.append("g").attr("transform", `translate(0, ${histogramSize.height})`)
var progressBarG = svg.append("g").attr("id", "progressBar");


var histogramTooltipDiv = d3.select("#histogramMouseover")

var detachedContainer = document.createElement("custom");
var dataContainer = d3.select(detachedContainer);

var col = {
    "PLAYER_ID" : 0,
    "TEAM_ID" : 1,
    "PERIOD" : 2,
    "ACTION_TYPE" : 3,
    "SHOT_TYPE" : 4,
    "SHOT_DISTANCE" : 5,
    "LOC_X" : 6,
    "LOC_Y" : 7,
    "SHOT_MADE_FLAG" : 8,
    "SEASON" : 9,
    "TOTAL_REMAINING_IN_GAME" : 10
}
// https://secure.espn.com/combiner/i?img=/i/teamlogos/nba/500/bos.png
// https://secure.espn.com/combiner/i?img=/i/teamlogos/nba/500/lal.png
var idToTeams = {55: 'PHI', 38: 'BOS', 44: 'GSW', 60: 'OKC', 49: 'MIL', 66: 'CHA', 51: 'BKN', 65: 'DET', 54: 'IND', 63: 'MEM', 48: 'MIA', 53: 'ORL', 37: 'ATL', 52: 'NYK', 61: 'TOR', 39: 'CLE', 40: 'NOP', 45: 'HOU', 59: 'SAS', 50: 'MIN', 58: 'SAC', 62: 'UTA', 46: 'LAC', 43: 'DEN', 42: 'DAL', 56: 'PHX', 41: 'CHI', 64: 'WAS', 47: 'LAL', 57: 'POR'}
var teamsToIds = {'PHI': 55, 'BOS': 38, 'GSW': 44, 'OKC': 60, 'MIL': 49, 'CHA': 66, 'BKN': 51, 'DET': 65, 'IND': 54, 'MEM': 63, 'MIA': 48, 'ORL': 53, 'ATL': 37, 'NYK': 52, 'TOR': 61, 'CLE': 39, 'NOP': 40, 'HOU': 45, 'SAS': 59, 'MIN': 50, 'SAC': 58, 'UTA': 62, 'LAC': 46, 'DEN': 43, 'DAL': 42, 'PHX': 56, 'CHI': 41, 'WAS': 64, 'LAL': 47, 'POR': 57}

const emptySquares = function() {return new Array(resolution).fill(0).map(() => new Array(resolution).fill(0))}
const emptyHist = function() {return new Array(35).fill(0);}

var rows = undefined;

var attempts = {
    raster : emptySquares(),
    hist : emptyHist(),
    unit : "Shots",
    format : d3.format(",")
}

var pts = {
    raster : emptySquares(),
    hist : emptyHist(),
    unit : "Points",
    format : d3.format(",")
}

var ratio = {
    raster : emptySquares(),
    hist : emptyHist(),
    unit : "Shooting Percentage",
    format : d3.format(".3f")
}

var chosenStat = attempts;

//----------------------------------------------------------------------------------------------------------------------
// Utils
//----------------------------------------------------------------------------------------------------------------------

// copied from http://bl.ocks.org/joshcarr/e447e5c953671a4729d8
var requestAnim = window.requestAnimationFrame
|| window.webkitRequestAnimationFrame
|| window.mozRequestAnimationFrame
|| window.oRequestAnimationFrame
|| window.msRequestAnimationFrame
|| function(callback) { setTimeout(callback, 17); };

//----------------------------------------------------------------------------------------------------------------------
// setup scales etc.
//----------------------------------------------------------------------------------------------------------------------
const pyRange = (start, stop, step = 1) =>
  Array(Math.ceil((stop - start) / step)).fill(start).map((x, y) => x + y * step)
var scaleX = d3.scaleQuantize()
    .domain([-250, 250])
    .range([...Array(resolution).keys()])

var scaleXLinear = d3.scaleLinear()
    .domain([-250, 250])
    .range([0, heatmapSize.width])
    // .range(pyRange(0, 800, 10))

var scaleY = d3.scaleQuantize()
    .domain([-50, 450])
    .range([...Array(resolution).keys()])
    // .range(pyRange(0, 800, 10))

var scaleYLinear = d3.scaleLinear()
    .domain([-50, 450])
    .range([0, heatmapSize.height])

var scaleHeatmap = d3.scaleQuantile()
    .range(d3.interpolateBlues)

var histX = d3.scaleLinear()
    .range([0, histogramSize.width])
    .domain([0, 35])

distanceBins = d3.bin().domain(histX.domain()).thresholds(35)([])

var histY = d3.scaleLinear()
    .range([histogramSize.height, 0])


//----------------------------------------------------------------------------------------------------------------------
// Setup Radial Rings
//----------------------------------------------------------------------------------------------------------------------


let hoopX = scaleXLinear(0)
let hoopY = scaleYLinear(0)
let oneFootInPx = heatmapSize.width / 50

svgRaw.append("defs").append("mask").attr("id", "courtMask").append("rect").attr("width", heatmapSize.width).attr("height", heatmapSize.height).attr("x", -hoopX).attr("y", -hoopY).attr("fill", "white")
courtRadialOverlayG.attr("transform", "translate(" + hoopX + "," + hoopY + ")")

for(i = 0; i < 35; i++) {
    let r0 = (i + 1) * oneFootInPx;
    let r1 = i * oneFootInPx;

    courtRadialOverlayG.append("path")
        .attr("id", "radius_" + i)
        .attr("d", () => {
            return `M ${-r0}, 0 a ${r0},${r0} 0 1,0 ${r0 * 2},0 a ${r0},${r0} 0 1,0 ${- r0 * 2},0 z
                    M ${-r1}, 0 a ${r1},${r1} 0 1,0 ${r1 * 2},0 a ${r1},${r1} 0 1,0 ${- r1 * 2},0 z`
        })
        .attr("fill-rule", "evenodd")
        .attr("mask", "url(#courtMask)")
        .attr("fill", "rgba(255, 255, 255, 0.3)")
        .attr("opacity", 0)
}

//----------------------------------------------------------------------------------------------------------------------
// Parse new data
//----------------------------------------------------------------------------------------------------------------------

function processSlice(slice, filter) {
    context.fillStyle = "rgba(255, 0, 0, 1)";
    slice.forEach(d => {

        context.beginPath();
        context.rect(scaleXLinear(d[col.LOC_X]), scaleYLinear(d[col.LOC_Y]), 1, 1);
        context.fill();
        context.closePath();

        let x = scaleX(d[col.LOC_X]);
        let y = scaleY(d[col.LOC_Y]);
        attempts.raster[y][x] += 1;
        pts.raster[y][x] += d[col.SHOT_MADE_FLAG];
        let dist = Math.floor(d[col.SHOT_DISTANCE]);
        if (dist < 35) {
            attempts.hist[dist] += 1;
            pts.hist[dist] += d[col.SHOT_MADE_FLAG];
        }
    });
    ratio.raster = ratio.raster.map((row, rowI) => row.map((el, colI) => attempts.raster[rowI][colI] != 0 ? pts.raster[rowI][colI] / attempts.raster[rowI][colI] : 0))
    blurRatioRaster()
    ratio.hist = ratio.hist.map((_, i) => pts.hist[i] / attempts.hist[i])
}

const gaussianMatrix5 = [
    [0.003765,0.015019,0.023792,0.015019,0.003765],
    [0.015019,0.059912,0.094907,0.059912,0.015019],
    [0.023792,0.094907,0.150342,0.094907,0.023792],
    [0.015019,0.059912,0.094907,0.059912,0.015019],
    [0.003765,0.015019,0.023792,0.015019,0.003765]
]

function blurRatioRaster() {
    tmpRaster = emptySquares()
    const w = 5;
    let tmp = Array(w * w).fill(0)
    for(let x = 0; x < resolution; x ++) {
        for(let y = 0; y < resolution; y++) {
            let runningTotal = 0;
            for (let xx = - (w - 1) / 2; xx < (w - 1) / 2; xx++) {
                for (let yy = - (w - 1) / 2; yy < (w - 1) / 2; yy++) {
                    let thisGaussian = gaussianMatrix5[2 + xx][2 + yy]
                    let thisVal = outsideRaster(x + xx, y + yy) ? 0 : ratio.raster[x + xx][y + yy]
                    runningTotal += thisGaussian * thisVal;
                }
            }
            tmpRaster[x][y] = runningTotal / (w * w)
        }
    }
    ratio.raster = tmpRaster;
}

function ready(compiled) {
    headers = compiled.slice(0, compiled.indexOf("\n"))
    console.log(headers)
    compiled = compiled.slice(compiled.indexOf("\n") + 1)
    compiled = compiled.split("\n")
    compiled.pop()
    rows = compiled.map((el) => {return el.split(',').map(d => +d)})
    console.log(rows)

    d3.select("#initial-loading").transition().duration(2000).style("opacity", 0)
    svgRaw.transition().duration(2000).style("opacity", 1)
    bkSVG.transition().duration(2000).style("opacity", 1)


    let histXAxis = d3.axisBottom(histX)
        .tickValues([0, 5, 10, 15, 20, 25, 30, 35])
    histXAxisG.call(histXAxis);

    drawLoop();    

    // var dataBinding = dataContainer.selectAll("custom.rect")
    //     .data(rows)

    //     dataBinding.enter()
    //     .append("custom")
    //     .filter((d) => {
    //         return d[col.SEASON] == 2011;
    //     })
    //     .classed("rect", true)
    //     .attr("x", (d) => scaleX(d[col.LOC_X]))
    //     .attr("y", (d) => scaleY(d[col.LOC_Y]))
    //     .attr("size", 8)
    //     .attr("fillStyle", (d) => {if(d[col.SHOT_MADE_FLAG]){
    //         return "rgba(0, 255, 0, 0.02)"
    //     } else {
    //         return "rgba(255, 0, 0, 0.02)"
    //     }});
    
    // drawCanvas()
}

var currentIndex = 0;
function drawLoop(){
    processSlice(rows.slice(currentIndex, currentIndex + sliceSize));
    currentIndex += sliceSize;

    drawProgressBar()

    drawCourt(chosenStat);

    drawHistogram(chosenStat)
    
    requestAnim(drawLoop);
}

//----------------------------------------------------------------------------------------------------------------------
// SVG bits
//----------------------------------------------------------------------------------------------------------------------

function drawCourt(stat) {
    let raster = stat.raster;
    scaleHeatmap = d3.scaleSequentialQuantile(raster.flat(), d3.interpolateBlues)
    courtG.selectAll("rect")
        .data(raster.flat())
        .join("rect")
        .attr("x", (d, i) => (i % resolution) * boxWidth + boxMargin)
        .attr("y", (d, i) => Math.floor(i / resolution) * boxWidth + boxMargin)
        .attr("width", boxInnerWidth)
        .attr("height", boxInnerWidth)
        .attr("fill", (d) => scaleHeatmap(d))

}

function drawHistogram(stat) {
    hist = stat.hist;
    histY = histY.domain([0,d3.max(hist)])
    histBarsG.selectAll("rect")
        .data(hist)
        .join(
            enter => enter.append("rect")
                .attr("fill", "lightblue")
                .on("mouseover", handleHistogramMouseover)
                .on("mouseout", handleHistogramMouseout),
            update => update
                .attr("x", (d, i) => i * histogramBarWidth)
                .attr("y", (d, i) => histY(d))
                .attr("width", histogramBarWidth)
                .attr("height", (d, i) => histY(0) - histY(d))
        )
        
    let histYAxis = d3.axisLeft(histY)
        .ticks(15)
    histYAxisG.call(histYAxis);


}

function drawProgressBar() {
    if(currentIndex > rows.length) {
        progressBarG.attr("visibility", "hidden")
    } else {
        progressBarG.attr("visibility", "visible")
        progressBarG.selectAll("rect")
            .data([currentIndex])
            .join("rect")
            .attr("y", height - 5)
            .attr("x", 0)
            .attr("width", (d) => (d / rows.length) * height)
            .attr("height", 5)
            .attr("fill", "darkblue")
    }
}


//----------------------------------------------------------------------------------------------------------------------
// Event handlers
//----------------------------------------------------------------------------------------------------------------------

var lastActiveRing = 0

function handleHistogramMouseover(event, d, i) {
    let unit = chosenStat.unit;
    let format = chosenStat.format;
    let dist = Math.floor((event.x - histogramPosition.x - 10 )/histogramBarWidth)
    histogramTooltipDiv
        .style("left", event.x + "px")
        .style("top", event.y + "px") 
        .text(`${format(d)} ${unit} From ${dist}'`)
        .transition()
        .duration(200)
        .style("opacity", 1)
    
    d3.select(event.currentTarget)
        .attr("fill", "darkblue")

    d3.select("#radius_" + dist)
        .attr("opacity", 1)
    lastActiveRing = dist
}

function handleHistogramMouseout(event, d) {
    d3.select(event.currentTarget)
        .attr("fill", "lightblue")
        
    histogramTooltipDiv
        .transition()
        .duration(500)
        .style("opacity", 0)

    d3.select("#radius_" + lastActiveRing)
        .attr("opacity", 0)
    
}

//----------------------------------------------------------------------------------------------------------------------
// Canvas Utils
//----------------------------------------------------------------------------------------------------------------------
function clearCanvas() {
    // clear canvas
    context.fillStyle = "rgba(255, 255, 255, 0)";
    // context.fillStyle = "#fff";
    context.rect(0,0,chart.attr("width"),chart.attr("height"));
    context.fill();
}

function drawCanvas() {

}



//----------------------------------------------------------------------------------------------------------------------
// Utils Utils
//----------------------------------------------------------------------------------------------------------------------

function outsideRaster(x, y) {
    if (x < 0 || x >= resolution || y < 0 || y >= resolution) {
        return true
    } else {
        return false
    }
}

//----------------------------------------------------------------------------------------------------------------------
// start
//----------------------------------------------------------------------------------------------------------------------
clearCanvas();

d3.text("./compiled.csv").then(ready);
// d3.text("./head.csv").then(ready);
 