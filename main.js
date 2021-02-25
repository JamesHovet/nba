var width = 1200;
var height = 800;

var chart = d3.select("canvas");
chart.attr("width", width)
    .attr("height", height)
var context = chart.node().getContext("2d");
var svg = d3.select("svg");

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

//----------------------------------------------------------------------------------------------------------------------
// setup scales etc.
//----------------------------------------------------------------------------------------------------------------------
const pyRange = (start, stop, step = 1) =>
  Array(Math.ceil((stop - start) / step)).fill(start).map((x, y) => x + y * step)
var scaleX = d3.scaleQuantize()
    .domain([-250, 250])
    .range(pyRange(0, 800, 10))

var scaleY = d3.scaleQuantize()
    .domain([-50, 450])
    .range(pyRange(0, 800, 10))
 
  
//----------------------------------------------------------------------------------------------------------------------
// Parse new data
//----------------------------------------------------------------------------------------------------------------------

function ready(compiled) {
    // compiled = compiled.slice(compiled.indexOf("\n"))
    compiled = compiled.split("\n")
    const rows = compiled.map((el) => {return el.split(',').map(d => +d)})
    console.log(rows)
    var dataBinding = dataContainer.selectAll("custom.rect")
        .data(rows)

        dataBinding.enter()
        .append("custom")
        .filter((d) => {
            return d[col.SEASON] == 2011 && d[col.TEAM_ID] == teamsToIds.BOS;
        })
        .classed("rect", true)
        .attr("x", (d) => scaleX(d[col.LOC_X]))
        .attr("y", (d) => scaleY(d[col.LOC_Y]))
        .attr("size", 8)
        .attr("fillStyle", (d) => {if(d[col.SHOT_MADE_FLAG]){
            return "rgba(0, 255, 0, 0.02)"
        } else {
            return "rgba(255, 0, 0, 0.02)"
        }});
    
    drawCanvas()
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
    var elements = dataContainer.selectAll("custom.rect");
    elements.each(function(d) {
      var node = d3.select(this);
      
      context.beginPath();
      context.fillStyle = node.attr("fillStyle");
      context.rect(node.attr("x"), node.attr("y"), node.attr("size"), node.attr("size"));
      context.fill();
      context.closePath();
      
    })
  }
  
//----------------------------------------------------------------------------------------------------------------------
// start
//----------------------------------------------------------------------------------------------------------------------
clearCanvas();

d3.text("./compiled.csv")
    .then(ready);
// d3.csv("./head.csv").then(ready);
 