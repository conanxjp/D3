var test;

(function(){
  //UI configuration
  var itemSize = 18,
    cellSize = itemSize-1,
    width = 800,
    height = 500,
    margin = {top:20,right:20,bottom:300,left:25},
    histSize = 10;

  //formats
  var hourFormat = d3.time.format('%H'),
    dayFormat = d3.time.format('%j'),
    timeFormat = d3.time.format('%Y-%m-%dT%X'),
    monthDayFormat = d3.time.format('%m.%d'),
    timeFormat2 = d3.time.format('%H:%M');

  //data vars for rendering
  var dateExtent = null,
    data = [],
    dayOffset = 0,
    hourOffset = 7,
    colorCalibration = ['#aafaf6', '#8bE0fe', '#61AEfd', '#436Df4', '#4f3Ed5', '#42019e'],
    dailyValueExtent = {};

  //axises and scales
  var axisWidth = 0 ,
    axisHeight = itemSize*24,
    xAxisScale = d3.time.scale(),
    xAxis = d3.svg.axis()
      .orient('top')
      .ticks(d3.time.days,3)
      .tickFormat(monthDayFormat),
    yAxisScale = d3.scale.linear()
      .range([0,axisHeight])
      .domain([0,24]),
    yAxis = d3.svg.axis()
      .orient('left')
      .ticks(5)
      .tickFormat(d3.format('02d'))
      .scale(yAxisScale);

  initCalibration();

  var svg = d3.select('[role="heatmap"]');
  var heatmap = svg
    .attr('width',width)
    .attr('height',height)
  .append('g')
    .attr('width',width-margin.left-margin.right)
    .attr('height',height-margin.top-margin.bottom)
    .attr('transform','translate('+margin.left+','+margin.top+')');
  var histograms = d3.select('[role="histograms"]')
                      .attr('width', width)
                      .attr('height', 300);

  var rect = null;

  // d3.json('pm25.json',function(err,data){
  //   data = data.data;
  //   data.forEach(function(valueObj){
  //     valueObj['date'] = timeFormat.parse(valueObj['timestamp']);
  //     var day = valueObj['day'] = monthDayFormat(valueObj['date']);
  //
  //     var dayData = dailyValueExtent[day] = (dailyValueExtent[day] || [1000,-1]);
  //     var pmValue = valueObj['value']['PM2.5'];
  //     dayData[0] = d3.min([dayData[0],pmValue]);
  //     dayData[1] = d3.max([dayData[1],pmValue]);
  //   });

  d3.tsv('01_01_2014-12_31_2014q[1].xls', function (error, csv_data) {
    var curDate = new Date(1418791370 * 1000);
    console.log(csv_data);
    csv_data.forEach(function (d, i) {
      var date = new Date(parseInt(d['creation_date']) * 1000);
      if (curDate.getUTCHours() != date.getUTCHours()) {
        data.push({date: date, count:1})
        curDate = date;
      }
      else {
        ++data[data.length - 1].count;
      }
    });
  });
  d3.tsv('01_01_2014-12_31_2014q[2].xls', function (error, csv_data) {
    var curDate = new Date();
    csv_data.forEach(function (d, i) {
      var date = new Date(parseInt(d['creation_date']) * 1000);
      if (curDate.getUTCHours() != date.getUTCHours()) {
        data.push({date: date, count:1})
        curDate = date;
      }
      else {
        ++data[data.length - 1].count;
      }
    });
  });
    d3.tsv('01_01_2014-12_31_2014q[3].xls', function (error, csv_data) {
      var curDate = new Date();
      csv_data.forEach(function (d, i) {
        var date = new Date(parseInt(d['creation_date']) * 1000);
        if (curDate.getUTCHours() != date.getUTCHours()) {
          // console.log(curDate.getUTCHours(), date.getUTCHours());
          data.push({date: date, count:1})
          curDate = date;
        }
        else {
          ++data[data.length - 1].count;
        }
      });

      test = data;


    dateExtent = d3.extent(data,function(d){
      return d.date;
    });

    axisWidth = itemSize*(dayFormat(dateExtent[1])-dayFormat(dateExtent[0])+1);

    //render axises
    xAxis.scale(xAxisScale.range([0,axisWidth]).domain([dateExtent[0],dateExtent[1]]));
    svg.append('g')
      .attr('transform','translate('+margin.left+','+margin.top+')')
      .attr('class','x axis')
      .call(xAxis)
    .append('text')
      .text('date')
      .attr('transform','translate('+axisWidth+',-10)');

    svg.append('g')
      .attr('transform','translate('+margin.left+','+margin.top+')')
      .attr('class','y axis')
      .call(yAxis)
    .append('text')
      .text('time')
      .attr('transform','translate(-10,'+axisHeight+') rotate(-90)');

    //render heatmap rects
    dayOffset = dayFormat(dateExtent[0]);
    rect = heatmap.selectAll('rect')
      .data(data)
    .enter().append('rect')
      .attr('width',cellSize)
      .attr('height',cellSize)
      .attr('x',function(d){
        return itemSize*(dayFormat(d.date)-dayOffset);
      })
      .attr('y',function(d){
        return ((parseInt(hourFormat(d.date)) + hourOffset) % 24)*itemSize;
      })
      .attr('fill','#ffffff')
      .on('click', mouseclick);

    function mouseclick(d, i) {
      heatmap.selectAll('rect')
              .attr('fill-opacity', '1')
              .attr('stroke', 'none');
      // console.log(d, i, d.date.getUTCHours());
      heatmap.selectAll("[x='" + itemSize * (dayFormat(d.date) - dayOffset) + "']")
              .attr('fill-opacity', '0.5');
      heatmap.selectAll("[y='" + itemSize * (d.date.getUTCHours()) + "']")
              .attr('fill-opacity', '0.5');
      // console.log("[x='" + itemSize * (dayFormat(d.date) - dayOffset) + "', y='" + itemSize * (d.date.getUTCHours() - hourOffset) + "'] ");
      heatmap.select("[x='" + itemSize * (dayFormat(d.date) - dayOffset) + "'][y='" + itemSize * d.date.getUTCHours() + "']")
              .attr('stroke', 'black');
      var hoursInDayData = [];
      var daysOnHourData = [];
      rect.filter(function(p, j) {
        if (p.date.getDate() == d.date.getDate())
          hoursInDayData.push({date: p.date, count:p.count});
        if (p.date.getUTCHours() == d.date.getUTCHours())
          daysOnHourData.push({date: p.date, count:p.count});
      });
      hoursInDayData.sort((a, b) => (a.date.getUTCHours() - b.date.getUTCHours()));
      daysOnHourData.sort((a, b) => (a.date.getDate() - b.date.getDate()));
      // console.log(hoursInDayData, daysOnHourData);
      drawHourlyCHart(hoursInDayData, daysOnHourData);
    }

    function drawHourlyCHart(hoursData, daysData) {
      histograms.select('#hist').remove();
      var selectHour = daysData[0].date.getUTCHours();
      var selectDay = hoursData[0].date.getDate();
      var hist = histograms.append('g').attr('id', 'hist')
                            .attr('transform','translate(0, -300)');
      // console.log(daysData);
      var histScale = d3.scale.linear()
        .range([0,100])
        .domain([0,50]);

      var dayAxisScale = d3.time.scale(),
          dayAxis = d3.svg.axis()
                        .orient('bottom')
                        .ticks(d3.time.days,3)
                        .tickFormat(monthDayFormat),
          hourAxisScale = d3.scale.linear()
                              .range([0, 24*histSize])
                              .domain([0, 24]),
          hourAxis = d3.svg.axis()
                        .orient('bottom')
                        .ticks(5)
                        .tickFormat(d3.format('02d'))
                        .scale(hourAxisScale),
          countAxisScale = d3.scale.linear()
                              .range([0,-100])
                              .domain([0,50]),
          countAxis = d3.svg.axis()
                              .orient('left')
                              .ticks(3)
                              .tickFormat(d3.format('02d'))
                              .scale(countAxisScale);;

      hist.append('g')
            .attr('transform', 'translate(30, 460)')
            .attr('class', 'hour axis')
            .call(hourAxis)
            .append('text')
            .text('hour')
            .attr('transform', 'translate(250, 10)');

      hist.append('g')
            .attr('transform', 'translate(30, 460)')
            .attr('class', 'hour count axis')
            .call(countAxis)
            .append('text')
            .text('# of questions')
            .attr('transform', 'translate(0, -100)')


      dayAxis.scale(xAxisScale.range([-10,190]).domain([dateExtent[0],dateExtent[1]]));
      hist.append('g')
            .attr('transform', 'translate(400, 460)')
            .attr('class', 'day axis')
            .call(dayAxis)
            .append('text')
            .text('day')
            .attr('transform', 'translate(200, 10)');

      hist.append('g')
            .attr('transform', 'translate(390, 460)')
            .attr('class', 'day count axis')
            .call(countAxis)
            .append('text')
            .text('# of questions')
            .attr('transform', 'translate(0, -100)')

      var t = d3.transition()
                  .duration(500);
      hist.append('g').attr('id', 'hist_hours')
                  .attr('transform', 'translate(30, -100)')
                  .selectAll('rect')
                  .data(hoursData)
                  .enter()
                  .append('rect')
                  .attr('x', function(d, i) {return d.date.getUTCHours() * histSize;})
                  .attr('y', height + 50)
                  .attr('width', histSize)
                  .attr('height', 0)
                  .transition(t)
                  .attr('y', function(d, i) { return height + 50 - histScale(d.count);})
                  .attr('height', function(d, i) { return histScale(d.count)})
                  .attr('fill', 'grey')
                  .filter(function(d, i) {
                    return d.date.getUTCHours() == selectHour;
                  }).attr('fill', 'black');;
      hist.append('g').attr('id', 'hist_days')
                  .attr('transform', 'translate(400, 450)')
                  .selectAll('rect')
                  .data(daysData)
                  .enter()
                  .append('rect')
                  .attr('x', function(d, i) {return (d.date.getDate() - 12) * histSize;})
                  .attr('y', 0)
                  .attr('width', histSize)
                  .attr('height', 0)
                  .transition(t)
                  .attr('y', function(d, i) { return - histScale(d.count);})
                  .attr('height', function(d, i) { return histScale(d.count)})
                  .attr('fill', 'grey')
                  .filter(function(d, i) {
                    return d.date.getDate() == selectDay;
                  }).attr('fill', 'black');

        d3.select('#hist_hours').append('text')
        .text('# of questions on ' + monthDayFormat(hoursData[0].date))
        .attr('transform', 'translate(100, 450)')

        d3.select('#hist_days').append('text')
        .text('# of questions at ' + selectHour + ':00')
        .attr('transform', 'translate(100, -100)')
    }

    rect.filter(function(d){ return d.count>0;})
      .append('title')
      .text(function(d){
        return monthDayFormat(d.date)+' '+d.count;
      });

    renderColor();
  });

  function initCalibration(){
    d3.select('[role="calibration"] [role="example"]').select('svg')
      .selectAll('rect').data(colorCalibration).enter()
    .append('rect')
      .attr('width',cellSize)
      .attr('height',cellSize)
      .attr('x',function(d,i){
        return i*itemSize;
      })
      .attr('fill',function(d){
        return d;
      });

    //bind click event
    d3.selectAll('[role="calibration"] [name="displayType"]').on('click',function(){
      renderColor();
    });
  }

  function renderColor(){
    var renderByCount = document.getElementsByName('displayType')[0].checked;

    rect
      .filter(function(d){
        return (d.count>=0);
      })
      .transition()
      .delay(function(d){
        return (dayFormat(d.date)-dayOffset)*15;
      })
      .duration(500)
      .attrTween('fill',function(d,i,a){
        //choose color dynamicly
        var colorIndex = d3.scale.quantize()
          .range([0,1,2,3,4,5])
          .domain([0,50]);

        return d3.interpolate(a,colorCalibration[colorIndex(d.count)]);
      });
  }

  //extend frame height in `http://bl.ocks.org/`
  d3.select(self.frameElement).style("height", "600px");

})();
