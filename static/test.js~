jQuery(function($){

    var views = (function(){
        var views = {}

        views.init = function(){
            views.loadbook()
        }

        views.loadbook = function(){
            async.parallel([
                // function(done){
                //     legal.init()
                //     done(null)
                // },
                function(done){
                    var book = new bok({
                        box: $("#book"),
                        bID: document.URL.match(/read\/([a-zA-Z0-9]+).*$/)[1],
                        error: function(er){
                            if (er){
                                $("#book").hide()
                                $("#error").show()
                            }
                        }
                    })
                    done(null)
                },
            ], function(er){
                if (er) console.log(JSON.stringify(er, 0, 2))
            })
        }

        return views
    }())

    var bindings = (function(){
        var bindings = {}

        bindings.init = function(){
            $("body").on("keydown", ".input_enter_submit input", bindings.input_enter_submit)
            $("#logins").on("click", bindings.click_logins)
        }

        bindings.click_logins = function(){
            users.show_login_box($("#logins_box"))
        }

        bindings.input_enter_submit = function(e){
            if (e.which == 13){
                $(this).parent().find("button").click()
            }
        }

        return bindings
    }())

    var css = (function(){
        var css = {}

        css.init = function(){
            // css.fit($("#click_colors"), $("#click_colors").children())
            css.fit($("#tagline_box"), $("#tagline"))
        }

        css.fit = function(parent, child){
            var parent_width = parent.width() - 50
            var size = parseInt(child.css("font-size"))
            while (child.width() < parent_width){
                size++
                child.css("font-size", size.toString() + "px")
            }
        }

        return css
    }())

    var app = (function(){
        var app = {}

        app.init = function(){
            bindings.init()
            css.init()
            views.loadbook()
        }

        return app
    }())

    app.init()

    ;(function(){
        (function(i,s,o,g,r,a,m){
            i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();
            a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
        })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
        ga('create', 'UA-45942817-1', 'bookses.com');
        ga('send', 'pageview');
    }())
});
