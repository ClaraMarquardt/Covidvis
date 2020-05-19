              // Initialize brush
              brush_main = d3.brushX()
                             .extent([[0,height_focus_temp], [width-40 , height_temp]])
                             .on("brush", brushed_main)
                             .on("end", brushed_end_main)
              brush_temp = brush_main

                            // Initialize brush
              brush_mini = d3.brushX()
                             .extent([[0,height_focus_temp], [(width*2)/5-40 , height_temp]])
                             .on("brush", brushed_mini)
                             .on("end", brushed_end_mini)
              brush_temp = brush_mini



                                    .call(brush_temp)
                                    .call(brush_temp.move, [timeConv(relax_date_default_minus), timeConv(relax_date_default_plus)].map(xScale_temp))

            d3.selectAll('.handle').remove();

                                                .attr("class", function() {
                                        if(svg_id==-1) {
                                          return("brush brush_main")
                                        } else {
                                          return("brush brush_mini")
                                        }
                                     })

                                                         // brushed
          function brushedHelper(xScale_temp) {
                [x0, x1] = selection.map(xScale_temp.invert);
                d3.select("#brush_label")
                  .attr('y', (xScale_main(x0)-(xScale_main(timeConv(relax_date_default_plus)) - xScale_main(timeConv(relax_date_default_minus))))+adj_vis_w)
          
                i          = bisect(county_data_current[county_data_current.length-1].values, x0, 1)
                deathtotal = county_data_current[county_data_current.length-1].values[i][data_column_current]
            
                if (d3.select("#button1").attr('data-toggle')=='button') {
                  d3.selectAll("#div_stat").html(Math.round(deathtotal)+ " cumulative cases as of &nbsp&nbsp&nbsp&nbsp&nbsp" + timeForm(x0))
                } else {
                  d3.selectAll("#div_stat").html("&nbsp&nbsp&nbsp" +Math.round(deathtotal)+ " daily cases on " + timeForm(x0))
                }
          
                d3.selectAll(".focus_main")
                  .attr("x1", xScale_main(x0))
                  .attr("x2", xScale_main(x0))

                d3.selectAll(".focus_mini")
                  .attr("x1", xScale_mini(x0))
                  .attr("x2", xScale_mini(x0))

                d3.selectAll(".brush_mini")
                 .call(brush_mini.move, [x0, x1].map(xScale_mini))
                  //.selectAll(".selection")
                  //.attr("x", xScale_mini(x0))

                d3.selectAll(".brush_main")
                  .call(brush_main.move, [x0, x1].map(xScale_main))
                 // .selectAll(".selection")
                 // .attr("x", xScale_main(x0))
          }
          
          // brushed
          function brushed_main() {
              
              
              selection = d3.event.selection
               if (!d3.event.sourceEvent) return;
                console.log(d3.event.sourceEvent.type)
               if (d3.event.sourceEvent.type=="brush") return;
              if (selection === null) {
              } else {
                brushedHelper(xScale_temp=xScale_main)    
              }
          }

          function brushed_mini() {

              
              selection = d3.event.selection
              if (!d3.event.sourceEvent) return;
               console.log(d3.event.sourceEvent.type)
                if (d3.event.sourceEvent.type=="brush") return;
              if (selection === null) {
              } else {
                brushedHelper(xScale_temp=xScale_mini)    
              }
          }


          // brushed_end
          function brushed_endHelper(xScale_temp, coordinates,selection) {
              
            if(init_indicator==1) {
                  
              [x0, x1] = selection.map(xScale_temp.invert)
              x_temp   = x0
              x = coordinates[0];
              y = coordinates[1];
              if (xScale_temp(x0)<xScale_temp.range()[1] & x < xScale_temp.range()[1]) {
                


                  
//                                  d3.selectAll(".brush_mini")
 //                  .selectAll(".selection")
 //                  .attr("x", xScale_mini(x0))

  //               d3.selectAll(".brush_main")
  //                 .selectAll(".selection")
  //                 .attr("x", xScale_main(x0))
      
                UpdateVisualization(data_column=data_column_current, relax_date=x0)
              }
            }
                
            init_indicator = 1
      
          }
          
          // brushed_end
          function brushed_end_main() {
              selection   = d3.event.selection
              coordinates = d3.mouse(this)
              if (!d3.event.sourceEvent) return;
               console.log(d3.event.sourceEvent.type)
               if (d3.event.sourceEvent.type=="brush") return;
              if (selection === null) {
              } else {
                brushed_endHelper(xScale_temp=xScale_main, coordinates,selection)
              }
          }

          function brushed_end_mini() {
              selection   = d3.event.selection;
              coordinates = d3.mouse(this);

              if (!d3.event.sourceEvent) return;
               console.log(d3.event.sourceEvent.type)
               if (d3.event.sourceEvent.type=="brush") return;
     
              if (selection === null) {
              } else {
                brushed_endHelper(xScale_temp=xScale_mini, coordinates,selection)
              }
          }


                  // beforebrushstarted
        function beforebrushstarted() {
            dx       = (xScale(timeConv(relax_date_default_1)) - xScale(timeConv(relax_date_default)))
            [cx]     = d3.mouse(this);
            [x0, x1] = [cx - dx / 2, cx + dx / 2]
            [X0, X1] = xScale.range();
        
            d3.select(this.parentNode)
              .call(brush.move, x1 > X1 ? [X1 - dx, X1] 
                  : x0 < X0 ? [X0, X0 + dx] 
                  : [x0, x1]);
        }