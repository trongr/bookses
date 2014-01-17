jQuery(function($){

    var k = {
        static_public: "/static/public",
        date_format: "D MMMM YYYY",
        username: null
    }

    var dom = {
        profile: $("#profile")
    }

    var api = (function(){
        var api = {}

        api.get_user = function(done){
            k.username = $.url(window.location).param("u")
            $.ajax({
                url: "/user/" + k.username + "/public",
                type: "get",
                data: {},
                success: function(re){
                    if (re.user) done(null, re.user)
                    else done({error:re})
                }
            })
        }

        return api
    }())

    var css = (function(){
        var css = {}

        css.init = function(){

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

    var templates = (function(){
        var templates = {}

        // mark
        templates.profile = function(user){
            var html = "<div id='herotron'>"
                +          "<div id='user_img_box'>" + (user.img ? "<img id='user_img' src='" + user.img + "'>" : "") + "</div>"
                +          "<div id='user_info_box'>"
                +               "<div id='user_username'>" + user.username + "</div>"
                +               "<div id='user_joined'>Joined " + Date.create(user.created).relative() + "</div>"
                +               "<button id='user_follow'><i class='icon-rss'></i> subscribe</button>"
                +          "</div>"
                +      "</div>"
            return html
        }

        return templates
    }())

    var views = (function(){
        var views = {}

        views.init = function(){
            users.init()
            notis.init($("#notification_menu"), $("#notification_tray"))
            views.load_profile()
        }

        // mark
        views.load_profile = function(){
            async.waterfall([
                function(done){
                    api.get_user(function(er, user){
                        done(er, user)
                    })
                },
                function(user, done){
                    dom.profile.html(templates.profile(user))
                        .off()
                        .on("click", "#user_follow", bindings.click_follow)
                }
            ], function(er){
                if (er) console.log(JSON.stringify(er, 0, 2))
            })
        }

        return views
    }())

    var bindings = (function(){
        var bindings = {}

        // mark
        bindings.init = function(){
            $("body").on("keydown", ".input_enter_submit input", bindings.input_enter_submit)
            $("#logins").on("click", bindings.click_logins)
        }

        bindings.click_follow = function(){
            alert("coming soon")
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

    var app = (function(){
        var app = {}

        app.init = function(){
            views.init()
            bindings.init()
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
