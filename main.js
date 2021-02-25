var width = 500;
var height = 500;

var chart = d3.select("canvas");
chart.attr("width", width)
    .attr("height", height)
var context = chart.node().getContext("2d");
var svg = d3.select("svg");

var detachedContainer = document.createElement("custom");
var dataContainer = d3.select(detachedContainer);

var col = {"PLAYER_ID" : 0,
"TEAM_ID" : 1,
"PERIOD" : 2,
"ACTION_TYPE" : 3,
"SHOT_TYPE" : 4,
"SHOT_DISTANCE" : 5,
"LOC_X" : 6,
"LOC_Y" : 7,
"SHOT_MADE_FLAG" : 8,
"SEASON" : 9,
"TOTAL_REMAINING_IN_GAME" : 10}

svg.append("g")

d3.text("./compiled.csv")
    .then(ready);
// d3.csv("./head.csv").then(ready);

function ready(compiled) {
    // compiled = compiled.slice(compiled.indexOf("\n"))
    compiled = compiled.split("\n")
    const rows = compiled.map((el) => {return el.split(',').map(d => +d)})
    console.log(rows)
    var dataBinding = dataContainer.selectAll("custom.rect")
        .data(rows)

    var scaleX = d3.scaleLinear()
        .range([0, 500])
        .domain([-250, 250]);

    var scaleY = d3.scaleLinear()
        .range([0, 500])
        .domain([-50, 450]);

    
    dataBinding.enter()
        .append("custom")
        .filter((d) => d[col.SEASON] == 2010)
        .classed("rect", true)
        .attr("x", (d) => scaleX(d[col.LOC_X]))
        .attr("y", (d) => scaleY(d[col.LOC_Y]))
        .attr("size", 1)
        .attr("fillStyle", "red");
    
    drawCanvas()
}

function drawCanvas() {

    // clear canvas
    context.fillStyle = "#fff";
    context.rect(0,0,chart.attr("width"),chart.attr("height"));
    context.fill();
    
    // select our dummy nodes and draw the data to canvas.
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
  
//   d3.timer(drawCanvas);
