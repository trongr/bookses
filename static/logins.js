//
var users = (function(){
    var users = {}

    var k = {
        box: null,
        username: null,
        oninout: null
    }

    var templates = (function(){
        var templates = {}

        templates.logins = function(){
            var html = "<div id='login_box'>"
                + "         <span class='input_enter_submit'>"
                + "             <input id='username' placeholder='username'><br>"
                + "             <input id='password' type='password' placeholder='password'><br>"
                + "             <button id='login'>LOGIN</button><br>"
                + "         </span>"
                + "         <button id='signup'>sign me up</button><br>"
                + "         <button class='popup_login_cancel'><i class='icon-circle-arrow-left'></i></button>"
                + "     </div>"
                + "     <div id='logout_box'>"
                + "         <button id='profile'>Go to my profile</button><br>"
                + "         <button id='logout'>LOGOUT</button><br>"
                + "         <button class='popup_login_cancel'><i class='icon-circle-arrow-left'></i></button>"
                + "     </div>"
            return html
        }

        templates.register = function(){
            var html = "<div id='register_box'>"
                + "         <span class='input_enter_submit'>"
                + "             <input id='reg_username' placeholder='username'><br>"
                + "             <input id='reg_password' type='password' placeholder='password'><br>"
                + "             <input id='reg_email' placeholder='email'><br>"
                + "             <button id='register'>REGISTER</button><br>"
                + "         </span>"
                + "         <button class='popup_login_cancel'><i class='icon-circle-arrow-left'></i></button>"
                + "     </div>"
            return html
        }

        return templates
    }())

    var bindings = (function(){
        var bindings = {}

        bindings.click_popup_login_cancel = function(){
            if (k.box) k.box.html("").hide()
        }

        return bindings
    }())

    users.show_login_box = function(box){
        k.box = box
        k.box.html(templates.logins()).show()
            .off()
            .on("click", "#login", users.click_login)
            .on("click", "#signup", users.click_signup)
            .on("click", "#profile", users.click_profile)
            .on("click", "#logout", users.click_logout)
            .on("click", ".popup_login_cancel", bindings.click_popup_login_cancel)
            // .on("click", "button", function(){bindings.click_popup_login_cancel()}) // apparently if you put this guy before the other buttons they don't get called
        users.init_login_boxes()
    }

    users.click_profile = function(){
        if (k.username) window.location = "/profile?u=" + k.username
        else alert("Something's wrong: we can't get to your profile.\nPlease let Team Bookses know")
    }

    users.click_logout = function(){
        users.logout(function(er){
            if (er) alert("error logging out " + JSON.stringify(er, 0, 2))
            else {
                $("#login_box").show()
                $("#logout_box").hide()
                k.box.hide()
                users.init()
                notis.clear()
                if (k.oninout) k.oninout()
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
                k.box.hide()
                users.init()
                notis.init($("#notification_menu"), $("#notification_tray"))
                if (k.oninout) k.oninout()
            }
        })
    }

    users.click_signup = function(){
        k.box.html(templates.register())
            .off()
            .on("click", "#register", users.click_register)
            .on("click", ".popup_login_cancel", bindings.click_popup_login_cancel)
            .find("#reg_username").focus()
    }

    users.click_register = function(e){
        var username = $("#reg_username").val().trim()
        var password = $("#reg_password").val().trim()
        var email = $("#reg_email").val().trim()
        if (!username || !password){
            alert("Please enter a new username and password")
            e.stopImmediatePropagation()
        }
        users.create_user(username, password, email, function(er, user){
            if (er){
                alert(JSON.stringify(er, 0, 2))
                e.stopImmediatePropagation()
            } else {
                window.location = "/profile?u=" + user.username
            }
        })
    }

    users.create_user = function(username, password, email, done){
        $.ajax({
            url: "/user/" + username + "/register",
            type: "post",
            data: {
                password: password,
                email: email
            },
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

    users.init = function(oninout){
        if (oninout) k.oninout = oninout
        users.is_logged_in(function(er, user){
            if (user && user.loggedin){
                $("#logins").html(user.username)
            } else {
                $("#logins").html("LOGIN")
            }
        })
    }

    users.init_login_boxes = function(){
        users.is_logged_in(function(er, user){
            if (user && user.loggedin){
                $("#login_box").hide()
                $("#logout_box").show()
            } else {
                $("#username").focus()
            }
        })
    }

    users.is_logged_in = function(done){
        $.ajax({
            url: "/user/login",
            type: "get",
            success: function(re){
                if (re.user){
                    k.username = re.user.username
                    done(null, re.user)
                }
                else done({error:"may not be logged in",re:re})
            }
        })
    }

    return users
}())
