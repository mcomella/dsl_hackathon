window.onload = function() {
  console.log("Hello")
  var url = "https://repository.library.brown.edu/api/pub/collections/"
  //callback = function(data) {console.log("Got data", data)};
  ajaxRequest(url, generateD3json);
  setTimeout(showCollections, 10000);
}

// Ajax request wrapper
function ajaxRequest(url, callback) {
  $.ajax({
    url: url
  }).done(function(data) {
    res = callback(data);
  });
}

var top = {name:"", children:[]};

function showCollections() {
  $collections = $("#collections");
  generateCircles(top);
  // $collections.text(JSON.stringify(collections));
}

function generateD3json(data) {
  var collections = data.collections;
   collections.forEach( function(c, index, array) {
     var child = {name:c.name, children:[]}
     top.children.push(child)
     ajaxRequest(c.json_uri, function (data) {
       getChildrenGen(child, data);
     });
   });
}

function getChildrenGen(parent, data) {
  if (data.child_folders.length == 0) {
    parent.size = data.items.numFound;
    //parent.items = data.items;
  } else {
    data.child_folders.forEach(function(child) {
      var c = {name:child.name, children:[]};
      parent.children.push(c);
      ajaxRequest(child.json_uri, function(data) {
        getChildrenGen(c, data)
      });
    });
  }
}

var w = 1280,
    h = 800,
    r = 720,
    x = d3.scale.linear().range([0, r]),
    y = d3.scale.linear().range([0, r]),
    node,
    root;

var pack = d3.layout.pack()
    .size([r, r])
    .value(function(d) { return d.size; })

var vis = d3.select("#collections").insert("svg:svg", "h2")
    .attr("width", w)
    .attr("height", h)
  .append("svg:g")
    .attr("transform", "translate(" + (w - r) / 2 + "," + (h - r) / 2 + ")");

function generateCircles(data) {
  node = root = data;

  var nodes = pack.nodes(root);

  vis.selectAll("circle")
      .data(nodes)
    .enter().append("svg:circle")
      .attr("class", function(d) { return d.children ? "parent" : "child"; })
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr("r", function(d) { return d.r; })
      .on("click", function(d) { return zoom(node == d ? root : d); });

  vis.selectAll("text")
      .data(nodes)
    .enter().append("svg:text")
      .attr("class", function(d) { return d.children ? "parent" : "child"; })
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; })
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .style("opacity", function(d) { return d.r > 20 ? 1 : 0; })
      .text(function(d) { return d.name; });

  d3.select(window).on("click", function() { zoom(root); });
};

function zoom(d, i) {
  var k = r / d.r / 2;
  x.domain([d.x - d.r, d.x + d.r]);
  y.domain([d.y - d.r, d.y + d.r]);

  var t = vis.transition()
      .duration(d3.event.altKey ? 7500 : 750);

  t.selectAll("circle")
      .attr("cx", function(d) { return x(d.x); })
      .attr("cy", function(d) { return y(d.y); })
      .attr("r", function(d) { return k * d.r; });

  t.selectAll("text")
      .attr("x", function(d) { return x(d.x); })
      .attr("y", function(d) { return y(d.y); })
      .style("opacity", function(d) { return k * d.r > 20 ? 1 : 0; });

  node = d;
  d3.event.stopPropagation();
}
