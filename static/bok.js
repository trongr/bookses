var bok = function(x){
    var o = {
        src: x.src,
        box: x.box,
    }

    var dom = {
        box: o.box,
    }

    var api = (function(){
        var api = {}

        api.get_book = function(url, done){
            $.ajax({
                url: url,
                type: "get",
                success: function(re){
                    done(null, re)
                },
                error: function(xhr, status, er){
                    done({error:"api getting book", xhr:xhr, status:status, er:er})
                }
            })
        }

        return api
    }())

    var templates = (function(){
        var templates = {}

        templates.reader = function(text){
            var html = "<div class='reader'>"
                + "         <button class='clip' type='button'>clip</button>"
                + "         <div class='reader_left'>"
                + "             <div class='book'>" + text + "</div>"
                + "         </div>"
                + "         <div class='reader_right'>"
                + "             <div class='quotes'></div>"
                + "         </div>"
                + "     </div>"
            return html
        }

        templates.quote = function(quote, top){
            var html = "<div"
                + "        style='"
                + "              background-color:#eee;"
                + "              padding:10px;"
                + "              white-space:pre-line;"
                + "              position:absolute;"
                + "              top:" + top + ";'>"
                +          quote
                + "     </div>"
            return html
        }

        return templates
    }())

    var views = (function(){
        var views = {}

        views.load_book = function(box, text, done){
            box.html(templates.reader(text))
                .on("click", "button", bindings.clip)
                .on("click", ".book p", bindings.onclick_paragraph)
            done(null)
        }

        views.load_quote = function(box, quote, top, done){
            box.append(templates.quote(quote, top))
            done(null)
        }

        return views
    }())

    var bindings = (function(){
        var bindings = {}

        // todo now
        // todo: selection is null of nothing selected
        bindings.clip = function(){
            var quotes = $(this).closest(".reader").find(".quotes")
            var s = window.getSelection()
            var r = s.getRangeAt(0)
            var node = r.startContainer.parentNode // todo: there's some error checking here depending on browser
            console.log($(node).index())
            // todo now: get bounding box of dom element rather than getboundingclientrect
            var quote = s.toString()
            var top = r.getBoundingClientRect().top + window.pageYOffset
            views.load_quote(quotes, quote, top, function(er){})
        }

        // todo: one click clip paragraph
        bindings.onclick_paragraph = function(){
            var p = $(this)
        }

        return bindings
    }())

    this.init = function(){
        async.waterfall([
            function(done){
                api.get_book(o.src, function(er, text){
                    done(er, text)
                })
            },
            function(text, done){
                views.load_book(o.box, text, function(er){
                    done(er)
                })
            },
        ], function(er, re){
            if (er) console.log(JSON.stringify({error:"bok setup", x:x, er:er}, 0, 2))
        })
    }

    this.next_chapter = function(){

    }

    this.prev_chapter = function(){

    }

    this.init()
}
