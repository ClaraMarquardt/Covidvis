     .on('click', function() {
      console.log("click")
d3.select(this).on("mouseout", null);

      d3.selectAll(".ghost-lineactive").attr("class", "ghost-line")

      d3.selectAll(".serie_labelactive").attr("class", "serie_label")
      const selection = d3.select(this.parentNode).select(".ghost-line");
      const legend = d3.select(this).raise();      

selection.attr("class", "ghost-lineactive")
legend.attr("class", "serie-labelactive")


      
                   
 
     })