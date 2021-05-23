function graph(jsonSpecification, listStopAutomation)
{
    var links = [];
    var nodes = {};
    var jsonParse = JSON.parse(jsonSpecification);

    createDataGraph(jsonParse, links, listStopAutomation);

    // Compute the distinct nodes from the links.
    links.forEach(function (link) {
        link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
        link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
    });

    var width  = +d3.select('.container').style("width").slice(0, -2);
    var height = +d3.select('.container').style("height").slice(0, -2);

    var svg = d3.select("body").select(".container").select(".fieldForDraws")
        .attr("width", width - 40)
        .attr("height", height - 49);

    cleanSVG(svg)
    drawGraph(nodes, links, width, height, svg)
}

function createDataGraph(jsonParse, links, listStopAutomation) {
    for (let i = 0; i < jsonParse["automata"].length; i++)
        for (const key in jsonParse["automata"][i])
            if (key === "shifts" && listStopAutomation.indexOf(jsonParse["automata"][i]["name"]["typeName"]) !== -1)
                analysisShift(jsonParse["automata"][i]['' + key], jsonParse["automata"][i]["name"]["typeName"], links);
}

function analysisShift(shifts, name, links) {
    for (let i = 0; i < shifts.length; i++)
    {
        let wayToNodes = shifts[i];
        for (let i = 0; i < wayToNodes["functions"].length; i++) {
            if (wayToNodes["to"] === "self") {
                links.push({
                    source: wayToNodes["from"] + ' (' + name + ')',
                    target: wayToNodes["from"] + ' (' + name + ')',
                    type: "licensing"
                });
            } else
                links.push({
                    source: wayToNodes["from"] + ' (' + name + ')',
                    target: wayToNodes["to"] + ' (' + name + ')',
                    type: "suit",
                    function: wayToNodes["functions"][i]
                });

        }
    }
}

function linkArc(d) {

    if (d.type === "licensing") {
        var drx = 30,
        dry = 20,
        xend = d.source.x - 5;

        return "M " + d.source.x + "," + d.source.y + " A " + drx + "," + dry + " 360 1 1 " + xend + "," + d.source.y;
    } else {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
        return "M " + d.source.x + "," + d.source.y + " A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    }
}

function transform(d) {
    return "translate(" + d.x + "," + d.y + ")";
}

function parseName(name) {
    return name.replace(/ *\([^)]*\) */g, "");
}

function setColorCircle(d) {
    if (d.name.split(" ")[0] === "self")
        return "self"
    return "state"
}

function setRadiusCircle(d) {
    if (d.name.split(" ")[0] === "self")
        return 2
    return 10
}

function cleanSVG(svg) {
    svg.selectAll("g").remove();
    svg.selectAll("defs").remove();

}

function drawGraph(nodes, links, width, height, svg) {
    var force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(links)
        .size([width, height])
        .linkDistance(80)
        .charge(-700)
        .on("tick", tick).start();

    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Per-type markers lines
    svg.append("defs").selectAll("marker")
        .data(["suit", "licensing", "resolved"])
        .enter().append("marker")
        .attr("id", function (d) {
            return d;
        })
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", -1.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5");


    var path = svg.append("g")
        .selectAll("path")
        .data(force.links())
        .enter().append("path")
        .attr("class", function (d) {
            return "link " + d.type;
        })
        .attr("marker-end", function (d) {
            return "url(#" + d.type + ")";
        });

    // Per-type markers circle
    var circle = svg.append("g").selectAll("circle")
        .data(force.nodes())
        .enter().append("circle")
        .attr("class", function (d) {
            return setColorCircle(d);
        }).attr("r", function (d) {
            return setRadiusCircle(d);
        }).call(force.drag);

    circle.on("mouseover", function (d) {
        if (d.name.split(" ")[0] !== "self") {
            div.transition()
                .style("opacity", 1)
            d3.select(this)
                .style("stroke", "red")
                .style("opacity", 1)
            div.html("automaton: " + getAutomaton(d.name) + "<br/>" + getFunction(d.name, links))
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 40) + "px")
        }
    })
        .on("mouseout", function (d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .on("mouseleave", function (d) {
            div.transition()
                .style("opacity", 0)
            d3.select(this)
                .style("stroke", "grey")
        })


    var text = svg.append("g")
        .selectAll("text")
        .data(force.nodes())
        .enter().append("text")
        .attr("x", 8)
        .attr("y", ".31em")
        .text(function (d) {
            return parseName(d.name);
        });

    function getAutomaton(name) {
        let k = name.replace(/\(|\)/gm, '').split(' ');
        return k[k.length - 1]
    }

    function getFunction(name, links)
    {
        let finalString = '';
        for (let i = 0; i < links.length; i++)
            if (links[i].type === "suit")
                if (name === links[i]["source"].name)
                {
                    if (finalString === '')
                        finalString += "function to go to another" + "<br/>" + " state: "
                    finalString += links[i].function + '; '
                }
        return finalString
    }

    // Use elliptical arc path segments to doubly-encode directionality.
    function tick() {
        path.attr("d", linkArc);
        circle.attr("transform", transform);
        text.attr("transform", transform);
    }
}