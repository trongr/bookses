jQuery(function($){
    var bindings = (function(){
        var bindings = {}

        bindings.init = function(){
            $(".input_enter_submit input").keypress(bindings.input_enter_submit)
            $("#logo").on("click", bindings.click_logo)
        }

        bindings.click_logo = function(){
            window.location = "/"
        }

        bindings.input_enter_submit = function(e){
            if (e.which == 13){
                $(this).parent().find("button").click()
            }
        }

        return bindings
    }())
    var users = (function(){
        var users = {}

        users.init = function(){
            users.bind()
            users.init_login_boxes()
        }

        users.bind = function(){
            $("#login").on("click", users.click_login)
            $("#register").on("click", users.click_register)
            $("#logout").on("click", users.click_logout)
        }

        users.click_logout = function(){
            users.api_logout(function(er){
                if (er) alert("error logging out " + JSON.stringify(er, 0, 2))
                else {
                    $("#login_box").show()
                    $("#logout_box").hide()
                }
            })
        }

        users.click_login = function(){
            var username = $("#username").val().trim()
            var password = $("#password").val().trim()
            if (!username || !password) return alert("Invalid logins")
            users.api_login(username, password, function(er, user){
                if (er){
                    alert("wrong")
                } else {
                    $("#login_box").hide()
                    $("#logout_box").show()
                }
            })
        }

        users.click_register = function(){
            var username = $("#username").val().trim()
            var password = $("#password").val().trim()
            if (!username || !password) return alert("Please enter a new username and password to register")
            users.api_create_user(username, password, function(er, user){
                if (er) alert(JSON.stringify(er, 0, 2))
                else {
                    $("#login_box").hide()
                    $("#logout_box").show()
                    alert("Registration complete. Your new identity: " + JSON.stringify(user, 0, 2))
                }
            })
        }

        users.api_create_user = function(username, password, done){
            $.ajax({
                url: "/user/" + username + "/register",
                type: "post",
                data: {password:password},
                success: function(re){
                    if (re.user) done(null, re.user)
                    else done({error:re})
                }
            })
        }

        users.api_login = function(username, password, done){
            $.ajax({
                url: "/user/" + username + "/login",
                type: "post",
                data: {password:password},
                success: function(re){
                    if (re.user) done(null, re.user)
                    else done({error:re})
                }
            })
        }

        users.api_logout = function(done){
            $.ajax({
                url: "/user/logout",
                type: "post",
                success: function(re){
                    if (re.loggedout) done(null)
                    else done({error:"logging out",re:re})
                }
            })
        }

        users.init_login_boxes = function(){
            users.api_is_logged_in(function(er, loggedin){
                if (loggedin){
                    $("#login_box").hide()
                    $("#logout_box").show()
                }
            })
        }

        users.api_is_logged_in = function(done){
            $.ajax({
                url: "/user/login",
                type: "get",
                success: function(re){
                    if (re.loggedin) done(null, re.loggedin)
                    else done({error:"may not be logged in",re:re})
                }
            })
        }

        return users
    }())

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

    var app = (function(){
        var app = {}

        app.init = function(){
            bindings.init()
            users.init()
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
