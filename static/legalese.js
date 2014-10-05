var legal = (function(){
    var legal = {}

    var views = (function(){
        var views = {}

        views.init = function(){
            var html = "<div id='legalesebox'>"
                +           "<div id='legaleseinner'>"
                +                "<div id='legaltext'>"
                +                     "<h2>DISCLAIMER</h2>"
                +                     "<div>To proceed you must agree to the following:</div>"
                +                     "<ol>"
                +                     "<li>You will submit only artworks to which you have full rights.</li>"
                +                     "<li>Such works are to be released under <a href='http://creativecommons.org/licenses/by-nc-sa/3.0/' target='_blank'>Creative Commons attribution noncommercial sharealike.</a> Any other use will require the unanimous decision of all contributors to the work.</li>"
                +                     "<li>On select titles, Bookses reserves the commercial right to the illustrations. This allows us to stay alive and keep hiring artists. However, you'll know which titles are to be commercialized before any illustration takes place, i.e. we won't just come in after all the work's done and steal your art.</li>"
                +                     "</ol>"
                +                     "<h2>Examples</h2>"
                +                     "<div>Bookses has no claim on artworks created for interviewing purposes, which belong to all the participants and released under <a href='http://creativecommons.org/licenses/by-nc-sa/3.0/' target='_blank'>CC BY-NC-SA.</a></div>"
                +                "</div>"
                +                "<div id='legalbuttons'>"
                +                     "<button id='legalno'>disagree</button>"
                +                     "<button id='legalyes'>I agree</button>"
                // +                     "<button id='legalalt'>I won't be submitting art</button>"
                +                "</div>"
                +           "</div>"
                +      "</div>"
            $("body").append(html).find("#legalesebox").show()
        }

        return views
    }())

    var bindings = (function(){
        var bindings = {}

        bindings.init = function(){
            $("#legalno").on("click", bindings.legalno)
            $("#legalyes").on("click", bindings.legalyes)
            $("#legalalt").on("click", bindings.legalalt)
        }

        bindings.legalno = function(){
            window.location = "/"
        }

        bindings.legalyes = function(){
            $("#legalesebox").hide()
        }

        bindings.legalalt = function(){
            $("#legalesebox").hide()
        }

        return bindings
    }())

    legal.init = function(){
        views.init()
        bindings.init()
    }

    return legal
}())