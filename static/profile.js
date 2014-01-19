jQuery(function($){

    var k = {
        static_public: "/static/public",
        date_format: "D MMMM YYYY",
        username: null,
        img: null,
        max_img_size: 5242880,
    }

    var dom = {
        profile: $("#profile")
    }

    var msg = (function(){
        var msg = {}

        msg.show = function(mes){
            $("#msg").html(mes).fadeIn(100).fadeOut(5000)
        }

        return msg
    }())

    var imglib = (function(){
        var imglib = {}

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

        // todo email
        api.edit_user = function(update, done){
            if (!FormData) return alert("can't upload: please update your browser")
            var data = new FormData()
            if (update.img && update.img.size < k.max_img_size){
                data.append("img", update.img)
            } else if (update.img){
                return alert("Image too big. Please choose one less than 5 MB")
            }
            $.ajax({
                url: "/user/edit",
                type: "post",
                data: data,
                processData: false,
                contentType: false,
                success: function(re){
                    if (re.user) done(null, re.user)
                    else if (re.loggedin == false) done({error:"not logged in"})
                    else done({error:"update user",re:re})
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
                +          "<div id='user_img_box' style='" + (user.img ? "height:auto" : "") + "'>"
                +               (user.img ? templates.user_img(user.img) : "")
                +          "</div>"
                +          "<div id='user_info_box'>"
                +               "<div id='user_username'>" + user.username + "</div>"
                +               "<div id='user_joined'>Joined " + Date.create(user.created).relative() + "</div>"
                +               "<div id='user_kudos'>" + user.kudos + " kudos</div>"
                +               "<button id='user_follow'><i class='icon-rss'></i> subscribe</button>"
                +          "</div>"
                +      "</div>"
            return html
        }

        templates.user_img = function(src){
            var html = "<img id='user_img' src='" + src + "'>"
            return html
        }

        templates.user_edit_img = function(){
            var html = "<button id='user_edit_img'><i class='icon-pencil'></i></button>"
            return html
        }

        return templates
    }())

    var views = (function(){
        var views = {}

        views.init = function(){
            users.init(views.load_user_edits)
            views.load_profile()
            notis.init($("#notification_menu"), $("#notification_tray"))
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
                    done(null)
                },
                function(done){
                    views.load_user_edits()
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

        views.load_user_img_edit = function(loggedin){
            if (loggedin){
                $("#user_img_box").prepend(templates.user_edit_img())
                    .off()
                    .on("click", "#user_edit_img", bindings.choose_img)
            } else {
                $("#user_edit_img").hide()
            }
        }

        return views
    }())

    var bindings = (function(){
        var bindings = {}

        bindings.init = function(){
            $("body").on("keydown", ".input_enter_submit input", bindings.input_enter_submit)
            $("#logins").on("click", bindings.click_logins)
        }

        bindings.choose_img = function(){
            var input = $("#user_img_input")
            var imgtag = $("#user_img_box img")
            if (imgtag.length == 0){
                imgtag = $("#user_img_box").html(templates.user_img("")).find("img").hide()
                views.load_user_img_edit(true)
            }
            imglib.choose_img(input, imgtag, function(er, file){
                if (er) alert("Something's wrong: I can't choose a file")
                else {
                    imgtag.show()
                    $("#user_img_box").css({height:"auto"})
                    api.edit_user({img:file}, function(er, user){
                        if (er) msg.show("Error saving profile image")
                        else msg.show("Saved!")
                    })
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
