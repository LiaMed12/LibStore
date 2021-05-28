var scale = 1;

var width = +d3.select('.container').style("width").slice(0, -2);
var height = +d3.select('.container').style("height").slice(0, -2) + SVG_CONTROL;

var svg = d3.select("body").select(".container").select(".fieldForDraws")
    .attr("width", width - SVG_CONTROL)
    .attr("height", height);

var links = [];
var nodes = {};

function graph(jsonSpecification, listStopAutomation) {
    links = [];
    nodes = {};
    var jsonParse = JSON.parse(jsonSpecification);
    console.log(jsonParse)
    createDataGraph(jsonParse, listStopAutomation);

    links.forEach(function (link) {
        link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
        link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
    });

    cleanSVG()
    drawGraph()
}

function createDataGraph(jsonParse, listStopAutomation) {
    for (let i = 0; i < jsonParse[AUTOMATA].length; i++) {
        for (const key in jsonParse[AUTOMATA][i]) {
            if (key === SHIFTS && listStopAutomation.indexOf(jsonParse[AUTOMATA][i][NAME][TYPE_NAME]) !== -1) {
                analysisShift(jsonParse[AUTOMATA][i]['' + key], jsonParse[AUTOMATA][i][NAME][TYPE_NAME], links);
            }
        }
        if (jsonParse[AUTOMATA][i][SHIFTS].length === 0 && listStopAutomation.indexOf(jsonParse[AUTOMATA][i][NAME][TYPE_NAME]) !== -1) {
            addAloneNodes(jsonParse[AUTOMATA][i])
        }
    }
}

function addAloneNodes(automata) {
    for (let i = 0; i < automata["states"].length; i++) {
        if (automata["states"].length % 2 === 0 && i !== automata["states"].length - 1) {
            links.push({
                source: automata["states"][i]["name"] + ' (' + automata['name']['typeName'] + ')',
                target: automata["states"][i + 1]["name"] + ' (' + automata['name']['typeName'] + ')',
            })
        }
        links.push({
            source: automata["states"][i]["name"] + ' (' + automata['name']['typeName'] + ')',
            target: automata["states"][i]["name"] + ' (' + automata['name']['typeName'] + ')'
        })
    }
}

function analysisShift(shifts, name, links) {
    for (let i = 0; i < shifts.length; i++) {
        let wayToNodes = shifts[i];
        for (let i = 0; i < wayToNodes[FUNCTION].length; i++) {
            if (wayToNodes["to"] === SELF) {
                links.push({
                    source: wayToNodes["from"] + ' (' + name + ')',
                    target: wayToNodes["from"] + ' (' + name + ')',
                    type: "self",
                    function: wayToNodes[FUNCTION][i]
                });
            } else
                links.push({
                    source: wayToNodes["from"] + ' (' + name + ')',
                    target: wayToNodes["to"] + ' (' + name + ')',
                    type: "suit",
                    function: wayToNodes[FUNCTION][i]
                });
        }
    }
}

function linkArc(d) {
    if (d.type === "self") {
        var drx = 40 * scale,
            dry = 20 * scale,
            xend = d.source.x - 5;
        return "M " + d.source.x + "," + d.source.y + " A " + drx + "," + dry + " 360 1 1 " + xend + "," + d.source.y;
    } else if (d.type === "suit") {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy) * scale;
        return "M " + d.source.x + "," + d.source.y + " A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    } else {
        var drx = d.target.x,
            dry = d.target.y;
        return "M " + d.source.x + " " + d.source.y + " L " + drx + " " + dry;
    }
}

function transform(d) {
    return "translate(" + d.x + "," + d.y + ")";
}

function parseName(name) {
    return name.replace(/ *\([^)]*\) */g, "");
}

function setColorCircle(d) {
    return STATE
}

function setRadiusCircle(d) {
    return RADIUS_CIRCLE * scale
}

function cleanSVG() {
    svg.selectAll("g").remove();
    svg.selectAll("defs").remove();
}

var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

function drawGraph() {
    var force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(links)
        .size([width, height])
        .linkDistance(50 * scale)
        .charge(-500 * scale)
        .on("tick", tick).start();

    // Per-type markers lines
    svg.append("defs").selectAll("marker")
        .data(["suit", "self", "resolved"])
        .enter().append("marker")
        .attr("id", function (d) {
            return d;
        })
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 20)
        .attr("refY", -1.5)
        .attr("markerWidth", MARKER_SIZE * scale)
        .attr("markerHeight", MARKER_SIZE * scale)
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


    path.on("mouseover", function (d) {
        if (d.type !== undefined) {
            div.transition()
                .style("opacity", 3)
            d3.select(this)
                .style("stroke", "blue")
                .style("opacity", 3)
            div.html("function: " + getFunction(d.source.name, d.target.name))
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - FRAME_CONTROL) + "px")
        }
    })
        .on("mouseout", function (d) {
            if (d.type !== undefined) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            }
        })
        .on("mouseleave", function (d) {
            if (d.type !== undefined) {
                div.transition()
                    .style("opacity", 0)
                d3.select(this)
                    .style("stroke", "#666")
            }
        })


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
        div.transition()
            .style("opacity", 1)
        d3.select(this)
            .style("stroke", "red")
            .style("opacity", 1)
        if (NotUndefinedCircle(d.name)) {
            div.html("automaton: " + getAutomaton(d.name) + "<br/>" + getState(d.name))
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - FRAME_CONTROL) + "px")
        } else {
            div.html("automaton: " + getAutomaton(d.name))
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - FRAME_CONTROL) + "px")
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

    var Automata_name = svg.append("g")
        .selectAll("text")
        .data(force.nodes())
        .enter().append("text")
        .attr("x", -40)
        .attr("y", "-1em")
        .style("fill", "green")
        .style("font-size", "3vh")
        .text(function (d) {
            return parseNameAutomata(d.name);
        });

    var text = svg.append("g")
        .selectAll("text")
        .data(force.nodes())
        .enter().append("text")
        .attr("x", 15)
        .attr("y", ".31em")
        .text(function (d) {
            return parseName(d.name);
        });

    function getAutomaton(name) {
        let k = name.replace(/\(|\)/gm, '').split(' ');
        return k[k.length - 1]
    }

    function parseNameAutomata(name) {
        if (parseName(name) === 'Constructed')
            return getAutomaton(name)
    }

    function NotUndefinedCircle(name) {
        for (let i = 0; i < links.length; i++) {
            if (links[i]["source"]["name"] === name && links[i]["type"] === undefined)
                return false
        }
        return true
    }

    function getFunction(nameSource, nameTarget) {
        let finalString = '';
        for (let i = 0; i < links.length; i++) {
            if (nameSource === links[i]["source"].name && nameTarget === links[i]["target"].name)
                finalString += links[i].function + '; '
        }
        return finalString
    }

    function getState(name) {
        let arrayState = [];
        let finalString = '';
        for (let i = 0; i < links.length; i++)
            if (name === links[i]["source"].name && arrayState.indexOf(links[i].target.name) === -1) {
                if (finalString === '')
                    finalString += "next state: "
                finalString += parseName(links[i].target.name) + '; '
                arrayState.push(links[i].target.name)
            }
        return finalString
    }

    // Use elliptical arc path segments to doubly-encode directionality.
    function tick() {
        path.attr("d", linkArc);
        circle.attr("transform", transform);
        text.attr("transform", transform);
        Automata_name.attr("transform", transform)
    }
}

function addOnWheel(elem, handler) {
    if (elem.addEventListener) {
        if ('onwheel' in document) {
            // IE9+, FF17+
            elem.addEventListener("wheel", handler);
        } else if ('onmousewheel' in document) {
            // устаревший вариант события
            elem.addEventListener("mousewheel", handler);
        } else {
            // 3.5 <= Firefox < 17, более старое событие DOMMouseScroll пропустим
            elem.addEventListener("MozMousePixelScroll", handler);
        }
    } else {
        text.attachEvent("onmousewheel", handler);
    }
}


addOnWheel(text, function (e) {

    var delta = e.deltaY || e.detail || e.wheelDelta;

    // отмасштабируем при помощи CSS
    if (delta > 0) scale += 0.05;
    else scale -= 0.05;

    cleanSVG(svg)
    drawGraph(width, height, svg)

    // отменим прокрутку
    e.preventDefault();
});
