var width = 700;
var height = 760;

var resolutionX = 80;
var resolutionY = 56;

function setResolutionFactor(factor) {
    resolutionX = Math.floor(80 * factor);
    resolutionY = Math.floor(56 * factor);
}

var heatmapSize = { width: 700, height: (700) * (350 / 500)}

var boxWidth = heatmapSize.width / resolutionX
var boxHeight = heatmapSize.height / resolutionY

var heatmapScaleSize = { width : heatmapSize.width , height: 50}
var heatmapScalePosition = { x : 0, y: 515}

var histogramPosition = {x : 60, y: 720}
var histogramSize = {width: 640, height : 150 }
var histogramBarWidth = histogramSize.width / 35

var courtYDomain = [-50, 300]

var sliceSize = 25000;

var ratioCutoff = 50;
var ratioOpacity = 0.1;
var numQuantiles = 13;

var mode = "heatmap"

var drawingTd = d3.select("#drawing-td")
    .attr("width", width)
    .attr("height", height)

var attemptsCanvas = d3.select("#canvas-attempts")
    .attr("width", heatmapSize.width)
    .attr("height", heatmapSize.height)
var attemptsContext = attemptsCanvas.node().getContext("2d");
var ptsCanvas = d3.select("#canvas-pts")
    .attr("width", heatmapSize.width)
    .attr("height", heatmapSize.height)
var ptsContext = ptsCanvas.node().getContext("2d");
var ratioCanvas = d3.select("#canvas-ratio")
    .attr("width", heatmapSize.width)
    .attr("height", heatmapSize.height)
var ratioContext = ratioCanvas.node().getContext("2d");

var svgRaw = d3.select("svg")
    .attr("width", width)
    .attr("height", height)
var bkSVG = d3.select("#bk-svg")
    .attr("width", heatmapSize.width)

var svg = svgRaw.append("g")

var courtG = svg.append("g").attr("id", "court");
var courtRadialOverlayG = svg.append("g").attr("id", "overlay")
var heatmapScaleRootG = svg.append("g").attr("transform", `translate(${heatmapScalePosition.x}, ${heatmapScalePosition.y})`)
var heatmapScaleLabel = heatmapScaleRootG.append("g").attr("transform", `translate(${heatmapScaleSize.width / 2}, ${-8})`).append("text").attr("text-anchor", "middle")
var heatmapScaleG = heatmapScaleRootG.append("g")
var heatmapScaleNoDataG = heatmapScaleRootG.append("g").attr("transform", "translate(" + (heatmapScaleSize.width - 75) + ",0)")
heatmapScaleNoDataG.append("rect").attr("id", "noData").attr("width", heatmapScaleSize.width / (numQuantiles + 1)).attr("height", 15).attr("fill", "grey").attr("stroke", "black")
var heatmapScaleNoDataGText = heatmapScaleNoDataG.append("text").attr("class", "legend_text").text("n < " + ratioCutoff).attr("transform", "translate(15, 25) rotate(20)")
var discreteLegendRootG = svg.append("g").attr("transform", `translate(${heatmapScalePosition.x}, ${heatmapScalePosition.y})`).style("opacity", 0);
var discreteLegendG = discreteLegendRootG.append("g");
var discreteLegendNoDataG = discreteLegendRootG.append("g").attr("transform", "translate(" + (heatmapScaleSize.width - 75) + ",0)")
discreteLegendNoDataG.append("rect").attr("id", "noData").attr("width", heatmapScaleSize.width / (numQuantiles + 1)).attr("height", 15).attr("fill", "grey").attr("stroke", "black")
var discreteLegendNoDataGText = discreteLegendNoDataG.append("text").attr("class", "legend_text").text("n < " + ratioCutoff).attr("transform", "translate(15, 25) rotate(20)")
var histG = svg.append("g").attr("id", "hist").attr("transform", `translate(${histogramPosition.x}, ${histogramPosition.y - histogramSize.height})`);
var histBarsG = histG.append("g")
var histYAxisG = histG.append("g").attr("transform", `translate(0, ${0})`)
var histYAxisLabel = histG.append("text").attr("transform", `translate(${-40}, ${histogramSize.height / 2}) rotate(-90)`).attr("text-anchor", "middle").text("hist y")
var histXAxisG = histG.append("g").attr("transform", `translate(0, ${histogramSize.height})`)
var histXAxisLabel = histG.append("text").attr("transform", `translate(${histogramSize.width / 2}, ${histogramSize.height + 30})`).attr("text-anchor", "middle").text("Distance")
var progressBarG = svg.append("g").attr("id", "progressBar");


var histogramTooltipDiv = d3.select("#histogramMouseover")
var courtTooltipDiv = d3.select("#courtMouseover")

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
var actionIdToString = { "0": "Layup Shot", "1": "Pullup Jump shot", "2": "Step Back Jump shot", "3": "Driving Layup Shot", "4": "Jump Shot", "5": "Reverse Layup Shot", "6": "Alley Oop Dunk Shot", "8": "Driving Dunk Shot", "9": "Turnaround Jump Shot", "10": "Running Jump Shot", "11": "Turnaround Fadeaway shot", "12": "Hook Shot", "14": "Dunk Shot", "16": "Fadeaway Jump Shot", "17": "Floating Jump shot", "19": "Tip Shot", "21": "Putback Layup Shot", "22": "Turnaround Hook Shot", "23": "Driving Reverse Layup Shot", "24": "Jump Bank Shot", "25": "Running Layup Shot", "28": "Driving Finger Roll Layup Shot", "50": "Driving Floating Jump Shot", "53": "Cutting Layup Shot", "54": "Tip Layup Shot", "56": "Cutting Dunk Shot", "-1": "Other"}
var actionStringToId = { "Layup Shot": "0", "Pullup Jump shot": "1", "Step Back Jump shot": "2", "Driving Layup Shot": "3", "Jump Shot": "4", "Reverse Layup Shot": "5", "Alley Oop Dunk Shot": "6", "Driving Dunk Shot": "8", "Turnaround Jump Shot": "9", "Running Jump Shot": "10", "Turnaround Fadeaway shot": "11", "Hook Shot": "12", "Dunk Shot": "14", "Fadeaway Jump Shot": "16", "Floating Jump shot": "17", "Tip Shot": "19", "Putback Layup Shot": "21", "Turnaround Hook Shot": "22", "Driving Reverse Layup Shot": "23", "Jump Bank Shot": "24", "Running Layup Shot": "25", "Driving Finger Roll Layup Shot": "28", "Driving Floating Jump Shot": "50", "Cutting Layup Shot": "53", "Tip Layup Shot": "54", "Cutting Dunk Shot": "56", "Other": "-1"}

var emptySquares = function() {return new Array(resolutionY).fill(0).map(() => new Array(resolutionX).fill(0))}
var emptyHist = function() {return new Array(35).fill(0);}

var rows = undefined;
var filtered = undefined;
var numProcessed = 0;

var attempts = {
    raster : emptySquares(),
    hist : emptyHist(),
    unit : "Shots Taken",
    format : d3.format(","),
    name: "Shots Taken",
    canvas : d3.select("#canvas-attempts"),
    discreteLegendData : [{"color" : "blue", "name": "Shot Taken"}]
}

var pts = {
    raster : emptySquares(),
    hist : emptyHist(),
    unit : "Shots Made",
    format : d3.format(","),
    name: "Shots Made",
    canvas : d3.select("#canvas-pts"),
    discreteLegendData : [{"color" : "blue", "name": "Shot Made"}]

}

var ratio = {
    raster : emptySquares(),
    hist : emptyHist(),
    unit : "Shooting Percentage",
    format : d3.format(".3f"),
    name : "Shooting Percentage",
    canvas : d3.select("#canvas-ratio"),
    discreteLegendData : [{"color" : "blue", "name": "Shot Made"}, {"color" : "red", "name": "Shot Missed"}]

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
    .range([...Array(resolutionX).keys()])

var scaleXLinear = d3.scaleLinear()
    .domain([-250, 250])
    .range([0, heatmapSize.width])
    // .range(pyRange(0, 800, 10))

var scaleY = d3.scaleQuantize()
    .domain(courtYDomain)
    .range([...Array(resolutionY).keys()])
    // .range(pyRange(0, 800, 10))

var scaleYLinear = d3.scaleLinear()
    .domain(courtYDomain)
    .range([0, heatmapSize.height])

var quantiles;
var scaleHeatmap;

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
        .attr("class", "radius_ring")
        .attr("d", () => {
            return `M ${-r0}, 0 a ${r0},${r0} 0 1,0 ${r0 * 2},0 a ${r0},${r0} 0 1,0 ${- r0 * 2},0 z
                    M ${-r1}, 0 a ${r1},${r1} 0 1,0 ${r1 * 2},0 a ${r1},${r1} 0 1,0 ${- r1 * 2},0 z`
        })
        .attr("fill-rule", "evenodd")
        .attr("mask", "url(#courtMask)")
        .attr("fill", "rgba(255, 255, 255, 0.5)")
        .attr("opacity", 0)
}

//----------------------------------------------------------------------------------------------------------------------
// Filter
//----------------------------------------------------------------------------------------------------------------------

var filterIsUpToDate = true;

var filterCurrentPlayer = null;
var filterCurrentTeam = null;
var filterSeasonLow = 2010;
var filterSeasonHigh = 2020; // python style intervals

var filterFunc = (d) => {
    // return d[col.SEASON] == 2019;
    // return d[col.TEAM_ID] == 38;
    // return d[col.PLAYER_ID] == 2544; // lebron
    // return d[col.PLAYER_ID] == 201939; // curry
    // return d[col.ACTION_TYPE] == actionStringToId["Layup Shot"];
    return true;
}

function makeFilter() {
    // TODO: if there's really nothing left, fix the behavior where you change a filter item, then change it back, but the filter is still invalid to the app
    let allowedShotTypes = actionTypeTagEditor.tagEditor('getTags')[0].tags.map((str) => +actionStringToId[str]);
    return function(d) {
        if (filterCurrentPlayer != null && d[col.PLAYER_ID] != filterCurrentPlayer){
            return false;
        }
        if(filterCurrentTeam != null && d[col.TEAM_ID] != filterCurrentTeam){
            return false;
        }
        if(d[col.SEASON] < filterSeasonLow || d[col.SEASON] >= filterSeasonHigh){
            return false;
        }

        if (allowedShotTypes.length != 0 && !allowedShotTypes.includes(d[col.ACTION_TYPE])){
            return false
        }
        return true;
    }
}

function invalidateFilter(){
    filterIsUpToDate = false;
    $('#apply-filters').removeClass('btn-outline-danger').addClass('btn-danger').blur()
}

function clearPlayer(){
    filterCurrentPlayer = null;
    $('#clear-player').attr("hidden", true)
    $("#player-img").attr("src", "").attr("width", 0);
    player_search_typeahead.typeahead('val', '');
    invalidateFilter();
}

function clearTeam(){
    filterCurrentTeam = null;
    $('#clear-team').attr("hidden", true)
    $("#team-img").attr("src", "").attr("width", 0);
    team_search_typeahead.typeahead('val', '');
    invalidateFilter();
}


//----------------------------------------------------------------------------------------------------------------------
// Parse new data
//----------------------------------------------------------------------------------------------------------------------
var numPassedFilter = 0;
let jitterStrength = 3;
let halfJitterStrength = jitterStrength / 2;
function processSlice(slice, filter) {
    let shotMadeColor = `rgba(0, 0, 255, ${ratioOpacity})`
    let shotMissedColor = `rgba(255, 0, 0, ${ratioOpacity})`
    attemptsContext.fillStyle = shotMadeColor;
    ptsContext.fillStyle = shotMadeColor;
    slice.forEach(d => {
        let canvasX = scaleXLinear(d[col.LOC_X] + (Math.random() * jitterStrength) - halfJitterStrength)
        let canvasY = scaleYLinear(d[col.LOC_Y] + (Math.random() * jitterStrength) - halfJitterStrength)
        if (d[col.LOC_Y] < courtYDomain[1]) {
            attemptsContext.beginPath();
            attemptsContext.rect(canvasX, canvasY, 1, 1);
            attemptsContext.fill();
            attemptsContext.closePath();

            if(d[col.SHOT_MADE_FLAG]){
                ptsContext.beginPath();
                ptsContext.rect(canvasX, canvasY, 1, 1);
                ptsContext.fill();
                ptsContext.closePath();
            }

            ratioContext.fillStyle = d[col.SHOT_MADE_FLAG] ?  shotMadeColor : shotMissedColor ;
            ratioContext.beginPath();
            ratioContext.rect(canvasX, canvasY, 1, 1);
            ratioContext.fill();
            ratioContext.closePath();

            let x = scaleX(d[col.LOC_X]);
            let y = scaleY(d[col.LOC_Y]);
            attempts.raster[y][x] += 1;
            pts.raster[y][x] += d[col.SHOT_MADE_FLAG];
        }

        let dist = Math.floor(d[col.SHOT_DISTANCE]);
        if (dist < 35) {
            attempts.hist[dist] += 1;
            pts.hist[dist] += d[col.SHOT_MADE_FLAG];
        }

    })
    numProcessed += slice.length;
    ratio.raster = ratio.raster.map((row, rowI) => row.map((el, colI) => attempts.raster[rowI][colI] != 0 ? pts.raster[rowI][colI] / attempts.raster[rowI][colI] : 0))
    blurRaster(ratio);
    ratio.hist = ratio.hist.map((_, i) => pts.hist[i] / attempts.hist[i])
}

const gaussianMatrix5 = [
    [0.003765,0.015019,0.023792,0.015019,0.003765],
    [0.015019,0.059912,0.094907,0.059912,0.015019],
    [0.023792,0.094907,0.150342,0.094907,0.023792],
    [0.015019,0.059912,0.094907,0.059912,0.015019],
    [0.003765,0.015019,0.023792,0.015019,0.003765]
]

function blurRaster(stat) {
    tmpRaster = emptySquares()
    const w = 5;
    let tmp = Array(w * w).fill(0)
    for(let x = 0; x < resolutionX; x ++) {
        for(let y = 0; y < resolutionY; y++) {
            let runningTotal = 0;
            for (let xx = - (w - 1) / 2; xx < (w - 1) / 2; xx++) {
                for (let yy = - (w - 1) / 2; yy < (w - 1) / 2; yy++) {
                    let thisGaussian = gaussianMatrix5[2 + xx][2 + yy]
                    let thisVal = outsideRaster(x + xx, y + yy) ? 0 : stat.raster[y + yy][x + xx]
                    runningTotal += thisGaussian * thisVal;
                }
            }
            tmpRaster[y][x] = runningTotal
        }
    }
    stat.raster = tmpRaster;
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

    initializeTagEditor();
    initializeTypeaheads();
    initializeSliders();

    let histXAxis = d3.axisBottom(histX)
        .tickValues([0, 5, 10, 15, 20, 25, 30, 35])
    histXAxisG.call(histXAxis);


    invalidate();
    drawLoop();    
}

function invalidate() {
    currentIndex = 0
    numProcessed = 0;
    filtered = rows.filter(filterFunc);
    numPassedFilter = filtered.length;
    emptySquares = function() {return new Array(resolutionY).fill(0).map(() => new Array(resolutionX).fill(0))}
    emptyHist = function() {return new Array(35).fill(0);}
    scaleX.range([...Array(resolutionX).keys()])
    scaleY.range([...Array(resolutionY).keys()])
    boxWidth = heatmapSize.width / resolutionX
    boxHeight = heatmapSize.height / resolutionY
    attempts.raster = emptySquares();
    attempts.hist = emptyHist();
    pts.raster = emptySquares();
    pts.hist = emptyHist();
    ratio.raster = emptySquares();
    ratio.hist = emptyHist();
    clearCanvas()
    histBarsG.selectAll('rect')
        .transition()
        .duration(100)
        .attr("height", 0)
        .attr("y", histY(0))
    courtG.selectAll("rect").attr("fill", "white")
}

function changeDisplayedStat(newStat) {
    chosenStat = newStat;
    drawCourt(chosenStat);
    drawLegends(chosenStat)
    drawHistogram(chosenStat)
    d3.selectAll('canvas').style("opacity", 0)
    chosenStat.canvas.style("opacity", 1)
}

var currentIndex = 0;
function drawLoop(){
    if (currentIndex < numPassedFilter) {
        processSlice(filtered.slice(currentIndex, currentIndex + sliceSize));
        currentIndex += sliceSize;

        drawProgressBar()

        drawCourt(chosenStat);

        drawLegends(chosenStat);

        drawHistogram(chosenStat)

        $('#num-passed-filter-span').text(d3.format(',')(numProcessed))
    }
   
    requestAnim(drawLoop);
}

//----------------------------------------------------------------------------------------------------------------------
// SVG bits
//----------------------------------------------------------------------------------------------------------------------

function drawCourt(stat) {
    let raster = stat.raster;
    let attemptsRasterFlat = attempts.raster.flat();
    if (chosenStat == ratio) {
        quantiles = d3.scaleSequentialQuantile().domain(raster.flat().filter((d, i) => attemptsRasterFlat[i] > ratioCutoff)).quantiles(numQuantiles)
        scaleHeatmap = d3.scaleQuantize().domain([0.25, 0.4]).range(pyRange(0, 1, 1 / numQuantiles).map(d3.interpolateBlues))
    } else {
        quantiles = d3.scaleSequentialQuantile().domain(raster.flat().filter((d, i) => d != 0)).quantiles(numQuantiles)
        scaleHeatmap = d3.scaleSequentialQuantile(quantiles, d3.interpolateBlues);
    }
    courtG.selectAll("rect")
        .data(raster.flat().map((d, i) => {return {"val" : d, "index" : i};}))
        .join(
            enter => enter.append("rect")
                .on("mouseover", handleCourtSquareMousover)
                .on("mouseout", handleCourtSquareMouseout),
            update => update
                .attr("x", (d, i) => (i % resolutionX) * boxWidth )
                .attr("y", (d, i) => Math.floor(i / resolutionX) * boxHeight )
                .attr("width", boxWidth)
                .attr("height", boxHeight)
                .call(update => update
                    .transition()
                    .duration(500)
                    .attr("fill", (d, i) => { 
                        if (chosenStat == ratio && attemptsRasterFlat[i] < ratioCutoff) {
                        // if (true) {
                            return "grey";
                        } else if (chosenStat != ratio && d.val == 0) {
                            return "rgb(247, 251, 255)"
                        } else {
                            return scaleHeatmap(d.val);
                        }
                    })))
 
}

function drawLegends(stat) {
    heatmapScaleLabel.text(chosenStat.name);
    histYAxisLabel.text(chosenStat.name);
    let widthAdjust = chosenStat == ratio ? -100 : 0
    
    let data;
    let range;
    if(chosenStat == ratio) {
        range = scaleHeatmap.domain()
        data = pyRange(range[0], range[1], (range[1] - range[0]) / (numQuantiles - 1))
        data = data.map((el) => el + ((range[1] - range[0]) / numQuantiles))
        // data.push(range[1])
    } else {
        data = quantiles;
    }

    heatmapScaleG.selectAll("rect")
        .data(data)
        .join(
            enter => enter.append("rect")
                .attr("height", 15)
                .attr("y", 0)
                .attr("stroke", "black"),
            update =>  update
                .attr("x", (d, i) => (i) * (heatmapScaleSize.width + widthAdjust) / data.length)
                .attr("width", (heatmapScaleSize.width + widthAdjust) / data.length)
                // .attr("fill", (d, i) => scaleHeatmap.range()[data.length - i - 1])
                .attr("fill", (d, i) => scaleHeatmap.range()[i])
                .select("text")
        )


    heatmapScaleG.selectAll("text")
        .data(data)
        .join(
            enter => enter.append("text")
                .attr("class", "legend_text"),
            update => update
                .attr("transform", (d, i) => `translate(${(i * (heatmapScaleSize.width + widthAdjust) / data.length) + 10}, 25) rotate(50)`)
                .text((d, i) => {
                    if(chosenStat == ratio) {
                        return d3.format(",.3r")(isNaN(data[i - 1]) ? .25 : data[i - 1]).substring(1)
                        + "-"  
                        + d3.format(",.3r")(NaNToZero(data[i])).substring(1)
                    } else {
                        return d3.format(",.2r")(NaNToZero(data[i - 1]))
                        + "-"  
                        + d3.format(",.2r")(NaNToZero(data[i]))
                    }
                })
        )
    

    let discreteLegendData = chosenStat.discreteLegendData;
    discreteLegendG.selectAll("circle")
        .data(discreteLegendData)
        .join("circle")
        .attr("cx", (d, i) => (i + 1) * ((heatmapScaleSize.width) / (discreteLegendData.length + 1)))
        .attr("cy", 0)
        .attr("fill", (d) => d.color)
        .attr("r", 5)

    discreteLegendG.selectAll("text")
        .data(discreteLegendData)
        .join("text")
        .attr("x", (d, i) => (i + 1) * ((heatmapScaleSize.width) / (discreteLegendData.length + 1)))
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .text((d) => d.name);

    heatmapScaleNoDataG.attr("opacity", chosenStat == ratio ? 1 : 0)
    heatmapScaleNoDataGText.text("n < " + ratioCutoff);
    discreteLegendNoDataG.attr("opacity", chosenStat == ratio ? 1 : 0)
    discreteLegendNoDataGText.text("n < " + ratioCutoff);


}

function drawHistogram(stat) {
    if(numPassedFilter == 0){
        return;
    }
    hist = stat.hist;
    histY = histY.domain([0,d3.max(hist)])
    histBarsG.selectAll("rect")
        .data(hist)
        .join(
            enter => enter.append("rect")
                .on("mouseover", handleHistogramMouseover)
                .on("mouseout", handleHistogramMouseout),
            update => update
                .attr("x", (d, i) => i * histogramBarWidth)
                .attr("width", histogramBarWidth)
                .call(update => update.transition()
                    .duration(300)
                    .attr("height", (d, i) => isNaN(histY(0) - histY(d)) ? 0 : histY(0) - histY(d))
                    .attr("y", (d, i) => histY(d)))
                    .attr("fill", (d, i) => {
                        if(chosenStat == ratio && attempts.hist[i] < ratioCutoff) {
                            return "grey";
                        } else {
                            return "lightblue"
                        }
                    })
        )
        
    let histYAxis = d3.axisLeft(histY)
        .tickFormat(chosenStat == ratio ? d3.format(".3f") : d3.format("~s"))
        .ticks(15)
    histYAxisG.call(histYAxis);


}

function drawProgressBar() {
    if(numProcessed >= numPassedFilter) {
        progressBarG.attr("visibility", "hidden")
    } else {
        progressBarG.attr("visibility", "visible")
        progressBarG.selectAll("rect")
            .data([numProcessed])
            .join("rect")
            .attr("y", height - 5)
            .attr("x", 0)
            .attr("width", (d) => (d / numPassedFilter) * heatmapSize.width)
            .attr("height", 5)
            .attr("fill", "darkblue")
    }
}


//----------------------------------------------------------------------------------------------------------------------
// Event handlers
//----------------------------------------------------------------------------------------------------------------------

function applyFilters(){

    setResolutionFactor(0.8);
    ratioCutoff = 50;
    ratioOpacity = 0.1;

    if(filterSeasonHigh - filterSeasonLow < 5){
        setResolutionFactor(0.6);
        ratioOpacity = 0.2;
    }

    if (filterSeasonHigh - filterSeasonLow < 2){
        ratioCutoff = 35;
        setResolutionFactor(0.45);
        ratioOpacity = 0.4
    }

    if(filterCurrentTeam != null){
        ratioCutoff = 25;
        setResolutionFactor(0.35);
        ratioOpacity = 0.5;
    }

    if(filterCurrentPlayer != null){
        setResolutionFactor(0.2);
        ratioCutoff = 20;
        ratioOpacity = 1.0;
    }

    filterFunc = makeFilter();
    invalidate();
    filterIsUpToDate = true;
    $('#apply-filters').removeClass('btn-danger').addClass('btn-outline-danger').blur()
    $('clear-player').attr("hidden", true)
    $('clear-team').attr("hidden", true)
}

var lastActiveRing = 0
var barPriorColor = undefined;
function handleHistogramMouseover(event, d, i) {
    let unit = chosenStat.unit;
    let format = chosenStat.format;
    let dist = Math.floor((event.x - histogramPosition.x - 10 )/histogramBarWidth)
    histogramTooltipDiv
        .style("left", event.x + "px")
        .style("top", event.y + "px") 
        .text(() => {
            if(chosenStat != ratio) {
                return `${format(d)} ${unit} From ${dist}'`
            } else {
                return `${format(d)} ${unit} From ${dist}'; n = ${attempts.hist[dist]}`
            }
        })
        .transition()
        .duration(200)
        .style("opacity", 1)
    
    barPriorColor = d3.select(event.currentTarget).attr("fill")
    d3.select(event.currentTarget)
        .attr("fill", "darkblue")

    d3.select("#radius_" + dist)
        .attr("opacity", 1)
    lastActiveRing = dist
}

function handleHistogramMouseout(event, d) {
    d3.select(event.currentTarget)
        .attr("fill", barPriorColor)
        
    histogramTooltipDiv
        .transition()
        .duration(500)
        .style("opacity", 0)

    d3.select("#radius_" + lastActiveRing)
        .attr("opacity", 0)
    
}

function handleCourtSquareMousover(event, d) {
    if(mode == "discrete") {
        return;
    }
    let unit = chosenStat.unit;
    let format = chosenStat.format;
    if(chosenStat != ratio || attempts.raster.flat()[d.index] > ratioCutoff){
        courtTooltipDiv
            .style("left", event.x + "px")
            .style("top", event.y + "px") 
            .text(chosenStat.format != ratio.format ? `${format(d.val)} ${unit}` : `${format(d.val)} ${unit}\nn = ${attempts.raster.flat()[d.index]}`)
            .transition()
            .duration(200)
            .style("opacity", 1)
    }
}

function handleCourtSquareMouseout(event, d) {
    courtTooltipDiv
        .transition()
        .duration(500)
        .style("opacity", 0)
}

function setToHeatmap(){
    mode = "heatmap"
    d3.select('#canvases').style("opacity", 0);
    courtG.style("opacity", 1);
    heatmapScaleRootG.style("opacity", 1);
    discreteLegendRootG.style("opacity", 0);
}

function setToDiscrete(){
    mode = "discrete"
    d3.select('#canvases').style("opacity", 1);
    courtG.style("opacity", 0);
    heatmapScaleRootG.style("opacity", 0);
    discreteLegendRootG.style("opacity", 1);
}

$('#shots-taken').on('click', (e) => {changeDisplayedStat(attempts)})
$('#shots-made').on('click', (e) => {changeDisplayedStat(pts)})
$('#ratio').on('click', (e) => {changeDisplayedStat(ratio)})
$('#clear-player').on('click', (e) => {clearPlayer()})
$('#clear-team').on('click', (e) => {clearTeam()})
$('#apply-filters').on('click', (e) => {applyFilters()})
$('#heatmap-radio').on('click', (e) => {setToHeatmap()})
$('#discrete-radio').on('click', (e) => {setToDiscrete()})
//----------------------------------------------------------------------------------------------------------------------
// Canvas Utils
//----------------------------------------------------------------------------------------------------------------------
function clearCanvas() {
    // clear canvas
    // context.fillStyle = "rgba(255, 255, 255, 0)";
    attemptsContext.fillStyle = "#fff";
    attemptsContext.rect(0,0,attemptsCanvas.attr("width"),attemptsCanvas.attr("height"));
    attemptsContext.fill();
    ptsContext.fillStyle = "#fff";
    ptsContext.rect(0,0,ptsCanvas.attr("width"),ptsCanvas.attr("height"));
    ptsContext.fill();
    ratioContext.fillStyle = "#fff";
    ratioContext.rect(0,0,ratioCanvas.attr("width"),ratioCanvas.attr("height"));
    ratioContext.fill();


}

function drawCanvas() {

}



//----------------------------------------------------------------------------------------------------------------------
// Utils Utils
//----------------------------------------------------------------------------------------------------------------------

function searchForPlayer(str) {
    console.log(players.filter(el => el[1].toLowerCase().match(str.toLowerCase())))
}

function NaNToZero(x) {
    return isNaN(x) ? 0 : x;
}

function outsideRaster(x, y) {
    if (x < 0 || x >= resolutionX || y < 0 || y >= resolutionY) {
        return true
    } else {
        return false
    }
}


//----------------------------------------------------------------------------------------------------------------------
// Menu stuff
//----------------------------------------------------------------------------------------------------------------------

//https://twitter.github.io/typeahead.js/examples/
var substringMatcherPlayers = function(rows) {
    return function findMatches(q, cb) {
        // an array that will be populated with substring matches
        let matches = [];

        let words = q.split("")

        // regex used to determine if a string contains the substring `q`
        let substrRegex = new RegExp(q, 'i');

        // iterate through the pool of strings and for any string that
        // contains the substring `q`, add it to the `matches` array
        $.each(rows, function(i, row) {
        if (substrRegex.test(row[1])) {
            matches.push(row);
        }
        });
        cb(matches);
    };
};

var bloodhoundPlayers = new Bloodhound({
    local: players,
    identify: (player) => player.name,
    queryTokenizer : Bloodhound.tokenizers.nonword,
    datumTokenizer : (player) => {return Bloodhound.tokenizers.nonword(player.name)},
})


var teams = {37: {"abbrev": "ATL","full": "Atlanta Hawks"},38: {"abbrev": "BOS","full": "Boston Celtics"},39: {"abbrev": "CLE","full": "Cleveland Cavaliers"},40: {"abbrev": "NOP","full": "New Orleans Pelicans"},41: {"abbrev": "CHI","full": "Chicago Bulls"},42: {"abbrev": "DAL","full": "Dallas Mavericks"},43: {"abbrev": "DEN","full": "Denver Nuggets"},44: {"abbrev": "GSW","full": "Golden State Warriors"},45: {"abbrev": "HOU","full": "Houston Rockets"},46: {"abbrev": "LAC","full": "Los Angeles Clippers"},47: {"abbrev": "LAL","full": "Los Angeles Lakers"},48: {"abbrev": "MIA","full": "Miami Heat"},49: {"abbrev": "MIL","full": "Milwaukee Bucks"},50: {"abbrev": "MIN","full": "Minnesota Timberwolves"},51: {"abbrev": "BKN","full": "Brooklyn Nets"},52: {"abbrev": "NYK","full": "New York Knicks"},53: {"abbrev": "ORL","full": "Orlando Magic"},54: {"abbrev": "IND","full": "Indiana Pacers"},55: {"abbrev": "PHI","full": "Philadelphia 76ers"},56: {"abbrev": "PHX","full": "Phoenix Suns"},57: {"abbrev": "POR","full": "Portland Trail Blazers"},58: {"abbrev": "SAC","full": "Sacramento Kings"},59: {"abbrev": "SAS","full": "San Antonio Spurs"},60: {"abbrev": "OKC","full": "Oklahoma City Thunder"},61: {"abbrev": "TOR","full": "Toronto Raptors"},62: {"abbrev": "UTA","full": "Utah Jazz"},63: {"abbrev": "MEM","full": "Memphis Grizzlies"},64: {"abbrev": "WAS","full": "Washington Wizards"},65: {"abbrev": "DET","full": "Detroit Pistons"},66: {"abbrev": "CHA","full": "Charlotte Hornets"}}

var substringMatcherTeams = function(teamDict) {
    return function findMatches(q, cb) {
        var matches, substringRegex;

        // an array that will be populated with substring matches
        matches = [];

        // regex used to determine if a string contains the substring `q`
        substrRegex = new RegExp(q, 'i');

        // iterate through the pool of strings and for any string that
        // contains the substring `q`, add it to the `matches` array
        $.each(Object.keys(teams), function(i, key) {
            let teamInfo = teams[key]
            if (substrRegex.test(teamInfo["full"]) || substrRegex.test(teamInfo["abbrev"])) {
                matches.push(key);
            }
        });
        cb(matches);
    };
};

var substringMatcherActionType = function() {
    return function findMatches(q, cb) {
        let currentTags = actionTypeTagEditor.tagEditor('getTags')[0].tags;
        let options = Object.keys(actionIdToString).filter((key) => !currentTags.includes(actionIdToString[key]))
        if(q == ''){
            cb(options);
        } else {
            var matches;
            matches = [];
            substrRegex = new RegExp(q, 'i');
            $.each(options, function(i, key) {
                if (substrRegex.test(actionIdToString[key])) {
                    matches.push(key);
                }
            });
            cb(matches);
        }
    };
};

var player_search_typeahead = $('#player-search .typeahead');
var team_search_typeahead = $('#team-search .typeahead');
var action_type_typeahead = $('#action-type-col .typeahead')
function initializeTypeaheads(){
    team_search_typeahead.typeahead({
        hint: true,
        highlight: true,
        minLength: 1
        },
        {
        name: 'team',
        source: substringMatcherTeams(teams),
        display: (key) => teams[key]["full"]
    });
    
    team_search_typeahead.bind('typeahead:select', function(ev, suggestion) {
        if(suggestion != filterCurrentTeam){
            filterCurrentTeam = suggestion;
            invalidateFilter();
            $('#clear-team').attr('hidden', false);
            let info = teams[+suggestion];
            $("#team-img").attr("src", `https://www.nba.com/stats/media/img/teams/logos/${info["abbrev"]}_logo.svg`).attr('width', 130) // match player
        }
    });
    
        player_search_typeahead.typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    },
    {
        name: 'players',
        source: bloodhoundPlayers,
        display: (player) => player.name
    });

    player_search_typeahead.bind('typeahead:select', function(ev, suggestion) {
        if (suggestion.id != filterCurrentPlayer) {
            filterCurrentPlayer = suggestion.id;
            invalidateFilter();
            $('#clear-player').attr('hidden', false);
            $("#player-img").attr("src", `https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${suggestion.id}.png`).attr("width", 130)
        }
    });

    action_type_typeahead.typeahead({
            hint: true,
            highlight: true,
            minLength: 0
        },
        {
            name: 'action_type',
            source: substringMatcherActionType(),
            display: (key) => actionIdToString[key],
            limit: 999
        })

    action_type_typeahead.bind('typeahead:select', function(ev, suggestion) {
        invalidateFilter();
        actionTypeTagEditor.tagEditor('addTag', actionIdToString[+suggestion])
        action_type_typeahead.typeahead('val', '');
        action_type_typeahead.focus();
    });

}
var seasonSliderDisplay = $('#season-slider-display')
function handleSeasonSlider(event, ui){
    let low = ui.values[0];
    let high = ui.values[1];
    seasonSliderDisplay.text(`${low}-${high} Season${high - low == 1 ? "" : "s"}`)
    if(low != filterSeasonLow || high != filterSeasonHigh){
        filterSeasonLow = low;
        filterSeasonHigh = high;
        invalidateFilter();
    }
}

function initializeSliders(){
    $('#season-slider-range').slider({
        range: true,
        min: 2010,
        max: 2020,
        values: [2010, 2020],
        slide: handleSeasonSlider
    })
}

var actionTypeTagEditor;
function initializeTagEditor(){
    actionTypeTagEditor = $('#action-type-tag-area').tagEditor({
        forceLowercase : false,
        sortable: false,
        beforeTagDelete: () => {invalidateFilter()}
    })
}

//----------------------------------------------------------------------------------------------------------------------
// start
//----------------------------------------------------------------------------------------------------------------------
clearCanvas();

d3.text("./compiled.csv").then(ready);
// d3.text("./head.csv").then(ready);
 