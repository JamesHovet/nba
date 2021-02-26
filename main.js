var width = 1200;
var height = 800;

var resolution = 80;
var boxWidth = (height / resolution)
var boxMargin = 0.0;
var boxInnerWidth = boxWidth - 2 * boxMargin;

var histogramPosition = {x : 820, y: 780}
var histogramSize = {width: 360, height : 250 }
var histogramBarWidth = histogramSize.width / 35

var sliceSize = 50000;

var chart = d3.select("canvas");
chart.attr("width", width)
    .attr("height", height)
var context = chart.node().getContext("2d");
var svgRaw = d3.select("svg")
    .attr("width", width)
    .attr("height", height)

var svg = svgRaw.append("g")

var courtG = svg.append("g").attr("id", "court");
var histG = svg.append("g").attr("id", "hist").attr("transform", `translate(${histogramPosition.x}, ${histogramPosition.y - histogramSize.height})`);
var progressBarG = svg.append("g").attr("id", "progressBar");

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

var idToTeams = {55: 'PHI', 38: 'BOS', 44: 'GSW', 60: 'OKC', 49: 'MIL', 66: 'CHA', 51: 'BKN', 65: 'DET', 54: 'IND', 63: 'MEM', 48: 'MIA', 53: 'ORL', 37: 'ATL', 52: 'NYK', 61: 'TOR', 39: 'CLE', 40: 'NOP', 45: 'HOU', 59: 'SAS', 50: 'MIN', 58: 'SAC', 62: 'UTA', 46: 'LAC', 43: 'DEN', 42: 'DAL', 56: 'PHX', 41: 'CHI', 64: 'WAS', 47: 'LAL', 57: 'POR'}
var teamsToIds = {'PHI': 55, 'BOS': 38, 'GSW': 44, 'OKC': 60, 'MIL': 49, 'CHA': 66, 'BKN': 51, 'DET': 65, 'IND': 54, 'MEM': 63, 'MIA': 48, 'ORL': 53, 'ATL': 37, 'NYK': 52, 'TOR': 61, 'CLE': 39, 'NOP': 40, 'HOU': 45, 'SAS': 59, 'MIN': 50, 'SAC': 58, 'UTA': 62, 'LAC': 46, 'DEN': 43, 'DAL': 42, 'PHX': 56, 'CHI': 41, 'WAS': 64, 'LAL': 47, 'POR': 57}

const emptySquares = function() {return new Array(resolution).fill(0).map(() => new Array(resolution).fill(0))}
const emptyHist = function() {return new Array(35).fill(0);}

var rows = undefined;

var attempts = {
    raster : emptySquares(),
    hist : emptyHist()
}

var pts = {
    raster : emptySquares(),
    hist : emptyHist()
}

var ratio = {
    raster : emptySquares(),
    hist : emptyHist()
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
    // .range(pyRange(0, 800, 10))

var scaleY = d3.scaleQuantize()
    .domain([-50, 450])
    .range([...Array(resolution).keys()])
    // .range(pyRange(0, 800, 10))

var scaleHeatmap = d3.scaleQuantile()
    .range(d3.interpolateBlues)

distanceBins = d3.bin().domain([0, 35]).thresholds(35)([])

var histY = d3.scaleLinear()
    .range([0, histogramSize.height])

//----------------------------------------------------------------------------------------------------------------------
// Parse new data
//----------------------------------------------------------------------------------------------------------------------

function processSlice(slice, filter) {
    slice.forEach(d => {
        let x = scaleX(d[col.LOC_X]);
        let y = scaleY(d[col.LOC_Y]);
        attempts.raster[y][x] += 1;
        pts.raster[y][x] += d[col.SHOT_MADE_FLAG];
        let dist = Math.min(Math.floor(d[col.SHOT_DISTANCE]),34);
        attempts.hist[dist] += 1;
        pts.hist[dist] += d[col.SHOT_MADE_FLAG];
    });
    ratio.raster = ratio.raster.map((row, rowI) => row.map((el, colI) => pts.raster[rowI][colI] / attempts.raster[rowI][colI]))
    ratio.hist = ratio.hist.map((_, i) => pts.hist[i] / attempts.hist[i])
}

function ready(compiled) {
    headers = compiled.slice(0, compiled.indexOf("\n"))
    console.log(headers)
    compiled = compiled.slice(compiled.indexOf("\n") + 1)
    compiled = compiled.split("\n")
    compiled.pop()
    rows = compiled.map((el) => {return el.split(',').map(d => +d)})
    console.log(rows)

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
    histY = histY.domain(d3.extent(hist))
    histG.selectAll("rect")
        .data(hist)
        .join("rect")
        .attr("x", (d, i) => i * histogramBarWidth)
        .attr("y", (d, i) => histogramSize.height - histY(d))
        .attr("width", histogramBarWidth)
        .attr("height", (d, i) => histY(d))
        .attr("fill", "lightblue")

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
// Canvas Utils
//----------------------------------------------------------------------------------------------------------------------
function clearCanvas() {
    // clear canvas
    context.fillStyle = "#fff";
    context.rect(0,0,chart.attr("width"),chart.attr("height"));
    context.fill();
}

function drawCanvas() {

}




//----------------------------------------------------------------------------------------------------------------------
// start
//----------------------------------------------------------------------------------------------------------------------
clearCanvas();

d3.text("./compiled.csv").then(ready);
// d3.text("./head.csv").then(ready);
 