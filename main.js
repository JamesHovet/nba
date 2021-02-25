var width = 500;
var height = 500;

var chart = d3.select("canvas");
chart.attr("width", width)
    .attr("height", height)
var context = chart.node().getContext("2d");
var svg = d3.select("svg");

var detachedContainer = document.createElement("custom");
var dataContainer = d3.select(detachedContainer);



svg.append("g")

d3.csv("./compiled.csv").then(ready);

function ready(compiled) {
    console.log(compiled)
    var dataBinding = dataContainer.selectAll("custom.rect")
        .data(compiled);

    var scaleX = d3.scaleLinear()
        .range([0, 500])
        .domain([-250, 250]);

    var scaleY = d3.scaleLinear()
        .range([0, 500])
        .domain([-50, 450]);

    
    dataBinding.enter()
        .append("custom")
        .classed("rect", true)
        .attr("x", (d) => scaleX(d.LOC_X))
        .attr("y", (d) => scaleY(d.LOC_Y))
        .attr("size", 1)
        .attr("fillStyle", "red");
    
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
  
  d3.timer(drawCanvas);
