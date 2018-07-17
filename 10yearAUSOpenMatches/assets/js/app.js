function mouseclick() {
  isClicked = !isClicked;
}

// to selet a sub-matrix from the full matrix using the index ranges
// in x and y dimensions
function selectMatrix(data, xRange, yRange) {
  var xSel = data.filter((o, i) => ~xRange.indexOf(i));
  var selection = [];
  xSel.forEach(function(o, i) {
    selection[i] = o.filter((s, j) => ~yRange.indexOf(j));
  });
  return selection;
}

function mirrorMatrix(data, i, j) {
  return data[j][i];
}

function textProcess(text) {
  text = text[0].toLowerCase() + text.slice(1) ;
  return text.replace(/\s/g, '');
}

var test, test1;
var test2 = [];
var matrixWidthAttr = 700;
var matchWidthAttr = 500;
var xPadding = 120;
var yPadding = 80;

var tooltip = d3.select("body").append("div").attr("class", "toolTip");

// set up the svg to display the player matrix
var matrixSVG = d3.select('#matrix').append('svg');
matrixSVG.attr('id', 'matrix_svg')
         .attr('width', matrixWidthAttr);
var matrixWidth = parseFloat(matrixSVG.style('width'));
var matrixHeight = matrixWidth;
matrixSVG.attr('height', matrixHeight);

var isClicked = false;
// set up svg for match stats display
var matchSVG = d3.select('#match_stat').append('svg');
matchSVG.attr('id', 'match_svg')
        .attr('width', matchWidthAttr);
var matchWidth = parseFloat(matchSVG.style('width'));
var matchHeight = matchWidth * 1.2;
matchSVG.attr('height', matchHeight);

var percVar = [ 'firstServe', 'firstPointWon', 'secPointWon', 'breaks', 'returns', 'nets' ];
var percText = [ '1st Serve', '1st Point Won', '2nd Won', 'Break', 'Return', 'Net' ];
var speedVar = [ 'fastServe', 'avgFirstServe', 'avgSecServe'];
var speedText = [ 'Fast Serve', 'Avg 1st Serve', 'Avg 2nd Serve'];
var pointVar = [ 'winnerpts', 'errors', 'total'];
var roundText = {'First': '1st', 'Second': '2nd', 'Third': '3rd', 'Fourth': '4th', 'quarter': '1/4', 'semi': '1/2', 'Final': 'Final'};

var annotation = {
  'pie': ['Winner points', 'Error points from opponent', 'Other points'],
  'percStats': ['1st Serve success Rate', 'Point won rate in 1st serve', 'Point won rate in 2nd serve', "Break opponent's serve rate", 'Return success rate', 'Net faults rate'],
  'speedStats': ['Fastest serve speed in mph', 'Average 1st serve speed in mph', 'Average 2nd serve speed in mph']
};

var width= matrixWidth * 0.7;
// scales for player matrix
var x = d3.scaleBand().range([0, width]);
var z = d3.scaleLinear().domain([0, 4]).clamp(true);
var c = d3.scaleOrdinal(d3.schemeCategory10).domain(d3.range(10));

// colors palletes
var colorBar = ['#c22a1f', '#1f8cbf'];

// scales for match states
var percScale1 = d3.scaleLinear()
                    .domain([100, 0])
                    .range([0, matchWidth/2 - xPadding]);
var percScale2 = d3.scaleLinear()
                    .domain([0, 100])
                    .range([0, matchWidth/2 - xPadding]);
var speedScale1 = d3.scaleLinear()
                    .domain([250, 0])
                    .range([0, matchWidth/2 - xPadding]);
var speedScale2 = d3.scaleLinear()
                    .domain([0, 250])
                    .range([0, matchWidth/2 - xPadding]);

var percAxis1 = d3.axisBottom(percScale1);
var percAxis2 = d3.axisBottom(percScale2);
var speedAxis1 = d3.axisBottom(speedScale1);
var speedAxis2 = d3.axisBottom(speedScale2);

d3.json('./assets/data/data.json', function(data) {
  var players = data.players;
  var pairs = data.pairs;
  var matrix = [];
  var nPlayer = players.length;
  var matches;
  var matchPlayers;

  players.forEach(function(player, index) {
    matrix[index] = d3.range(nPlayer).map(function(j) { return { x: j, y: index, z: null }; });
  });

  pairs.forEach(function(pair) {
    var i = pair.player[0] - 1;
    var j = pair.player[1] - 1;
    matrix[i][j].z = pair.matches;
    matrix[j][i].z = pair.matches;
  });

  var orders = {
    winning: d3.range(nPlayer).sort((a, b) => players[b].win - players[a].win || d3.ascending(players[a].name, players[b].name)),
    champ: d3.range(nPlayer).sort((a, b) => players[b].champ - players[a].champ || d3.ascending(players[a].name, players[b].name))
  };

  var matrixplot = matrixSVG.append('g')
                            .attr('id', 'matrix_plot')
                            .attr('transform', 'translate(150,150)');
  matrixplot.append('rect')
            .attr('class', 'background')
            .attr('width', width)
            .attr('height', width);

  var start = 0;
  var end = 50;
  reDraw();

  d3.select("#slider").on("input", function() {
    updatePlayers(+this.value);
  });

  updatePlayers(50);
  // update the elements
  function updatePlayers(num) {
    // adjust the text on the range slider
    d3.select("#slider-value").text(num);
    d3.select("#slider").property("value", num);
    end = d3.select("#slider").property("value")
    reDraw();
  }


  function reDraw() {
    d3.select('#matrix_svg').remove();
    var matrixSVG = d3.select('#matrix').append('svg');
    matrixSVG.attr('id', 'matrix_svg')
             .attr('width', matrixWidthAttr);
    var matrixWidth = parseFloat(matrixSVG.style('width'));
    var matrixHeight = matrixWidth;
    matrixSVG.attr('height', matrixHeight);
    var matrixplot = matrixSVG.append('g')
                              .attr('id', 'matrix_plot')
                              .attr('transform', 'translate(150,150)');
    matrixplot.append('rect')
              .attr('class', 'background')
              .attr('width', width)
              .attr('height', width);

    var sel = orders.winning.slice(start,end);
    var selData = selectMatrix(matrix, sel, sel);
    x.domain(d3.range(end - start));
    var years = [];

    var row = matrixplot.selectAll(".row")
        .data(selData).enter()
          .append("g")
            .attr("class", "row")
            .attr("transform", function(d, i) { return "translate(0," + x(sel.indexOf(d[i].y)) + ")"; })
            .each(row);

    row.append("line")
        .attr("class", "line")
        .attr("x2", width);

    row.append("text")
        .attr('id', function(d,i) {return 'row-' + d[i].y})
        .attr("x", -5)
        .attr("y", x.bandwidth() / 2)
        .attr("dy", ".32em")
        .attr("text-anchor", "end")
        .attr('font-size', '0.5em')
        .text(function(d, i) { return players[d[i].y].name; });

    var column = matrixplot.selectAll(".column")
        .data(selData)
      .enter().append("g")
        .attr("class", "column")
        .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

    column.append("line")
        .attr("class", "line")
        .attr("x1", -width);

    column.append("text")
        .attr('id', function(d,i) {return 'col-' + i})
        // .attr("transform", "rotate(30)")
        .attr("x", 5)
        .attr("y", x.bandwidth() / 2)
        .attr("dy", ".32em")
        .attr('font-size', '0.5em')
        .attr("text-anchor", "start")
        .text(function(d, i) {  return players[sel[i]].name; });

    function row(row) {
          var cell = d3.select(this).selectAll(".cell")
          .data(row.filter(function(d) { return d.z !== null; }))
        .enter().append("rect")
          .attr("class", "cell")
          .attr("x", function(d, i) { return x(sel.indexOf(d.x)); })
          .attr("width", x.bandwidth())
          .attr("height", x.bandwidth())
          .style("fill-opacity", function(d) { return z(d.z.length); })
          .style("fill", function(d) {return Math.floor(orders.winning.indexOf(d.x)/10) == Math.floor(orders.winning.indexOf(d.y)/10) ? c(Math.floor(orders.winning.indexOf(d.x)/10)) : null; })
          .on("mouseover", mouseover)
          .on("mouseout", mouseout)
          .on("mousemove", mousemove)
          .on("click", mouseclick);
    }
    function mouseover(p, i) {
      if (!isClicked) {
        d3.select('#col-' + sel.indexOf(p.x))
        .classed('active', false)
          .attr('transform', 'translate(-5,' + (-2 * 50/end) + ') scale(1.5)')
          .attr('fill', 'red');
        d3.select('#row-' + p.y)
        .classed('active', false)
          .attr('transform', 'translate(5,' + (-2 * 50/end) + ') scale(1.5)')
          .attr('fill', 'red');
        drawAxis();
        matches = p.z;
        matchPlayers = [p.x, p.y];
        var length = matches.length;
        if (length == 1) {
          d3.select('#select_year').remove();
          d3.select('#year').remove();
          years = [];
          years.push(matches[0].year)
          d3.select('#year_control').append('label')
                                      .attr('id', 'year')
                                      .html('Year ' + years[0]);
        }
        else {
          d3.select('#year').remove();
          d3.select('#select_year').remove();
          years = [];
          matches.forEach(function(m) { years.push(m.year);})
          d3.select('#year_control').append('select')
                                    .attr('id', 'select_year')
                                    .on('change', function() {updateYears(+this.value);});

          d3.select('#select_year').selectAll('option')
                    .data(years)
                    .enter()
                    .append('option')
                    .attr('value', function(d) {return d;})
                    .text(function(d) {return 'Year ' + d;})
        }

        function updateYears(year) {
          d3.select("#select_year").property("checked", true);
          drawStat(year);
        }
        drawStat(matches[0].year);
      }
    }

    function drawStat(year) {
      var index = years.indexOf(year);
      drawBarplot(index);
      drawOther(index);
    }

    function mouseout(p, i) {
      if (!isClicked) {
        tooltip.style('display', 'none');
        d3.select('#col-' + sel.indexOf(p.x))
          .classed('active', false)
          .attr('transform', 'translate(0,0) scale(1.0)')
          .attr('fill', 'black');
        d3.select('#row-' + p.y)
        .classed('active', false)
          .attr('transform', 'translate(0,0) scale(1.0)')
          .attr('fill', 'black');
      }
    }

    function mousemove (p, i) {
      var years = [];
      p.z.forEach(function(y, i) {years.push(y.year)});
      tooltip.style("left", d3.event.pageX - 50 + "px")
                    .style("top", d3.event.pageY + 50 + "px")
                    .style("display", "inline-block")
                    .html(players[p.y].name + ' vs. ' + players[p.x].name + "<br>"
                        + years.length + (years.length == 1 ? ' encounter' : ' encounters') + '<br>'
                        + 'in year ' + years.sort().toString().replace(/\s*,/g, ', '));
    }

    function drawAxis() {
      if (d3.select('#bar_axis').empty()) {
        percAxis1.tickValues(d3.range(4).map(i => i * 20 + 20));
        percAxis2.tickValues(d3.range(5).map(i => i * 20));

        var barAxis = matchSVG.append('g')
                                .attr('id', 'bar_axis')
                                .attr('transform', 'translate(25, -20)');
        barAxis.append('g')
                  .attr('transform', 'translate(' + xPadding + ',' + (matchHeight/3 - yPadding) + ')')
                  .transition()
                    .duration(500)
                    .call(percAxis1);
        barAxis.append('g')
                  .attr('transform', 'translate(' + matchWidth/2 + ',' + (matchHeight/3 - yPadding) +')')
                  .transition()
                    .duration(500)
                    .call(percAxis2);

        barAxis.append('g')
                  .attr('transform', 'translate(' + matchWidth/2 + ',' + (matchHeight/3 - yPadding + 30) +')')
                  .append('text')
                  .style('text-anchor', 'middle')
                  .attr('font-size', '0.8em')
                  .text('Percentage (%)');
}
    }

    function drawBarplot(index) {
      // d3.select('#player_header').remove();
      d3.select('#barplot').remove();
      var t = d3.transition()
                  .duration(500);
      var barplot = matchSVG.append('g')
                              .attr('id', 'barplot')
                              .attr('transform', 'translate(25,0)');
      var bandwidth = 15;
      var winner = matches[index]['winner'];
      var colors = [colorBar[1], colorBar[1]];
      var trophy = ['', ''];
      colors[matchPlayers.indexOf(winner - 1)] = colorBar[0];
      trophy[matchPlayers.indexOf(winner - 1)] = '<span id="trophy"><i class="fas fa-trophy"></i></span> ';

      d3.select('#round')
        .style('text-align', 'center')
        .text(roundText[matches[index]['round']]);
      d3.select('#player1_name')
        .style('text-align', 'center')
        .html(trophy[1] + players[matchPlayers[1]].name)
      d3.select('#player2_name')
        .style('text-align', 'center')
        .html(trophy[0] + players[matchPlayers[0]].name);

      d3.select('#player1_country')
        .text(players[matchPlayers[1]].country);
      d3.select('#player2_country')
        .text(players[matchPlayers[0]].country);
      // player1 bar
      var percLeft = barplot.append('g').attr('id', 'perc_disp1');

      percLeft.selectAll('rect')
              .data(percVar).enter()
                .append('g').attr('id', 'row_perc1')
                .append('rect')
                  .attr('x', percScale1(0) + xPadding)
                  .attr('y', function(d, i) {return i * bandwidth;})
                  .attr('width', 0)
                  .attr('height', bandwidth)
                  .attr('fill', colors[1])
                  .transition(t)
                  .attr('x', function(d) {return xPadding + percScale1(matches[index][d][1]);})
                  .attr('width', function(d) {return percScale1(0) - percScale1(matches[index][d][1]);});

      percLeft.selectAll('rect').on('mousemove', percmousemove)
                                .on('mouseover', barmouseover)
                                .on('mouseout', barmouseout)


      function percmousemove (p,i) {
        tooltip.style("left", d3.event.pageX + 20 + "px")
                      .style("top", d3.event.pageY + 20 + "px")
                      .style("display", "inline-block")
                      .html(annotation.percStats[i]);
      }

      function barmouseover(p, i) {
        // tooltip.style("left", d3.event.pageX + 20 + "px")
        //               .style("top", d3.event.pageY + 20 + "px")
        //               .style("display", "inline-block")
        //               .html('');
        // tooltip.append('svg').append('circle').attr('cx', 50).attr('cy', 50).attr('r', 50).attr('fill', 'red');
        d3.selectAll('#row_perc1').filter(function(d, j) {return i == j;})
                                    .style("fill-opacity", '0.2')
                                    .append('text')
                                    .attr('transform', function(d) {return 'translate(' + (matchWidth/2 - percScale1(0) + percScale1(matches[index][d][1])) + ',' + (i + 1) * bandwidth + ')';})
                                    .style('font-size', '0.8em')
                                    .style('fill', 'black')
                                    .style('text-anchor', 'end')
                                    .style('dominant-baseline', 'ideographic')
                                    .style("fill-opacity", '1')
                                    .text(matches[index][p][1] + '%');
        d3.selectAll('#row_perc2').filter(function(d, j) {return i == j;})
                                    .style("fill-opacity", '0.2')
                                    .append('text')
                                    .attr('transform', function(d) {return 'translate(' + (percScale1(-matches[index][d][0]) - percScale1(0)) + ',' + (i + 1) * bandwidth + ')';})
                                    .style('font-size', '0.8em')
                                    .style('fill', 'black')
                                    .style('text-anchor', 'start')
                                    .style('dominant-baseline', 'ideographic')
                                    .style("fill-opacity", '1')
                                    .text(matches[index][p][0] + '%');
        if (matches[index][p][1] * matches[index][p][0] == 0) return;

        var diff = matches[index][p][1] - matches[index][p][0];

        d3.select('#barplot')
          .append('g').attr('id', 'perc_diff-' + i)
          .append('rect')
          .attr('x', percScale1(0) + xPadding)
          .attr('y', i * bandwidth + 1)
          .attr('width', 0)
          .attr('height', bandwidth - 2)
          .attr('fill', '#29c902')
          .transition(t)
          .attr('x', function(d) {return xPadding + (percScale1(0) - percScale1(diff) > 0 ? percScale1(diff) : percScale1(0));})
          .attr('width', function(d) {return Math.abs(percScale1(0) - percScale1(diff));});
        d3.select('#perc_diff-' + i).append('text')
                                    .attr('transform', function() {return 'translate(' + (matchWidth/2) + ',' + (i + 1) * bandwidth + ')';})
                                    .style('font-size', '0.8em')
                                    .style('fill', 'black')
                                    .style('text-anchor', function() {return diff > 0 ? 'end' : 'start';})
                                    .style('dominant-baseline', 'ideographic')
                                    .style("fill-opacity", '1')
                                    .text(Math.abs(diff) + '%');
      }

      function barmouseout(p, i) {
        // tooltip.selectAll('svg').remove();
        tooltip.style("display", 'none');
        d3.selectAll('#row_perc1').filter(function(d, j) {return i == j;})
                                    .style("fill-opacity", '1');
        d3.selectAll('#row_perc2').filter(function(d, j) {return i == j;})
                                    .style("fill-opacity", '1');
        d3.select('#row_perc1 text').remove();
        d3.select('#row_perc2 text').remove();
        d3.select('#perc_diff-' + i).remove();
      }

      percLeft.selectAll('text')
              .data(percVar).enter()
                .append('g').attr('id', 'row_perc1_text')
                .attr('transform', function(d, i) {return 'translate(' + (matchWidth/2 - 135) + ',' + (i + 1) * bandwidth + ')';})
                .append('text')
                  .style('text-anchor', 'end')
                  .style('dominant-baseline', 'ideographic')
                  .attr('font-size', '0.8em')
                  .text(function (d, i) {return percText[i];});

      d3.selectAll('#row_perc1')
        .append('line')
        .attr('transform', function(d, i) {return 'translate(0,' + i * bandwidth + ')';})
        .attr("class", "line")
        .attr("x2", matchWidthAttr);

      // player2 bar
      var percRight = barplot.append('g').attr('id', 'perc_disp2');

      percRight.append('g')
              .attr('transform', 'translate('+ matchWidth/2 + ',0)')
                .selectAll('rect')
                  .data(percVar).enter()
                    .append('g').attr('id', 'row_perc2')
                    .append('rect')
                      .attr('x', 0)
                      .attr('y', function(d, i) {return i * bandwidth;})
                      .attr('width', 0)
                      .attr('height', bandwidth)
                      .attr('fill', colors[0])
                      .transition(t)
                      .attr('width', function(d) { return percScale2(matches[index][d][0]);});

      percRight.selectAll('text')
              .data(percVar).enter()
                .append('g').attr('id', 'row_perc2_text')
                .attr('transform', function(d, i) {return 'translate(' + (matchWidth/2 + 135) + ',' + (i + 1) * bandwidth + ')';})
                .append('text')
                  .style('text-anchor', 'start')
                  .style('dominant-baseline', 'ideographic')
                  .attr('font-size', '0.8em')
                  .text(function (d, i) {return percText[i];})
                  .transition(t);

        d3.selectAll('#row_perc2')
          .append('line')
          .attr('transform', function(d, i) {return 'translate(0,' + i * bandwidth + ')';})
          .attr("class", "line")
          .attr("x2", matchWidthAttr);

        percRight.selectAll('rect').on('mousemove', percmousemove)
                                    .on('mouseover', barmouseover)
                                    .on('mouseout', barmouseout);

        // draw vertical line
        barplot.append('g')
                .attr('transform', 'translate(' + matchWidth/2 + ',0)')
                .append('line')
                .attr("class", "line")
                .attr("y2", percVar.length * bandwidth);
    }

    function drawOther(index) {
      drawSpeedAxis();
      drawSpeedBar(index);
      drawPointPie(index);
    }

    function drawSpeedAxis() {
      if (d3.select('#bar_axis_speed').empty()) {
        speedAxis1.tickValues(d3.range(4).map(i => i * 50 + 50));
        speedAxis2.tickValues(d3.range(5).map(i => i * 50));

        var speedBarAxis = matchSVG.append('g')
                                .attr('id', 'bar_axis_speed')
                                .attr('transform', 'translate(25, -50)');

        speedBarAxis.append('g')
                    .attr('transform', 'translate(' + xPadding + ',' + (matchHeight*2/3 - 140) + ')')
                    .transition()
                      .duration(500)
                        .call(speedAxis1);
        speedBarAxis.append('g')
                    .attr('transform', 'translate(' + matchWidth/2 + ',' + (matchHeight*2/3 - 140) +')')
                    .transition()
                      .duration(500)
                        .call(speedAxis2);

        speedBarAxis.append('g')
                  .attr('transform', 'translate(' + matchWidth/2 + ',' + (matchHeight*2/3 - 110) +')')
                  .append('text')
                  .style('text-anchor', 'middle')
                  .attr('font-size', '0.8em')
                  .text('Serve Speed (mph)');
      }
    }

    function drawSpeedBar(index) {
      d3.select('#barplot_speed').remove();
      var t = d3.transition()
                  .duration(500);
      var barplotSpeed = matchSVG.append('g')
                              .attr('id', 'barplot_speed')
                              .attr('transform', 'translate(25,-30)');
      var bandwidth = 15;
      var winner = matches[index]['winner'];
      var colors = [colorBar[1], colorBar[1]];
      colors[matchPlayers.indexOf(winner - 1)] = colorBar[0];


      // player1 bar
    var speedLeft = barplotSpeed.append('g')
            .attr('transform', 'translate(0' + ',' + (matchHeight/3 - 15) + ')');

    speedLeft.selectAll('rect')
      .data(speedVar).enter()
        .append('g').attr('id', 'row_speed1')
        .append('rect')
          .attr('x', speedScale1(0) + xPadding)
          .attr('y', function(d, i) {return i * bandwidth;})
          .attr('width', 0)
          .attr('height', bandwidth)
          .attr('fill', colors[1])
          .transition(t)
          .attr('x', function(d) {return speedScale1(matches[index][d][1]) + xPadding;})
          .attr('width', function(d) {return speedScale1(0) - speedScale1(matches[index][d][1]);});

      d3.selectAll('#row_speed1')
        .append('line')
        .attr('transform', function(d, i) {return 'translate(0,' + i * bandwidth + ')';})
        .attr("class", "line")
        .attr("x2", matchWidthAttr);

      speedLeft.selectAll('text')
              .data(speedVar).enter()
                .append('g').attr('id', 'row_speed1_text')
                .attr('transform', function(d, i) {return 'translate(' + (matchWidth/2 - 135) + ',' + (i + 1) * bandwidth + ')';})
                .append('text')
                  .style('text-anchor', 'end')
                  .style('dominant-baseline', 'ideographic')
                  .attr('font-size', '0.8em')
                  .text(function (d, i) {return speedText[i];})
                  .transition(t);

        speedLeft.selectAll('rect').on('mousemove', speedmousemove)
                                  .on('mouseover', speedbarmouseover)
                                  .on('mouseout', speedbarmouseout);

        function speedmousemove(p, i) {
          tooltip.style('left', d3.event.pageX + 20 + 'px')
                  .style("top", d3.event.pageY + 20 + "px")
                  .style("display", "inline-block")
                  .html(annotation.speedStats[i]);
        }

        function speedbarmouseover(p, i) {
          d3.selectAll('#row_speed1').filter(function(d, j) {return i == j;})
                                      .style("fill-opacity", '0.2')
                                      .append('text')
                                      .attr('transform', function(d) {return 'translate(' + (matchWidth/2 - speedScale1(0) + speedScale1(matches[index][d][1])) + ',' + ((i + 1) * bandwidth) + ')';})
                                      .style('font-size', '0.8em')
                                      .style('fill', 'black')
                                      .style('text-anchor', 'end')
                                      .style('dominant-baseline', 'ideographic')
                                      .style("fill-opacity", '1')
                                      .text(matches[index][p][1]);
          d3.selectAll('#row_speed2').filter(function(d, j) {return i == j;})
                                      .style("fill-opacity", '0.2')
                                      .append('text')
                                      .attr('transform', function(d) {return 'translate(' + (speedScale1(-matches[index][d][0]) - speedScale1(0)) + ',' + (i + 1) * bandwidth + ')';})
                                      .style('font-size', '0.8em')
                                      .style('fill', 'black')
                                      .style('text-anchor', 'start')
                                      .style('dominant-baseline', 'ideographic')
                                      .style("fill-opacity", '1')
                                      .text(matches[index][p][0]);
          if (matches[index][p][1] * matches[index][p][0] == 0) return;

          var diff = matches[index][p][1] - matches[index][p][0];

          d3.selectAll('#row_speed1').filter(function(d,j) {return i == j;})
            .append('g').attr('id', 'speed_diff-' + i)
            .append('rect')
            .attr('x', speedScale1(0) + xPadding)
            .attr('y', i * bandwidth + 1)
            .attr('width', 0)
            .attr('height', bandwidth - 2)
            .attr('fill', '#29c902')
            .transition(t)
            .style("fill-opacity", '1')
            .attr('x', function(d) {return xPadding + (speedScale1(0) - speedScale1(diff) > 0 ? speedScale1(diff) : speedScale1(0));})
            .attr('width', function(d) {return Math.abs(speedScale1(0) - speedScale1(diff));});
          d3.select('#speed_diff-' + i).append('text')
                                      .attr('transform', function() {return 'translate(' + matchWidth/2 + ',' + (i + 1) * bandwidth + ')';})
                                      .style('font-size', '0.8em')
                                      .style('fill', 'black')
                                      .style('text-anchor', function() {return diff > 0 ? 'end' : 'start';})
                                      .style('dominant-baseline', 'ideographic')
                                      .style("fill-opacity", '1')
                                      .text(Math.abs(diff));
        }

        function speedbarmouseout(p, i) {
          tooltip.style('display', 'none');
          d3.selectAll('#row_speed1').filter(function(d, j) {return i == j;})
                                      .style("fill-opacity", '1');
          d3.selectAll('#row_speed2').filter(function(d, j) {return i == j;})
                                      .style("fill-opacity", '1');
          d3.select('#row_speed1 text').remove();
          d3.select('#row_speed2 text').remove();
          d3.select('#speed_diff-' + i).remove();
        }

      // player2 bar
      var speedRight = barplotSpeed.append('g')
              .attr('transform', 'translate('+ matchWidth/2 + ',' + (matchHeight/3 - 15) + ')');

      speedRight.selectAll('rect')
        .data(speedVar).enter()
          .append('g').attr('id', 'row_speed2')
          .append('rect')
            .attr('x', 0)
            .attr('y', function(d, i) {return i * bandwidth;})
            .attr('width', 0)
            .attr('height', bandwidth)
            .attr('fill', colors[0])
            .transition(t)
            .attr('width', function(d) { return speedScale2(matches[index][d][0]);});

      d3.selectAll('#row_speed2')
        .append('line')
        .attr('transform', function(d, i) {return 'translate(0,' + i * bandwidth + ')';})
        .attr("class", "line")
        .attr("x2", matchWidthAttr);

      speedRight.selectAll('text')
              .data(speedVar).enter()
                .append('g').attr('id', 'row_speed2_text')
                .attr('transform', function(d, i) {return 'translate(135' + ',' + (i + 1) * bandwidth + ')';})
                .append('text')
                  .style('text-anchor', 'start')
                  .style('dominant-baseline', 'ideographic')
                  .attr('font-size', '0.8em')
                  .text(function (d, i) {return speedText[i];})
                  .transition(t);

      speedRight.selectAll('rect').on('mousemove', speedmousemove)
                                .on('mouseover', speedbarmouseover)
                                .on('mouseout', speedbarmouseout);

      // draw vertical line
      barplotSpeed.append('g')
              .attr('transform', 'translate(' + matchWidth/2 + ',' + (matchHeight/3 - 15) + ')')
              .append('line')
              .attr("class", "line")
              .attr("y2", speedVar.length * bandwidth);
    }

    function drawPointPie(index) {
      d3.select('#pieplot').remove();

      // prepare data for pie chart
      var labelText = ['winner', 'error', 'other'];
      var player1 = [];
      var player2 = [];

      pointVar.forEach(function(d) {
        player1.push(matches[index][d][0]);
        player2.push(matches[index][d][1]);
      });
      // calculate other points
      player1[2] = player1[2] - player1[0] - player2[1];
      player2[2] = player2[2] - player2[0] - player1[1];
      // swap error1 and error2 to reflect points won from other's error
      var temp = player2[1];
      player2[1] = player1[1];
      player1[1] = temp;

      var t = d3.transition()
                  .duration(500);
      var pieplot = matchSVG.append('g')
                              .attr('id', 'pieplot')
                              .attr('transform', 'translate(0,' + (matchHeight*2/3 - 70) + ')');

      var pie1 = d3.pie().sort(null)
  	               .value(function(d) { return d; })(player1);
      var pie2 = d3.pie().sort(null)
 	                 .value(function(d) { return d; })(player2);

      var color = d3.scaleOrdinal()
                      .range(["#c9723f","#3e83c7","#f2de49"]);

      var r = 80;
      var r1 = Math.sqrt(matches[index]['total'][0]/(matches[index]['total'][0] + matches[index]['total'][1])) * r;
      var r2 = Math.sqrt(matches[index]['total'][1]/(matches[index]['total'][0] + matches[index]['total'][1])) * r;

      var arc1 = d3.arc()
                   .outerRadius(r1)
                   .innerRadius(0)
                   .cornerRadius(2);

      var labelArc1 = d3.arc()
                       	.outerRadius(r1 - 30)
                       	.innerRadius(r1);

      var arc2 = d3.arc()
                   .outerRadius(r2)
                   .innerRadius(0)
                   .cornerRadius(2);

      var labelArc2 = d3.arc()
                       	.outerRadius(r2 - 30)
                       	.innerRadius(r2);

      var pie1 = pieplot.append('g').attr('id', 'pie1')
              .attr('transform', 'translate('+ (matchWidth/2 - 135) + ',' + 0 + ')')
              .selectAll('arc')
              .data(pie1)
              .enter()
              .append('g')
              .attr('class', 'arc');

      var path1 = pie1.append('path')
          .attr('id', function(d,i){return 'arc1-' + i;})
          .attr('d', arc1)
          .style('fill', function(d, i) { return color(i);})
          .on('mouseover', piemouseover)
          .on('mousemove', piemousemove)
          .on('mouseout', piemouseout);

      // path.transition().duration(1000)
      //       .attrTween('d', arcTween);
      //
      // function arcTween(a) {
      //
      //   return function() {
      //     return arc1(a);
      //   };
      // }

      pie1.append("text")
      	.attr("transform", function(d) { return "translate(" + labelArc1.centroid(d) + ")"; })
      	.text(function(d, i) { return Math.round((d.endAngle - d.startAngle) / (2 * Math.PI) * 100) + '%';})
      	.style("fill", "black")
        .attr('dx', -12)
        .attr('font-size', '12px');

      pie1.append("text")
          .attr("dx", 10)
          .attr("dy", -5)
          .attr('font-size', '15px')
          .append("textPath")
          .attr("xlink:href", function(d, i) {
              return "#arc1-" + i;
          })
          .text(function(d, i) {
              return labelText[i];
          })

      var pie2 = pieplot.append('g').attr('id', 'pie2')
              .attr('transform', 'translate('+ (matchWidth/2 + 185) + ',' + 0 + ')')
              .selectAll('arc')
              .data(pie2)
              .enter()
              .append('g')
              .attr('class', 'arc');

      var path2 = pie2.append('path')
          .attr('id', function(d,i) {return 'arc2-' + i;})
          .attr('d', arc2)
          .style('fill', function(d, i) { return color(i);})
          .on('mouseover', piemouseover)
          .on('mousemove', piemousemove)
          .on('mouseout', piemouseout);

      pie2.append("text")
      	.attr("transform", function(d) { return "translate(" + labelArc2.centroid(d) + ")"; })
      	.text(function(d, i) { return Math.round((d.endAngle - d.startAngle) / (2 * Math.PI) * 100) + '%';})
      	.style("fill", "black")
        .attr('dx', -12)
        .attr('font-size', '12px');

      pie2.append("text")
          .attr("dx", 10)
          .attr("dy", -5)
          .attr('font-size', '15px')
          .append("textPath")
          .attr("xlink:href", function(d, i) {
              return "#arc2-" + i;
          })
          .text(function(d, i) {
              return labelText[i];
          })

      function piemouseover() {
        var current = d3.select(this);
        current.transition().duration(300).attr('transform', 'scale(1.1)')
      }

      function piemousemove() {
        tooltip.style("left", d3.event.pageX - 50 + "px")
                      .style("top", d3.event.pageY + 50 + "px")
                      .style("display", "inline-block")
                      .html(annotation.pie[this.__data__.index]);
      }

      function piemouseout() {
        tooltip.style('display', 'none');
        var current = d3.select(this);
        current.transition().duration(300).attr('transform', 'scale(1.0)')
      }
    }
  }

});
