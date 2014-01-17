jQuery(function($){

    var k = {
        static_public: "/static/public",
        date_format: "D MMMM YYYY",
        username: null,
        img: null,
    }

    var dom = {
        profile: $("#profile")
    }

    var imglib = (function(){
        var imglib = {}

        // mark
        imglib.choose_img = function(input, imgtag, done){
            var file
            input.off().on("change", function(e){
                file = e.target.files[0]
                var reader = new FileReader()
                reader.onload = function(e){
                    imgtag.attr("src", e.target.result)
                    done(null, file)
                }
                reader.readAsDataURL(file)
            }).click()
        }

        return imglib
    }())

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
                +          "<input id='user_img_input' accept='image/*' type='file'>"
                +          "<div id='user_img_box'>" + (user.img ? templates.user_img(user.img) : "") + "</div>"
                +          "<div id='user_info_box'>"
                +               "<div id='user_username'>" + user.username + "</div>"
                +               "<div id='user_joined'>Joined " + Date.create(user.created).relative() + "</div>"
                +               "<button id='user_follow'><i class='icon-rss'></i> subscribe</button>"
                +               "<button id='user_update'>dummy update</button>"
                +          "</div>"
                +      "</div>"
            return html
        }

        templates.user_img = function(src){
            var html = "<img id='user_img' src='" + src + "'>"
            return html
        }

        return templates
    }())

    var views = (function(){
        var views = {}

        views.init = function(){
            users.init(views.load_user_edits)
            notis.init($("#notification_menu"), $("#notification_tray"))
            views.load_profile()
        }

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

        views.load_user_edits = function(){
            k.username = $.url(window.location).param("u")
            async.waterfall([
                function(done){
                    users.is_logged_in(function(er, user){
                        done(er, user)
                    })
                },
                function(user, done){
                    var loggedin = k.username == user.username
                    views.load_user_img_edit(loggedin)
                    done(null)
                }
            ], function(er){
                if (er) console.log(JSON.stringify(er, 0, 2))
            })
        }

        // mark
        views.load_user_img_edit = function(loggedin){
            if (loggedin){
                $("#user_update").show()
                    .off()
                    .on("click", bindings.choose_img)
            } else {
                $("#user_update").hide()
            }
        }

        return views
    }())

    var bindings = (function(){
        var bindings = {}

        bindings.init = function(){
            $("body").on("keydown", ".input_enter_submit input", bindings.input_enter_submit)
            $("#logins").on("click", bindings.click_logins)
            views.load_user_edits()
        }

        bindings.choose_img = function(){
            var input = $("#user_img_input")
            var imgtag = $("#user_img_box img")
            if (imgtag.length == 0) imgtag = $("#user_img_box").html(templates.user_img("")).find("img").hide()
            imglib.choose_img(input, imgtag, function(er, file){
                if (er) alert("Something's wrong: I can't choose a file")
                else {
                    imgtag.show()
                    $("#user_img_box").css({height:"auto"})
                }
            })
        }

        // mark
        bindings.edit_user_img = function(){
            if (!FormData) return alert("can't upload: please update your browser")
            var data = new FormData()
            data.append("img", "nahn.truong@gmail.com")

            // var img = draw.get_file(), img_src
            // if (img){
            //     data.append("img", img)
            //     img_src = URL.createObjectURL(img)
            // }

            $.ajax({
                url: "/user/edit",
                type: "post",
                data: data,
                processData: false,
                contentType: false,
                success: function(re){
                    if (re.user){
                        console.log(JSON.stringify(re.user, 0, 2))
                    } else if (re.loggedin == false) alert("you have to log in")
                    else alert(JSON.stringify({error:"update user",er:re}, 0, 2))
                }
            })
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
