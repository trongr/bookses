var menu = (function(){
    var menu = {}

    var k = {
        box: null
    }

    var templates = (function(){
        var templates = {}

        templates.menu = function(){
            var html = "<div id='menu_box'>"
                + "         <div class='popup_menu_cancel'></div>"
                + "         <div id='more_menu_box'>"
                + "             <div class='menu_item link_box'>"
                + "                 <span class='menu_item_link'><a href='https://twitter.com/nahnturong' target='_blank'><i class='icon-twitter-sign'></i></a></span>"
                + "                 <span class='menu_item_head'>twitter</span>"
                + "                 <span class='menu_item_text'><a href='https://twitter.com/nahnturong' target='_blank'>Add me</a> to get Book newses.</span>"
                + "             </div>"
                + "             <div class='menu_item link_box'>"
                + "                 <span class='menu_item_link'><a href='https://moot.it/bookses#!/qa' target='_blank'><i class='icon-question-sign'></i></a></span>"
                + "                 <span class='menu_item_head'>feedback</span>"
                + "                 <span class='menu_item_text'>Questions or comments? Talk to me <a href='https://moot.it/bookses#!/qa' target='_blank'>here.</a></span>"
                + "             </div>"
                + "             <div class='menu_item link_box'>"
                + "                 <span class='menu_item_link'><a href='https://moot.it/bookses#!/bugs' target='_blank'><i class='icon-bug'></i></a></span>"
                + "                 <span class='menu_item_head'>bugs</span>"
                + "                 <span class='menu_item_text'>The horrors!! <a href='https://moot.it/bookses#!/bugs' target='_blank'>Tell mee!!!</a></span>"
                + "             </div>"
                // + "             <div class='menu_item link_box'>"
                // + "                 <span class='menu_item_link'><a id='medkit' href='#'><i class='icon-medkit'></i></a></span>"
                // + "                 <span class='menu_item_head'>donate</span>"
                // + "                 <span class='menu_item_text'>Like Bookses? Help me keep it going.</span>"
                // + "             </div>"
                + "         </div>"
                + "         <button class='popup_menu_cancel'>close</button>"
                + "     </div>"
            return html
        }

        return templates
    }())

    var bindings = (function(){
        var bindings = {}

        bindings.click_popup_menu_cancel = function(){
            if (k.box) k.box.html("").hide()
        }

        return bindings
    }())

    menu.show_menu = function(box){
        k.box = box
        k.box.html(templates.menu()).show()
            .off()
            .on("click", ".popup_menu_cancel", bindings.click_popup_menu_cancel)
            .on("click", "button", function(){bindings.click_popup_menu_cancel()})
    }

    return menu
}())
