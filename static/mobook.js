jQuery(function($){
    var book = new bok({
        box: $("#book"),
        bID: document.URL.match(/mobile\/read\/([a-zA-Z0-9]+).*$/)[1],
        error: function(er){
            if (er){
                $("#book").hide()
                $("#error").show()
            }
        }
    })

    var css = (function(){
        var css = {}

        css.init = function(){
            css.fit($("#tagline_box"), $("#tagline"))
        }

        css.fit = function(parent, child){
            var parent_width = parent.width() - 100
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
            css.init()
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
