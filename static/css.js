var css = (function(){
    var css = {}

    css.fittext = function(parent, child, margin){
        var parent_width = parent.width() - margin
        var size = parseInt(child.css("font-size"))
        while (child.width() < parent_width){
            size++
            child.css("font-size", size.toString() + "px")
        }
    }

    return css
}())