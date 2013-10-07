jQuery(function($){

    var dom = {
        book: $("#book")
    }

    var api = (function(){
        var api = {}

        api.bug = function(error){
            console.log(JSON.stringify(bug, 0, 2))
            $.ajax({
                url: "/bug",
                type: "post",
                data: {
                    error: error
                },
                success: function(re){}
            })
        }

        return api
    }())

    var views = (function(){
        var views = {}

        return views
    }())

    var bindings = (function(){
        var bindings = {}

        return bindings
    }())

    var app = (function(){
        var app = {}

        app.init = function(){
            var book = new bok({
                src: "/static/public/tempest.html",
                box: dom.book
            })
        }

        return app
    }())

    app.init()
});
