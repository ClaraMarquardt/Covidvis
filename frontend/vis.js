// ----------------------------------------
// ### INITIALIZATION 
// ----------------------------------------

// ### VARIABLES
//--------------------

/// * CANVAS

/// Basic variables
width     = 600;
height    = 800;
margin    = 10;
padding   = 10;

/// Additional variables
adj       = 10;
adj_vis_w = 40;

/// Graph-specific variables
height_vis1 = height/2
height_vis2 = height/2
    

/// * HELPERS

/// Colour scale
color_min = 0
color_max = 5

step  = d3.scaleLinear()
          .domain([1, 8])

color = d3.scaleLinear()
          .range(['#d73027', '#f46d43', '#fdae61', '#fee08b', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850'])
          .interpolate(d3.interpolateHcl); 

// Time format
timeConv = d3.timeParse("%m/%-d/%y");
timeForm = d3.timeFormat("%m/%-d/%y");

// Bisect
bisect = d3.bisector(function(d) { return d.date; }).left;

// Axes
xScale_main = d3.scaleTime().range([0,width - adj_vis_w ])
yScale_main = d3.scaleLinear().rangeRound([height_vis2, 60])

xScale_mini = d3.scaleTime().range([0,(width*2)/5 - adj_vis_w ])
yScale_mini = d3.scaleLinear().rangeRound([height_vis2/3, 0])
            

/// * PARAMETERS
relax_date_default_minus = "4/30/20"
relax_date_default       = "5/1/20"
relax_date_current       = relax_date_default
relax_date_default_plus  = "5/2/20"
scale_factor_default     = Math.random() * (1.5 - 1.1) + 1.1

state_default            = "MA"
state_default_id         = 25
county_default           = "Suffolk"
county_default_id        = 25025

/// * MISC GLOBALS
today_raw = new Date();
dd        = String(today_raw.getDate())
mm        = String(today_raw.getMonth() + 1).padStart(2, '0')
today     = mm + '/' + dd + '/20'

init_indicator = 0

data_column_current           = "cummulative_predicted"
county_data_crosswalk_current = ""
county_data_master            = ""
county_data_current           = ""
map_data_current              = ""

// ----------------------------------------
// ### MAIN
// ----------------------------------------

// Make client-side API call to obtain the user's location
$.getJSON("http://ip-api.com/json", function (longlatdata, status) {

    // Inspect the data 
    console.log(longlatdata)
    latitude  = longlatdata.lat
    longitude = longlatdata.lon

    // Testing with Boston lat/long
    // latitude = 42.361145
    // longitude = -71.057083

    // Make reverse geocoding request to obtain county
    rev_geocoding_request = "https://maps.googleapis.com/maps/api/geocode/json?latlng="+latitude+","+longitude+"&result_type=administrative_area_level_2&key=AIzaSyAttZrqwRZ-38y-a4AFr8SfO2qiNlJusLc"
    $.getJSON(rev_geocoding_request, function (locationdata, status) {
      
      // Obtain address
      address  = locationdata.results[0].formatted_address
      if (address.split(",").lenth==3) {
        county   = address.split(",")[0].split(" ")[0].trim()
        state    = address.split(",")[1].trim()
        country  = address.split(",")[2].trim()
      } else {
        county   = ""
        state    = ""
        country  = ""
      }  

      // Inspect the data 
      console.log(county)
      console.log(state)
      console.log(country)

      // Load the visualization crosswalk
      county_data_crosswalk_link = d3.csv("/load_county_data_crosswalk")

      county_data_crosswalk_link.then(function(county_data_crosswalk) {

        // Helper functions  
        /// InitializeCrosswalk
        function InitializeCrosswalk(raw_data) {
          
            /// Group data
            raw_data_group = d3.nest() 
                             .key(function(d) {return d.state;})
                             .entries(raw_data)       
          
            /// Return data
            return(raw_data_group)
          
        }

        /// States
        function states(crosswalk_data) {
           states_list = []
           crosswalk_data.forEach(function(d) {
              states_list.push(d.key)
            }) 
          return(states_list) 
        }

        /// Counties
        function counties(crosswalk_data, state) {
          counties_list = []
           crosswalk_data.forEach(function(d) {
              if (d.key==state) {
                d.values.forEach(function(e) {
                  counties_list.push(e.county)
                })
              }
            }) 
          return(counties_list) 
        }

        // Initialize the data
        county_data_crosswalk_current = InitializeCrosswalk(county_data_crosswalk)

        // Determine state & county choice
        if (country=="USA" & states(county_data_crosswalk_current).includes(state)) {

          // Customizing state
          state_choice      = state
          state_choice_rank = states(county_data_crosswalk_current).indexOf(state_choice)
          state_choice_id   = +county_data_crosswalk_current[state_choice_rank].values[0].county_id.slice(0,-3)

          // Customizing county
          if (counties(county_data_crosswalk_current, state).includes(county)) {
            county_choice      = county
            county_choice_rank = counties(county_data_crosswalk_current, state_choice).indexOf(county)
            county_choice_id   = +county_data_crosswalk_current[state_choice_rank].values[county_choice_rank].county_id

          } else {
            county_choice    = "none"
            county_choice_id =  0
          }
          
        } else {

          // Stick with default location
          state_choice        = state_default
          state_choice_id     = state_default_id
          state_choice_rank   = states(county_data_crosswalk_current).indexOf(state_choice)
          county_choice       = county_default
          county_choice_id    = county_default_id

        }

        // Load the visualization data
        county_data_link = d3.csv("/load_county_data?state="+state_choice)
        map_data_link    = d3.json("/frontend/data/map/us.json")

        county_data_link.then(function(county_data_raw) {
          map_data_link.then(function(map_data_raw) {

          // ----------------------------------------
          // ### FUNCTIONS
          // ----------------------------------------

          /// InitializeData
          // ----------------------------------------
          function InitializeData(raw_data) {
          
            /// Format data
            raw_data.forEach(function(d) {
                d.county                = d.county
                d.state                 = d.state;
                d.county_id             = +d.county_id;
                d.r_t                   = +d.r_t
                d.date                  = timeConv(d.date)
                d.cummulative_deaths    = +d.cummulative_deaths;
                d.cummulative_predicted = d.cummulative_predicted*0.04
          
            })
          
            /// Group data
            raw_data_group = d3.nest() 
                             .key(function(d) {return d.county;})
                             .entries(raw_data);
          
            /// Return data
            return(raw_data_group)
          
          }
          
          
          /// ScaleData
          // ----------------------------------------
          function ScaleData(county_data, relax_date = timeConv(relax_date_default), scale_factor = scale_factor_default) {
          
            /// Scale data
            county_data.forEach(function(d) {
              d.values.forEach(function(f) {
                if (f.date>=(relax_date)) {
                  f.cummulative_deaths = f.cummulative_deaths*scale_factor
                } else {
                  f.cummulative_deaths = f.cummulative_deaths
                }
                if (f.date>=(relax_date)) {
                  f.cummulative_predicted = f.cummulative_predicted*scale_factor
                } else {
                  f.cummulative_predicted = f.cummulative_predicted
                }
              })
            })
          
            /// Update breakpoint
            relax_date_current = relax_date

            /// Return data
            return(county_data)
          
          }
          
          /// InitializeGraph
          // ----------------------------------------
          function InitializeGraph(county_data, data_column) {
          
            /// xscale
            minDate = d3.min(county_data, function(d) {
                return d3.min(d.values, function (f) {
                    return f.date
                });
            });
            maxDate = d3.max(county_data, function(d) {
                return d3.max(d.values, function (f) {
                    return f.date
                });
            });
            
            /// yscale
            minValue = d3.min(county_data, function(d) {
                return d3.min(d.values, function (f) {
                    return f[data_column]
                });
            });
            maxValue = d3.max(county_data, function(d) {
                return d3.max(d.values, function (f) {
                    return f[data_column]
                });
            });
          
            return {
                  minDate: minDate,
                  maxDate: maxDate,
                  minValue: minValue,
                  maxValue: maxValue*1.4
              };
          }
          
          /// DrawTop
          // ----------------------------------------
          function DrawTop() {
             
            svg_top.append("g")
                   .append("text")
                   .text("Model Projections")
                   .attr("transform", "translate(" + ( width+50)+ ","+(20)+")")
                   .style("font-size", "20px")
            

            states(county_data_crosswalk_current).forEach(function(d,i) {

              svg_top.append('g')
                    .attr("transform", "translate(" + ( 350+i*150)+ ",50)")
                    .append('foreignObject')
                    .attr('width','200')
                    .attr('height','70')
                    .append('xhtml:div')
                    .on("click", function() {
                      $(".statebutton").removeClass("active")
                      $(".statebutton").removeAttr('data-toggle', null)
                      d3.select(this).attr('data-toggle','button')
                      $(this).addClass("active")
                      UpdateData(state = d)
                      })
                    .append("g").append('xhtml:button')
                    .attr('class','btn btn-outline-dark btn-xs statebutton')
                    .attr('id','button_'+(i))
                    .html("&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp"+d+"&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp")

            })


            // Highlight button
            d3.select("#button_"+state_choice_rank).attr('data-toggle','button')
            $("#button_"+state_choice_rank).addClass("active")
            $("#button_"+state_choice_rank).attr("aria-pressed",true)


          }
          
          
          /// DrawMap
          // ----------------------------------------
          function DrawMap(map_data, county_data, state_choice, state_choice_id, county_choice, county_choice_id) {
          
            // Intialize map objects
            states_data = topojson.feature(map_data, map_data.objects.states),
            state       = states_data.features.filter(function(d) { return d.id === state_choice_id; })[0];
           
            projection = d3.geoAlbers()
            projection.scale(1).translate([0, 0])
            path       = d3.geoPath().projection(projection)
          
            b = path.bounds(state)
            s = .95 / Math.max((b[1][0] - b[0][0]) / (width-20), (b[1][1] - b[0][1]) / (height_vis1*0.75))
            t = [(width - s * (b[1][0] + b[0][0])) / 2, (height_vis1 - s * (b[1][1] + b[0][1])) / 2];
           
            projection.scale(s).translate(t)
          
            // Generate header
            svg_map.append("g")
                  .append("text")
                  .text("Current infection rate (R t)")
                  .attr("transform", "translate(" + ( width/2-100)+ ","+(15)+")").style("font-size", "15px")
          
            // Generate canvas objects
            svg_map.append("path")
                   .datum(topojson.mesh(map_data, map_data.objects.states, function(a, b) { return a !== b; }))
                   .attr("class", "mesh")
                   .attr("d", path);
          
            svg_map.append("path")
                   .datum(state)
                   .attr("class", "outline")
                   .attr("d", path)
                   .attr('id', 'land');
          
            svg_map.append("clipPath")
                   .attr("id", "clip-land")
                   .append("use")
                   .attr("xlink:href", "#land");
          
            svg_map.selectAll("path")
                    .data(topojson.feature(map_data, map_data.objects.counties).features)
                    .enter()
                    .append("path")
                    .attr("d", path)
                    .attr('class', function(d) {
                      if(d.id==county_choice_id) {
                        return("county county-hover")
                      } else {
                        return("county")
                      }
                    })
                    .attr('county-name', function(d) {
                      county_name = "undefined"
                      county_data.forEach(function(e) {
                        if(e.values[0].county_id==d.id) {
                          county_name = e.key
                        }
                      })
                      return(county_name)
                    })
                    .attr('county-id', function(d) {
                      return d.id
                    })
                    .attr("clip-path", "url(#clip-land)")
                    .on("mouseover", function(d) {
                      
                      d3.selectAll(".county-hover").attr("class", "county")
                      d3.select(this).attr("class", "county county-hover")
               
                      county_data.forEach(function(e) {
                        
                        if(e.values[0].county_id==d.id) {
                          d3.selectAll(".ghost-line").attr("class", function(f) {
                            if (f.key==e.values[0].county) {
                              return("ghost-lineactive ghost-line")
                            } else {
                              return("ghost-line")
          
                            }
                          })
                          d3.selectAll(".serie_label").attr("class", function(f) {
                            if (f.id==e.values[0].county) {
                              return("serie_labelactive serie_label")
                            } else {
                              return("serie_label")
          
                            }
                          })
                        }
                      }) 
                    })
                  .on("click", function(d) {
                    d3.selectAll(".county-hover-fixed").attr("class", "county")
                    d3.select(this).attr("class", "county county-hover-fixed")
                    click_id = d3.select(this).attr("county-id")
                    d3.selectAll(".county").on("mouseout", function(d) {
                      d3.selectAll(".county-hover").attr("class", "county")
          
                      county_data.forEach(function(e) {
                        
                        if(e.values[0].county_id==click_id) {
                          d3.selectAll(".ghost-line").attr("class", function(f) {
                            if (f.key==e.values[0].county) {
                              return("ghost-lineactive ghost-line")
                            } else {
                              return("ghost-line")
          
                            }
                          })
                          d3.selectAll(".serie_label").attr("class", function(f) {
                            if (f.id==e.values[0].county) {
                              return("serie_labelactive serie_label")
                            } else {
                              return("serie_label")
          
                            }
                          })
                        }
                      }) 
          
                    })
                  })
          
            // Link counties to rt & colour based on Rt
            d3.selectAll(".county").each(function(d,i) {
              county = d3.select(this).attr("county-name")
              color_choice = "#ccc"
              d3.select(this).attr("fill", function() {
                county_data.forEach(function(e) {
                  if(e.key==county) {
                    color_choice=color((e.values[bisect(county_data[county_data.length-1].values, timeConv(today), 1)].r_t))
                  }
                })
                return(color_choice)
              })
            })
          
            d3.selectAll(".county").each(function(d,i) {
              county = d3.select(this).attr("county-name")
              rt     = "undefined"
              d3.select(this).attr("rt", function() {
                county_data.forEach(function(e) {
                  if(e.key==county) {
                    rt=e.values[bisect(county_data[county_data.length-1].values, timeConv(today), 1)].r_t 
                  }
                })
                return(rt)
              })
            })
          
            // Generate legend
            circle1 = svg_map.append("g")
            circle1.append("circle").attr("fill", color(color_min))
                   .attr("r", 10)
                   .attr("cx", function (d) { return width/2-50; })
                   .attr("cy", function (d) { return height-410; })
            circle1.append("text")
                   .text(color_min.toFixed(2))
                   .attr("transform", "translate(" + ( width/2-30)+ ","+(height-410)+")")
            
            circle2 = svg_map.append("g")
            circle2.append("circle")
                   .attr("fill", color(color_max))
                   .attr("r", 10)
                   .attr("cx", function (d) { return width/2+50; })
                   .attr("cy", function (d) { return height-410; })
          
            circle2.append("text")
                   .text(color_max.toFixed(2))
                   .attr("transform", "translate(" + ( width/2+70)+ ","+(height-410)+")")
          
          }
           
          /// DrawGraphHelper
          // ----------------------------------------
          function DrawGraphHelper(county_data, data_column, svg_id) {
          
            // Generate header
            d3.selectAll("#svg_graph_"+(svg_id+1))
              .append("g")
              .append("text")
              .text("Predicted confirmed cases")
              .attr("transform", "translate(" + ( width/2-80)+ ","+(15)+")")
              .style("font-size", "15px")
          
            // Generate buttons
             container2 = d3.selectAll("#svg_graph_"+(svg_id+1))
                           .append('g')
                           .attr("transform", "translate(" + ( 70)+ ",65)")
                           .append('foreignObject')
                           .attr('width','200')
                           .attr('height','70')
                           .append('xhtml:div')
                           .on("click", function() {
                              d3.select("#button2")
                                .attr('data-toggle','button')
                              $("#button1").removeAttr('data-toggle', null)
                              $(".btn").removeClass("active")
                              $(this).addClass("active")
                              UpdateVisualization(data_column="cummulative_predicted", relax_date=relax_date_current)
                           })
                            .append("g").append('xhtml:button')
                            .attr('class','btn btn-outline-dark btn-xs')
                            .attr('id','button2')
                            .html('&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbspCumulative cases&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp')
              
            container1 = d3.selectAll("#svg_graph_"+(svg_id+1))
                           .append('g')
                           .attr("transform", "translate(" + ( 70)+ ",90)")
                           .append('foreignObject')
                           .attr('width','200')
                           .attr('height','70')
                           .append('xhtml:div')
                           .on("click", function() {
                             d3.select("#button1").attr('data-toggle','button')
                             $("#button2").removeAttr('data-toggle', null)
                             $(".btn").removeClass("active");
                             $(this).addClass("active")
                             UpdateVisualization(data_column="cummulative_deaths", relax_date=relax_date_current)
                           })
                           .append("g").append('xhtml:button')
                           .attr('class','btn btn-outline-dark btn-xs')
                           .attr('id','button1')
                           .html('&nbsp&nbspDaily cases&nbsp&nbsp')  
          
            // Set default buttons    
            d3.select("#button2").attr('data-toggle','button')
            $("#button2").addClass("active")
            $("#button2").attr("aria-pressed",true)
          
            // Generate statistics box
            container3 = d3.selectAll("#svg_graph_"+(svg_id+1))
                           .append('g')
                           .attr("transform", "translate(" + ( width/2-50)+ ",65)")
                           .append('foreignObject')
                           .attr('width','200')
                           .attr('height','70')
                           .append('xhtml:div')
                           .append("g")
                           .attr("class", "card  text-center border-dark mb-3")
          
            container3.append("g")
                      .append('xhtml:div')
                      .attr("class", "card-body")
                      .attr('width','200')
                      .attr('height','55')
                      .html("   <br> <br>  ")
                      .attr("id", "div_stat")
          
            // Initialize statistics box
            i            = bisect(county_data[county_data.length-1].values, timeConv(today), 1)
            deathtotal   = county_data[county_data.length-1].values[i][data_column_current]
            
            if (d3.select("#button1").attr('data-toggle')=='button') {
              d3.selectAll("#div_stat").html(Math.round(deathtotal) + " cumulative cases as of " +timeForm(timeConv(today)))
            } else {
              d3.selectAll("#div_stat").html("&nbsp&nbsp&nbsp" +Math.round(deathtotal) + " daily cases on " +timeForm(timeConv(today)))
            }

          }
          
          /// DrawGraph
          // ----------------------------------------
          function DrawGraph(county_data, data_column, svg_id) {
         
            /// Initialize
            // ----------------------------------------
  
            // Initialize axes   
            graphsetup = InitializeGraph(county_data, data_column)

            // Helpers
            if (svg_id==-1) {

              // Draw Helpers
              DrawGraphHelper(county_data, data_column, svg_id)
          
              // Misc var
              height_focus_temp = 160
              height_temp       = height_vis2

              // Scales
              xScale_main.domain([graphsetup.minDate,graphsetup.maxDate])
              yScale_main.domain([graphsetup.minValue,graphsetup.maxValue])
              
              xScale_temp = xScale_main
              yScale_temp = yScale_main
             
              // Axes
              xaxis = d3.axisBottom()
                        .ticks(d3.timeDay.every(60))
                        .tickFormat(d3.timeFormat('%b %d'))
                        .scale(xScale_main)
              
              yaxis = d3.axisLeft()
                        .scale(yScale_main)

              // Brush label
              brush_label = d3.selectAll("#svg_graph_"+(svg_id+1))
                              .append("g")
                              .append('text')
                              .attr('id', 'brush_label_'+svg_id)
                              .style("font-weight","normal")
                              .style("font-size","90%")
                              .attr("transform", 'rotate(270)')
                              .attr('x', -230)
                              .attr('y', (xScale_temp(timeConv(relax_date_default)) + adj_vis_w -(xScale_temp(timeConv(relax_date_default_plus)) - xScale_temp(timeConv(relax_date_default_minus)))))
                              .text("Relax start date")

            } else {

              // Misc var
              height_focus_temp = 160/3
              height_temp       = height_vis2/3

              // Scales
              xScale_mini.domain([graphsetup.minDate,graphsetup.maxDate])
              yScale_mini.domain([graphsetup.minValue,graphsetup.maxValue])

              xScale_temp = xScale_mini
              yScale_temp = yScale_mini

              // Axes
              xaxis = d3.axisBottom()
                        .ticks(d3.timeDay.every(60))
                        .tickFormat(d3.timeFormat('%b %d'))
                        .scale(xScale_mini)
              
              yaxis = d3.axisLeft()
                        .scale(yScale_mini)

            }
           

            /// Draw
            // ----------------------------------------
  
            // Initialize lines   
            line = d3.line()
                     .x(function(d) { return xScale_temp(d.date); })
                     .y(function(d) { return yScale_temp(d[data_column]);});
          
          
            // Draw axes    
            d3.selectAll("#svg_graph_"+(svg_id+1))
              .append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(" + adj_vis_w + "," + height_temp + ")")
              .call(xaxis);
                
            d3.selectAll("#svg_graph_"+(svg_id+1))
              .append("g")
              .attr("class", "y axis")
              .attr("transform", "translate(" + adj_vis_w + ",0)")
              .call(yaxis)
              .append("text")
              .attr("transform", function() {
                if (svg_id==-1) {
                  return("translate(" + 0 + ",60) rotate(-90)")
                } else {
                  return("translate(" + 0 + ",0) rotate(-90)")
                }
              })
              .attr("dy", ".75em")
              .attr("y", 6)
              .style("text-anchor", "end")
              .text("Cases")
            
            // Draw main objects - layer: svg_graph_layer_1
            svg_graph_layer_1 =  d3.selectAll("#svg_graph_"+(svg_id+1))
                                   .append("g")
                                   .attr("transform", "translate(" + adj_vis_w + ",0)")
          
            lines = svg_graph_layer_1.selectAll("lines")
                                     .data(function() {
                                      if (svg_id==-1) {
                                        return([county_data[county_data.length-1]])
                                      } else {
                                        return([county_data[svg_id]])
                                      }
                                     })
                                     .enter()
                                     .append("g")
                                     .attr("transform", "translate(" + 0 + ",0)")
                 
            lines.append("path")
                 .attr("class", "line")
                 .attr("d", function(d) { return line(d.values); });
                
            lines.append("text")
                  .attr("class", function(d) {
                    if (d.key==county_default) {
                      return("serie_labelactive serie_label")
                    } else {
                      return("serie_label")
                    }
                  })
                  .attr("x", 5)
                  .datum(function(d) {
                    return {
                        id: d.key,
                        maxDate: d3.max(d.values, function(f) {
                          return f.date
                        }),
                        maxValue: d3.max(d.values, function(f) {
                          return f[data_column]
                        })
                    }; 
                  })
                  .attr("transform", function(d) {
                    return "translate(" + (xScale_temp(d.maxDate) + 10) + "," + (yScale_temp(d.maxValue) + 5 )+ ")"; 
                  })
                  .text(function(d) { return d.id; }); 
                 
            ghost_lines = lines.append("path")
                                .attr("class", function(d) {
                                  if (d.key==county_default) {
                                    return("ghost-lineactive ghost-line")
                                  } else {
                                    return("ghost-line")
                                  }
                                })
                               .attr("d", function(d) { return line(d.values); }); 
          
            // Draw main objects - layer: svg_graph_layer_2
            svg_graph_layer_2 =  d3.selectAll("#svg_graph_"+(svg_id+1))
                                    .append("g")
                                    .attr("transform", "translate(" + adj_vis_w + ",0)")


            focus = svg_graph_layer_2.append('g')
                                     .append('line')
                                     .attr("class", function() {
                                        if(svg_id==-1) {
                                          return("focus focus_main")
                                        } else {
                                          return("focus focus_mini")
                                        }
                                     })
                                     .attr("id","focus_"+svg_id)
                                     .attr("stroke", "black")
                                     .attr("y1", height_focus_temp)
                                     .attr("y2", height_temp)
                                     .attr("x1", xScale_temp(timeConv(today)))
                                     .attr("x2", xScale_temp(timeConv(today)))
                                     .style("stroke-dasharray", "3,3")

            svg_graph_layer_2.append("rect")
                             .attr("class",function() {
                                if(svg_id==-1) {
                                  return("leftrect leftrect_main")
                                } else {
                                  return("leftrect leftrect_mini")
                                }
                              })
                             .style("opacity",0)
                             .attr("id","leftrect_"+svg_id)
                             .attr("height", height_temp-height_focus_temp)
                             .attr("transform", "translate(" +  0+ ","+height_focus_temp+")")
                             .attr('width', xScale_temp.range()[1])
                             .on("mousemove", function () {

                                if (svg_id==-1) {
                                  x0           = xScale_main.invert(d3.mouse(this)[0]);
                                  i            = bisect(county_data[county_data.length-1].values, x0, 1);
                                  selectedData = county_data[county_data.length-1].values[i]
                                  deathtotal   = county_data[county_data.length-1].values[i][data_column]
                
                                  if ( d3.select("#button1").attr('data-toggle')=='button') {
                                    d3.selectAll("#div_stat").html(Math.round(deathtotal) + " cumulative cases as of " + timeForm(xScale_main.invert(d3.mouse(this)[0])))
                                  } else {
                                   d3.selectAll("#div_stat").html("" + Math.round(deathtotal) + " daily cases on " + timeForm(xScale_main.invert(d3.mouse(this)[0])))
                                  }
                                } else {
                                  x0           = xScale_mini.invert(d3.mouse(this)[0]);
                                  i            = bisect(county_data[county_data.length-1].values, x0, 1);
                                  selectedData = county_data[county_data.length-1].values[i]
                                  deathtotal   = county_data[county_data.length-1].values[i][data_column]
                
                                  if ( d3.select("#button1").attr('data-toggle')=='button') {
                                    d3.selectAll("#div_stat").html(Math.round(deathtotal) + " cumulative cases as of " + timeForm(xScale_mini.invert(d3.mouse(this)[0])))
                                  } else {
                                   d3.selectAll("#div_stat").html("" + Math.round(deathtotal) + " daily cases on " + timeForm(xScale_mini.invert(d3.mouse(this)[0])))
                                  }
                                }
                  
                                d3.selectAll(".focus_main")
                                   .attr("x1", xScale_main(selectedData.date))
                                   .attr("x2", xScale_main(selectedData.date))

                                 d3.selectAll(".focus_mini")
                                   .attr("x1", xScale_mini(selectedData.date))
                                   .attr("x2", xScale_mini(selectedData.date))

                            })
              
            brush = svg_graph_layer_2.append('g')
                                     .append('line')
                                     .attr("class", function() {
                                       if(svg_id==-1) {
                                          return("brush brush_main")
                                        } else {
                                          return("brush brush_mini")
                                        }
                                      })
                                      .attr("id","brush_"+svg_id)
                                      .attr("stroke-width", "5")
                                      .attr("stroke", "black")
                                      .attr("y1", height_focus_temp)
                                      .attr("y2", height_temp)
                                      .attr("x1", xScale_temp(timeConv(relax_date_default)))
                                      .attr("x2", xScale_temp(timeConv(relax_date_default)))
                                      .on("mouseup", function() {console.log("done")})
  
            if (svg_id==-1) {
              dragHandler_main(d3.selectAll("#brush_"+svg_id))
            } else {
               dragHandler_mini(d3.selectAll("#brush_"+svg_id))
            }
                  
          }
      
          /// DrawMiddle
          // ----------------------------------------
          function DrawMiddle() {
             
            svg_middle.append("g")
                      .append("text")
              .text("Predicted confirmed cases by county")
              .attr("transform", "translate(" + ( width)+ ","+(20)+")")
              .style("font-size", "15px")

          }
      
          
          /// DrawBottom
          // ----------------------------------------
          function DrawBottom() {
             
            svg_bottom.append("g")
                      .append("text")
                      .text("Results are up-to-date as of " + timeForm(timeConv(today)))
                      .attr("transform", "translate(" + (width+50)+ ","+(15)+")")
                      .style("font-size", "13px")
                      .style("font-style","italic")
                      .style("font-weight",100)

            svg_bottom.append("g")
                   .append("text").text("(We identified your location as: " + address + ")")
                    .attr("transform", "translate(" + (width)+ ","+(30)+")")
                   .style("font-size", "13px")
                   .style("font-style","italic")
                   .style("font-weight",100)

          }
          
          /// Brush functions
          // ----------------------------------------
          function dragHandler_drag_helper(x0_temp) {

              // Update other brushes
               d3.selectAll(".brush_mini")
                 .attr("x1", xScale_mini(x0_temp))
                 .attr("x2", xScale_mini(x0_temp))

               d3.selectAll(".brush_main")
                 .attr("x1", xScale_main(x0_temp))
                 .attr("x2", xScale_main(x0_temp))

               // Update position of all the focuses brush
               d3.selectAll(".focus_main")
                 .attr("x1", xScale_main(x0_temp))
                 .attr("x2", xScale_main(x0_temp))
      
               d3.selectAll(".focus_mini")
                 .attr("x1", xScale_mini(x0_temp))
                 .attr("x2", xScale_mini(x0_temp))

              // Update position of label
               d3.select("#brush_label_-1")
                  .attr('y', (xScale_main(x0_temp)-(xScale_main(timeConv(relax_date_default_plus)) - xScale_main(timeConv(relax_date_default_minus))))+adj_vis_w)

              // Update metrics
               i            = bisect(county_data[county_data.length-1].values, x0_temp, 1);
               selectedData = county_data[county_data.length-1].values[i]
               deathtotal   = county_data[county_data.length-1].values[i][data_column_current]
               if ( d3.select("#button1").attr('data-toggle')=='button') {
                 d3.selectAll("#div_stat").html(Math.round(deathtotal) + " cumulative cases as of " + timeForm(x0_temp))
               } else {
                 d3.selectAll("#div_stat").html("&nbsp&nbsp&nbsp" +Math.round(deathtotal) + " daily cases on " +timeForm(x0_temp))
               }

            }

            function dragHandler_end_helper(x0_temp) {

              // Update visualization
              UpdateVisualization(data_column=data_column_current, relax_date=x0_temp)


          }
          
          // brush
          dragHandler_main = d3.drag()
                               .on("drag", function () {

                                  // Get coordinates
                                  x0_date = xScale_main.invert(d3.event.x)
                                  
                                  // Condition
                                  if (x0_date > xScale_main.domain()[0] & x0_date < xScale_main.domain()[1]) {
                                    
                                    // Execute
                                    dragHandler_drag_helper(x0_date)
                                  }

              
                                })
                                .on("end", function() {
                  
                                  // Get coordinates
                                  x0_date = xScale_main.invert(d3.event.x)
                                  
                                  // Execute
                                  dragHandler_end_helper(x0_date)
                                  
                                })

          // brush
          dragHandler_mini = d3.drag()
                               .on("drag", function () {

                                  // Get coordinates
   
                                  x0_date = xScale_mini.invert(d3.event.x)
                                  
                                  // Condition
                                  if (x0_date > xScale_mini.domain()[0] & x0_date < xScale_mini.domain()[1]) {
   
                                    // Execute
                                    dragHandler_drag_helper(x0_date)
                                  }

              
                                })
                                .on("end", function() {
                  
                                  // Get coordinates
                                  x0_date = xScale_mini.invert(d3.event.x)

                                  // Execute
                                  dragHandler_end_helper(x0_date)
                                })

          /// GraphHover
          // ----------------------------------------
          function GraphHover(county_data, data_column) {
          
            d3.selectAll(".serie_label")
              .on('mouseover', function() {
                if (d3.selectAll(".serie_labelactive").size()<2) {
                  d3.selectAll(".ghost-lineactive").attr("class", "ghost-line")
                  d3.selectAll(".serie_labelactive").attr("class", "serie_label")
                  d3.selectAll(".county-hover").attr("class", "county")
    
                  selection = d3.select(this.parentNode).select(".ghost-line");
                  legend    = d3.select(this).raise();      
    
                  legend.transition()
                        .delay("0")
                        .duration("10")
                        .attr("class","serie_labelactive serie_label")
      
                  selection.transition()
                           .delay("0").duration("10")
                           .attr("class","ghost-lineactive ghost-line")
    
                  d3.selectAll(".county").attr("class", function(d) {
                      if (d3.select(this).attr("county-name") ==legend.text()) {
                          return("county-hover")
                      } else {
                          return("county")
                      }
                  })
    
                  if (d3.selectAll(".serie_labelactive").size()>1) {
                      d3.selectAll(".ghost-lineactive").attr("class", "ghost-line")
                      d3.selectAll(".serie_labelactive").attr("class", "serie_label")
                      d3.selectAll(".county-hover").attr("class", "county")
                  } 
                } else {
                  d3.selectAll(".ghost-lineactive").attr("class", "ghost-line")
                  d3.selectAll(".serie_labelactive").attr("class", "serie_label")
                  d3.selectAll(".county-hover").attr("class", "county")
    
                }
              })
              .on('mouseout', function() {
                if (d3.selectAll(".serie_labelactive").size()>1) {
                  d3.selectAll(".ghost-lineactive").attr("class", "ghost-line")
                  d3.selectAll(".county-hover").attr("class", "county")
                  d3.selectAll(".serie_labelactive").attr("class", "serie_label")
                } 
            })
          }

        
          /// DrawVisualization
          // ----------------------------------------
          function DrawVisualization(county_data, map_data, data_column, address, state_choice, state_choice_id, county_choice, county_choice_id) {
          
            // Empty canvas
            d3.selectAll("svg > *").remove()

            // Draw visualizations
            DrawTop()
            DrawMap(map_data, county_data, state_choice, state_choice_id, county_choice, county_choice_id)
            DrawGraph(county_data, data_column, svg_id=-1)
            DrawMiddle()
          
            county_data.forEach(function(d,i) {
              DrawGraph(county_data, data_column, svg_id=i)
            })

            DrawBottom()
          
            // Add dynamics - Hover
            GraphHover(county_data,data_column)
          }
          

          // UpdateData
          //--------------------
          function UpdateData(state) {
          
            county_data_link = d3.csv("/load_county_data?state="+state)
            map_data_link    = d3.json("/frontend/data/map/us.json")

            county_data_link.then(function(county_data_raw) {
              map_data_link.then(function(map_data_raw) {

                // Initialize the data
                county_data_master = InitializeData(raw_data=county_data_raw)
                map_data_current   = map_data_raw

                // Scale the data
                county_data_master_temp = jQuery.extend(true, [], county_data_master)
                county_data_current     = ScaleData(county_data_master_temp)

                // Update any parameters

                /// Colour scales
                rt_values = []
                county_data_current.slice(0,county_data_current.length-1).forEach(function(d) {
                    rt_values.push(d.values[bisect(county_data_current[county_data_current.length-1].values, timeConv(today), 1)].r_t)
                })
                color_min = d3.min(rt_values)
                color_max = d3.max(rt_values)
                step.range([color_min, color_max]);
                color.domain([color_max, step(7), step(6), step(5), step(4), step(3), step(2),color_min])

                /// County & state choice
                state_choice      = state
                state_choice_rank = states(county_data_crosswalk_current).indexOf(state_choice)
                state_choice_id   = +county_data_crosswalk_current[state_choice_rank].values[0].county_id.slice(0,-3)

                county_choice    = ""
                county_choice_id = 0
                   
                // Update the mini canvas
                d3.selectAll(".multiple > *").remove()

                d3.selectAll(".multiple")
                   .selectAll(null)
                   .data(county_data_current.slice(0,-1))
                   .enter()
                   .append('svg')
                   .attr('id',function(d,i) {
                     return("svg_graph_"+(i+1))
                   })
                   .attr("width", (width*2)/5 + adj *8)
                   .attr("height", height_vis2/3 + adj*4)
                   .attr("transform", function(d,i) {return("translate(" + ( 120+(((i/4-Math.floor(i/4))*4)+1))+ ",0)")})
                   .style("padding", padding)
                   .style("margin", margin)
                   .classed("svg-content", true)    

                // Redraw
                DrawVisualization(county_data=county_data_current, map_data=map_data_current, 
                  data_column=data_column_current, address=address, state_choice=state_choice, 
                  state_choice_id=state_choice_id, county_choice=county_choice, 
                  county_choice_id=county_choice_id)


              })
            })
          }
        
          // UpdateVisualization
          //--------------------
          function UpdateVisualization(data_column, relax_date) {
            
            // Update data_column
            data_column_current     = data_column
            
            // Initialize the data & update county_data
            county_data_master_temp = jQuery.extend(true, [], county_data_master)
            console.log(relax_date)
            county_data_current     = ScaleData(county_data=county_data_master_temp, relax_date=relax_date)

            // Update axes
            graphsetup = InitializeGraph(county_data_current, data_column)
            if (graphsetup.maxValue > yScale_main.domain()[1]) {
              graphsetup.maxValue = graphsetup.maxValue

            } else {

              graphsetup.maxValue = yScale_main.domain()[1]
            }
            
       
            // Helper function
            function UpdateVisualizationHelper(svg_id) {

              // Initialize
              if (svg_id==-1) {
             
                yScale_main.domain([graphsetup.minValue,graphsetup.maxValue])
  
                xScale_temp = xScale_main
                yScale_temp = yScale_main

              } else {
                
                yScale_mini.domain([graphsetup.minValue,graphsetup.maxValue])
  
                xScale_temp = xScale_mini
                yScale_temp = yScale_mini
              }
              
              yaxis = d3.axisLeft().scale(yScale_temp)

           
              // Update graph
              line = d3.line()
                       .x(function(d) { return xScale_temp(d.date); })
                       .y(function(d) { return yScale_temp(d[data_column]);});
            
              d3.selectAll("#svg_graph_"+(svg_id+1)).selectAll(".y").call(yaxis)

              d3.selectAll("#svg_graph_"+(svg_id+1))
                .selectAll(".line") 
                .data(function() {
                  if (svg_id==-1) {
                    return([county_data_current[county_data_current.length-1]])
                  } else {
                    return([county_data_current[svg_id]])
                 }
                })         
                .transition()
                .duration(500)
                .attr("d", function(d) { return line(d.values); });
            
              d3.selectAll("#svg_graph_"+(svg_id+1))
                .selectAll(".serie_label") 
                .data(function() {
                  if (svg_id==-1) {
                    return([county_data_current[county_data_current.length-1]])
                  } else {
                    return([county_data_current[svg_id]])
                 } 
                }) 
                .datum(function(d) {
                    return {
                        id: d.key,
                        maxDate: d3.max(d.values, function(f) {
                          return f.date
                        }),
                        maxValue: d3.max(d.values, function(f) {
                          return f[data_column]
                        })
                    }; 
                  })
                  .transition()
                  .duration(500)
                  .attr("transform", function(d) {
                        return "translate(" + (xScale_temp(d.maxDate) + 10) + "," + (yScale_temp(d.maxValue) + 5 )+ ")"; 
                  })
                  .text(function(d) { return d.id; }); 
            
               d3.selectAll("#svg_graph_"+(svg_id+1))
                 .selectAll(".ghost-line")  
                 .data(function() {
                  if (svg_id==-1) {
                    return([county_data_current[county_data_current.length-1]])
                  } else {
                    return([county_data_current[svg_id]])
                 } 
                  }) 
                 .transition()
                 .duration(500)
                 .attr("d", function(d) { return line(d.values); });
                
            }

            // Execute update
            UpdateVisualizationHelper(svg_id=-1)
            county_data.forEach(function(d,i) {
              UpdateVisualizationHelper(svg_id=i)
            })


            }

          // ----------------------------------------
          // ### EXECUTE
          // ----------------------------------------

          // Initialize the data
          county_data_master = InitializeData(raw_data=county_data_raw)
          map_data_current   = map_data_raw

          // Scale the data
          county_data_master_temp = jQuery.extend(true, [], county_data_master)
          county_data_current     = ScaleData(county_data_master_temp)
          
          // Update any parameters
          rt_values = []
          county_data_current.slice(0,county_data_current.length-1).forEach(function(d) {
                   rt_values.push(d.values[bisect(county_data_current[county_data_current.length-1].values, timeConv(today), 1)].r_t)
          })

          color_min = d3.min(rt_values)
          color_max = d3.max(rt_values)
          step.range([color_min, color_max]);
          color.domain([color_max, step(7), step(6), step(5), step(4), step(3), step(2),color_min])

          // Initialize the canvas
          svg_top = d3.select("body")
                      .append("svg")
                      .attr("width", (width + adj *6)*2)
                      .attr("height", 150)
                      .attr("transform", "translate(" + ( 10)+ ",0)")
                      .style("padding", padding)
                      .style("margin", margin)
                      .classed("svg-content", true);
          
          svg_map = d3.select("body")
                      .append("svg")
                      .attr("width", width + adj *8)
                      .attr("height", height_vis2 + adj*4)
                      .attr("transform", "translate(" + ( 10)+ ",0)")
                      .style("padding", padding)
                      .style("margin", margin)
                      .classed("svg-content", true);
          
          svg_graph_0 = d3.select("body")
                          .append("svg")
                          .attr("id", "svg_graph_0")
                          .attr("width", width + adj *8)
                          .attr("height", height_vis2 + adj*4)
                          .attr("transform", "translate(" + ( 10)+ ",0)")
                          .style("padding", padding)
                          .style("margin", margin)
                          .classed("svg-content", true);
          
          svg_middle = d3.select("body")
                         .append("svg")
                         .attr("width", (width + adj *6)*2)
                         .attr("height", 50)
                         .attr("transform", "translate(" + ( 10)+ ",0)")
                         .style("padding", padding)
                         .style("margin", margin)
                        .classed("svg-content", true);

      
          svg_graph_mini = d3.select("body")
                             .append("g")
                             .attr("class", "multiple")
          
          svg_graph_mini.selectAll(null)
                        .data(county_data_current.slice(0,-1))
                        .enter()
                        .append('svg')
                        .attr('id',function(d,i) {
                          return("svg_graph_"+(i+1))
                        })
                        .attr("width", (width*2)/5 + adj *8)
                        .attr("height", height_vis2/3 + adj*4)
                        .attr("transform", function(d,i) { return("translate(" + (120+(((i/4-Math.floor(i/4))*4)+1))+ ",0)")})
                        .style("padding", padding)
                        .style("margin", margin)
                        .classed("svg-content", true)

          svg_bottom = d3.select("body")
                         .append("svg")
                         .attr("width", (width + adj *6)*2)
                         .attr("height", 100)
                         .attr("transform", "translate(" + ( 10)+ ","+(50)+")")
                         .style("padding", padding)
                         .style("margin", margin)
                         .classed("svg-content", true);
          
          // Draw 
          DrawVisualization(county_data=county_data_current, map_data=map_data_current, 
            data_column=data_column_current, address=address, 
            state_choice = state_choice, state_choice_id=state_choice_id, 
            county_choice=county_choice, county_choice_id=county_choice_id)

        }) 
      })
    })
  })
})