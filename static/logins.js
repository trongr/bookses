var users = (function(){
    var users = {}

    users.k = {
        box: null
    }

    var templates = (function(){
        var templates = {}

        templates.logins = function(){
            var html = "<div id='login_box'>"
                + "         <div class='popup_login_cancel'></div>"
                + "         <span class='input_enter_submit'>"
                + "             <input id='username' placeholder='username'><br>"
                + "             <input id='password' type='password' placeholder='password'><br>"
                + "             <button id='login'>LOGIN</button><br>"
                + "         </span>"
                + "         <button id='register'>REGISTER</button><br>"
                + "         <button class='popup_login_cancel'>cancel</button>"
                + "     </div>"
                + "     <div id='logout_box'>"
                + "         <div class='popup_login_cancel'></div>"
                + "         <button id='logout'>LOGOUT</button><br>"
                + "         <button class='popup_login_cancel'>cancel</button>"
                + "     </div>"
            return html
        }

        return templates
    }())

    var bindings = (function(){
        var bindings = {}

        bindings.click_popup_login_cancel = function(){
            if (users.k.box) users.k.box.html("").hide()
        }

        return bindings
    }())

    users.show_login_box = function(box){
        users.k.box = box
        users.k.box.html(templates.logins()).show()
            .off()
            .on("click", "#login", users.click_login)
            .on("click", "#register", users.click_register)
            .on("click", "#logout", users.click_logout)
            .on("click", ".popup_login_cancel", bindings.click_popup_login_cancel)
            .on("click", "button", function(){bindings.click_popup_login_cancel()}) // apparently if you put this guy before the other buttons they don't get called
        users.init_login_boxes()
    }

    users.click_logout = function(){
        users.logout(function(er){
            if (er) alert("error logging out " + JSON.stringify(er, 0, 2))
            else {
                $("#login_box").show()
                $("#logout_box").hide()
            }
        })
    }

    users.click_login = function(e){
        var username = $("#username").val().trim()
        var password = $("#password").val().trim()
        if (!username || !password){
            alert("Invalid logins")
            e.stopImmediatePropagation()
        }
        users.login(username, password, function(er, user){
            if (er){
                alert("wrong")
                e.stopImmediatePropagation()
            } else {
                $("#login_box").hide()
                $("#logout_box").show()
            }
        })
    }

    users.click_register = function(e){
        var username = $("#username").val().trim()
        var password = $("#password").val().trim()
        if (!username || !password){
            alert("Please enter a new username and password to register")
            e.stopImmediatePropagation()
        }
        users.create_user(username, password, function(er, user){
            if (er){
                alert(JSON.stringify(er, 0, 2))
                e.stopImmediatePropagation()
            } else {
                $("#login_box").hide()
                $("#logout_box").show()
                alert("Registration complete. Your new identity: " + JSON.stringify(user, 0, 2))
            }
        })
    }

    users.create_user = function(username, password, done){
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

    users.login = function(username, password, done){
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

    users.logout = function(done){
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
        users.is_logged_in(function(er, loggedin){
            if (loggedin){
                $("#login_box").hide()
                $("#logout_box").show()
            }
        })
    }

    users.is_logged_in = function(done){
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
