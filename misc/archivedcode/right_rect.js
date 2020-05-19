              d3.selectAll(".rightrect_mini")
                .attr('width', xScale_mini.range()[1]-xScale_mini(x0_temp))
                .attr("transform", "translate(" +  xScale_mini(x0_temp)+ ","+(160/3)+")")
                .on("mousemove", function (x0) {
                  
                  x0         = xScale_mini.invert(d3.mouse(this)[0]+xScale_mini(x0_temp));
                  i          = bisect(county_data_current[county_data_current.length-1].values, x0, 1);
                  deathtotal = county_data_current[county_data_current.length-1].values[i][data_column_current]
                  if (d3.select("#button1").attr('data-toggle')=='button') {
                    d3.selectAll("#div_stat").html(Math.round(deathtotal) + " cumulative cases as of " + timeForm(xScale_mini.invert(d3.mouse(this)[0]+xScale_mini(x0_temp))))
                  } else {
                    d3.selectAll("#div_stat").html("" + Math.round(deathtotal) + " daily cases on " + timeForm(xScale_mini.invert(d3.mouse(this)[0]+xScale_mini(x0_temp))))
                  }
              
                  selectedData = county_data_current[1].values[i]
              
                  d3.selectAll(".focus_main")
                    .attr("x1", xScale_main(selectedData.date))
                    .attr("x2", xScale_main(selectedData.date))
              
                  d3.selectAll(".focus_mini")
                    .attr("x1", xScale_mini(selectedData.date))
                    .attr("x2", xScale_mini(selectedData.date))
              
                })

                              d3.selectAll(".rightrect_main")
                .attr('width', xScale_main.range()[1]-xScale_main(x0_temp))
                .attr("transform", "translate(" +  xScale_main(x0_temp)+ ",160)")
                .on("mousemove", function (x0) {
                  
                  x0         = xScale_main.invert(d3.mouse(this)[0]+xScale_main(x0_temp));
                  i          = bisect(county_data_current[county_data_current.length-1].values, x0, 1);
                  deathtotal = county_data_current[county_data_current.length-1].values[i][data_column_current]
                  if (d3.select("#button1").attr('data-toggle')=='button') {
                    d3.selectAll("#div_stat").html(Math.round(deathtotal) + " cumulative cases as of " + timeForm(xScale_main.invert(d3.mouse(this)[0]+xScale_main(x0_temp))))
                  } else {
                    d3.selectAll("#div_stat").html("" + Math.round(deathtotal) + " daily cases on " + timeForm(xScale_main.invert(d3.mouse(this)[0]+xScale_main(x0_temp))))
                  }
              
                  selectedData = county_data_current[1].values[i]
              
                  d3.selectAll(".focus_main")
                    .attr("x1", xScale_main(selectedData.date))
                    .attr("x2", xScale_main(selectedData.date))
              
                  d3.selectAll(".focus_mini")
                    .attr("x1", xScale_mini(selectedData.date))
                    .attr("x2", xScale_mini(selectedData.date))
              
                })


                              // Update rectangles
              d3.selectAll(".leftrect_main")
                .attr('width', xScale_main(x0_temp))

              d3.selectAll(".leftrect_mini")
                .attr('width', xScale_mini(x0_temp))

                           svg_graph_layer_2.append("rect")
                             .attr("class",function() {
                                if(svg_id==-1) {
                                  return("rightrect rightrect_main")
                                } else {
                                  return("rightrect rightrect_mini")
                                }
                              })
                              .style("opacity",0)
                             .attr("id","rightrect_"+svg_id)
                             .attr("height", height_temp-height_focus_temp)
                             .attr('width', xScale_temp.range()[1]-xScale_temp(timeConv(relax_date_default_plus)))
                             .attr("transform", "translate(" +  (xScale_temp(timeConv(relax_date_default_plus)))+ ","+height_focus_temp+")")
                             .on("mousemove", function () {

                                if (svg_id==-1) {
                                  x0           = xScale_main.invert(d3.mouse(this)[0] +xScale_main(timeConv(relax_date_default_plus)));
                                  i            = bisect(county_data[county_data.length-1].values, x0, 1);
                                  selectedData = county_data[county_data.length-1].values[i]
                                  deathtotal   = county_data[county_data.length-1].values[i][data_column]
            
                                  if ( d3.select("#button1").attr('data-toggle')=='button') {
                                    d3.selectAll("#div_stat").html(Math.round(deathtotal) + " cumulative cases as of " +timeForm(xScale_main.invert(d3.mouse(this)[0]+xScale_main(timeConv(relax_date_default_plus)))))
                                  } else {
                                    d3.selectAll("#div_stat").html("&nbsp&nbsp&nbsp" +Math.round(deathtotal) + " daily cases on " +timeForm(xScale_main.invert(d3.mouse(this)[0]+xScale_main(timeConv(relax_date_default_plus)))))
                                  }
                                } else {
                                  x0           = xScale_mini.invert(d3.mouse(this)[0] +xScale_mini(timeConv(relax_date_default_plus)));
                                  i            = bisect(county_data[county_data.length-1].values, x0, 1);
                                  selectedData = county_data[county_data.length-1].values[i]
                                  deathtotal   = county_data[county_data.length-1].values[i][data_column]
            
                                  if ( d3.select("#button1").attr('data-toggle')=='button') {
                                    d3.selectAll("#div_stat").html(Math.round(deathtotal) + " cumulative cases as of " +timeForm(xScale_mini.invert(d3.mouse(this)[0]+xScale_mini(timeConv(relax_date_default_plus)))))
                                  } else {
                                    d3.selectAll("#div_stat").html("&nbsp&nbsp&nbsp" +Math.round(deathtotal) + " daily cases on " +timeForm(xScale_mini.invert(d3.mouse(this)[0]+xScale_mini(timeConv(relax_date_default_plus)))))
                                  }

                                }
              
                                 d3.selectAll(".focus_main")
                                   .attr("x1", xScale_main(selectedData.date))
                                   .attr("x2", xScale_main(selectedData.date))

                                 d3.selectAll(".focus_mini")
                                   .attr("x1", xScale_mini(selectedData.date))
                                   .attr("x2", xScale_mini(selectedData.date))
                             })