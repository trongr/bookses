var msg = (function(){
    var msg = {}

    msg.k = {
        default_hide_timeout: 5000,
        ready: false,
    }

    msg.init = function(){
        msg.k.ready = true
        var html = "<div id='msg_box'>"
            +           "<div id='msg_info'></div>"
            +           "<div id='msg_warning'></div>"
            +           "<div id='msg_error'></div>"
            +      "</div>"
        $("body").append(html)
    }

    msg.erin = function(er, er_msg, info_msg){
        if (er) msg.error(JSON.stringify({error:er_msg,er:er}, 0, 2))
        else if (info_msg) msg.info(info_msg)
    }

    msg.info = function(m, t){
        if (msg.k.ready == false) msg.init()
        msg.show("msg_info", m, t)
    }

    msg.error = function(m, t){
        if (msg.k.ready == false) msg.init()
        msg.show("msg_error", m, t)
    }

    msg.warning = function(m, t){
        if (msg.k.ready == false) msg.init()
        msg.show("msg_warning", m, t)
    }

    msg.show = function(type, m, t){
        var d = $("<div>" + m + "</div>")
        $("#" + type).append(d)
        setTimeout(function(){
            d.remove()
        }, t || msg.k.default_hide_timeout)
    }

    return msg
}());
