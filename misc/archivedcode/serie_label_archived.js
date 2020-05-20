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
                    } 
                  })
                  .transition()
                  .duration(500)
                  .attr("transform", function(d) {
                        return "translate(" + (xScale_temp(d.maxDate) + 10) + "," + (yScale_temp(d.maxValue) + 5 )+ ")" 
                  })
                  .text(function(d) { return d.id }) 