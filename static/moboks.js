var bok = function(x){
    var o = {
        bID: x.bID,
        error: x.error
    }

    var dom = {
        box: x.box,
        content_right: null,
    }

    var k = {
        book: null,
        static_public: "/static/public",
        date_format: "D MMMM YYYY",
        date_format_alt: "h:mm A D MMM YYYY",
        page_size: 10,
        request_ahead: 20,
    }

    var page = (function(){
        var page = {}

        page.k = {
            page_size: 10, // should be same as on server
            pages: {}, // pages already requested
        }

        page.get_p = function(p){
            // var q = p - p % page.k.page_size
            if (page.k.pages[p]){
                return null
            } else {
                page.k.pages[p] = true
                return p
            }
        }

        return page
    }())

    var color = (function(){
        var color = {}

        // start:result:end == 0:point:range
        color.code_point_range = function(start, end, point, range){
            var sr = parseInt(start.substr(0, 2), 16) // substr(start, length) not (start, end)!
            var sg = parseInt(start.substr(2, 2), 16)
            var sb = parseInt(start.substr(4, 2), 16)
            var er = parseInt(end.substr(0, 2), 16)
            var eg = parseInt(end.substr(2, 2), 16)
            var eb = parseInt(end.substr(4, 2), 16)
            var pr = ("00" + parseInt(point * (er - sr) / range + sr).toString(16)).substr(-2)
            var pg = ("00" + parseInt(point * (eg - sg) / range + sg).toString(16)).substr(-2)
            var pb = ("00" + parseInt(point * (eb - sb) / range + sb).toString(16)).substr(-2)
            return pr + pg + pb
        }

        return color
    }())

    var css = (function(){
        var css = {}

        css.k = {
            cold: "dddddd",
            hot: "00ff00",
        }

        css.color_code_p_margin = function(p, pop){
            p.css({
                "border-right": "5px solid #" + color.code_point_range(css.k.cold, css.k.hot, pop, k.page_size)
            })
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

    var api = (function(){
        var api = {}

        api.get_book = function(bID, done){
            $.ajax({
                url: "/book/" + bID,
                type: "get",
                success: function(re){
                    if (re.book) done(null, re.book)
                    else done({error:"api getting book",re:re})
                }
            })
        }

        api.get_text = function(book, done){
            $.ajax({
                url: book.url,
                type: "get",
                success: function(re){
                    done(null, re)
                },
                error: function(xhr, status, er){
                    done({ready:false})
                }
            })
        }

        api.get_book_comments = function(bID, p, edit, page, done){
            $.ajax({
                url: "/book/" + bID + "/comments",
                type: "get",
                data: {
                    p: p,
                    edit: edit,
                    page: page,
                },
                success: function(re){
                    if (re.comments){
                        done(null, re.comments)
                    } else done({error:"api.get_book_comments",re:re})
                }
            })
        }

        api.get_comment = function(id, done){
            $.ajax({
                url: "/comment/" + id,
                type: "get",
                success: function(re){
                    if (re.comment) done(null, re.comment)
                    else done({error:"api getting comment",re:re})
                }
            })
        }

        api.get_comment_comments = function(id, page, done){
            $.ajax({
                url: "/comment/" + id + "/comments",
                type: "get",
                data: {
                    page: page
                },
                success: function(re){
                    if (re.comments) done(null, re.comments)
                    else done({error:"api.get_comment_comments",re:re})
                }
            })
        }

        api.upvote_comment = function(cID, done){
            $.ajax({
                url: "/comment/" + cID + "/upvote",
                type: "post",
                data: {

                },
                success: function(re){
                    if (re.num) done(null, re.num)
                    else done(re)
                }
            })
        }

        api.like_book = function(id, done){
            $.ajax({
                url: "/book/" + id + "/like",
                type: "post",
                success: function(re){
                    if (re.num) done(null, re.num)
                    else done(re)
                }
            })
        }

        api.get_paragraphs = function(done){
            $.ajax({
                url: "/book/" + o.bID + "/paragraphs",
                type: "get",
                success: function(re){
                    if (re.paragraphs) done(null, re.paragraphs)
                    else done(re)
                }
            })
        }

        api.get_latest_comments = function(page, done){
            $.ajax({
                url: "/book/" + o.bID + "/latest_comments",
                type: "get",
                data: {
                    page: page,
                },
                success: function(re){
                    if (re.comments) done(null, re.comments)
                    else done(re)
                }
            })
        }

        return api
    }())

    var templates = (function(){
        var templates = {}

        templates.replace_text_with_p_link = function(text){
            var exp = /(#([0-9]+))/ig;
            return text.replace(exp, "<span data-p-link='$2' class='boks_p_link'>$1</span>");
        }

        templates.replace_text_with_link = function(text){
            var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
            return text.replace(exp, "<a href='$1' class='boks_link' target='_blank'>$1</a>");
        }

        templates.drop_caps = function(text){
            var html = "<div class='first_letter'>" + text[0] + "</div>" + text.slice(1)
            return html
        }

        templates.book_info = function(book){
            var description = templates.drop_caps(book.description)
            var html = "<div class='boks_book_info'>"
                + "         <div class='boks_book_title_box'><span class='boks_book_title'>" + book.title + "</span></div>"
                + "         <div class='boks_book_created'>" + Date.create(book.created).long() + "</div>"
                // + "         <div class='boks_book_created'>" + moment(book.created).format(k.date_format) + "</div>"
                + "         <div class='boks_book_description'>" + description + "</div>"
                + "         <div class='boks_social_share_me'>"
                + "             <span>Like this book?</span> Spread the word!"
                + "         </div>"
                + "         <div class='boks_social'>"
                + "             <div class='addthis_toolbox addthis_default_style addthis_32x32_style'>"
                + "                 <a class='addthis_button_facebook'></a>"
                + "                 <a class='addthis_button_twitter'></a>"
                + "                 <a class='addthis_button_pinterest_share'></a>"
                + "                 <a class='addthis_button_google_plusone_share'></a>"
                + "                 <a class='addthis_button_blogger'></a>"
                + "                 <a class='addthis_button_tumblr'></a>"
                + "                 <a class='addthis_button_reddit'></a>"
                + "                 <a class='addthis_button_compact'></a><a class='addthis_counter addthis_bubble_style'></a>"
                + "             </div>"
                + "         </div>"
                + "         <div class='boks_book_para_graph_header'>"
                + "             <span>ParaGraph.</span> Click on the graph to skip to the good parts"
                + "         </div>"
                + "         <div class='boks_book_para_graph'></div><div class='clear_both'></div>"
                + "         <div class='boks_latest_comments_header'>"
                + "             <span>Latest Activity</span>"
                + "         </div>"
                + "         <div class='latest_comments_menu'>"
                // + "             <button class='hide_latest_edits'>Hide book edits</button>"
                // + "             <button class='watch_this_book'><i class='icon-eye-open'></i></button>"
                + "         </div>"
                + "         <div class='clear_both'></div>"
                + "         <div class='boks_latest_comments'></div>"
                + "         <button class='boks_latest_comments_more' data-page='0'><i class='icon-chevron-down'></i></button>"
                + "         <div class='boks_spinner'><i class='icon-spin icon-globe'></i><br><span>working<br>real<br>hard<br>. . .</span></div>"
                + "     </div>"
            return html
        }

        templates.para_graph = function(paragraphs){
            if (paragraphs.length == 0) return ". . . Aw this book has no comment. <a href='#click_to_reveal'>Be the first!</a>"
            var max = 0
            for (var j = 0; j < paragraphs.length; j++){
                if (paragraphs[j].count > max) max = paragraphs[j].count
            }
            var html = ""
            for (var i = 0; i < paragraphs.length; i++){
                html += "<div class='boks_para_box' data-p='" + paragraphs[i]._id + "'>"
                    + "      <div class='boks_para_bar' style='height:" + (paragraphs[i].count / max * 100) + "%'></div>"
                    + "  </div>"
            }
            return html
        }

        templates.reader = function(text){
            var html = "<div id='" + o.bID + "' class='boks_reader'>"
                + "         <div class='boks_content'>"
                + "             <div class='boks_content_left'>"
                + "                 <div id='click_to_reveal'><span>QUICK START GUIDE</span><br>Click on the paragraphs to see and write comments. Help make Bookses beautiful by editing and formatting the text.</div>"
                + "                 <div class='boks_text'>" + text + "</div>"
                + "             </div>"
                + "             <div class='boks_content_right'></div>"
                + "         </div>"
                + "     </div>"
            return html
        }

        templates.p_menu = function(p){
            var html = "<div class='boks_p_menu data' data-p='" + p + "'>"
                + "         <div class='boks_p_menu_toolbar'>"
                + "             <span class='boks_p_link' data-p-link='" + p + "'>Paragraph #" + p + "</span>"
                + "             <button class='boks_edit_p'>EDIT</button>"
                + "             <button class='boks_reply'>REPLY</button>"
                + "         </div>"
                + "         <div class='boks_reply_box_box'></div>"
                + "     </div>"
            return html
        }

        templates.edit_p_box = function(p){
            var html = "<div class='edit_p_box data' data-p='" + p + "'>"
                + "         <div class='edit_p_info'>Edit or format this paragraph. Everyone can vote on the best version to display.</div>"
                + "         <div class='edit_p_toolbar'></div>"
                + "         <div class='edit_p_text'></div>"
                + "         <button class='edit_p_post'>POST</button>"
                + "         <button class='edit_p_cancel'>cancel</button>"
                + "         <div class='clear_both'></div>"
                + "         <div class='edit_p_original_header'>Original</div>"
                + "         <div class='edit_p_original'></div>"
                + "         <div class='edit_p_versions_header'>Edits</div>"
                + "     </div>"
            return html
        }

        templates.reply_box = function(p, parentid){
            var datap = (p ? "data-p='" + p + "'" : "")
            var dataparent = (parentid ? "data-parent='" + parentid + "'" : "")
            var html = "<div class='boks_reply_box data' " + datap + " " + dataparent + ">"
                + "         <div class='boks_reply_info'>Comment or add a picture. Type #394 to create a link to paragraph 394.</div>"
                + "         <div class='boks_reply_toolbar'></div>"
                + "         <div class='boks_reply_text'></div>"
                + "         <div class='boks_reply_img'><img></div>"
                + "         <div class='boks_youtube_embed_box'>"
                + "             <div class='boks_youtube_embed_video'></div>"
                + "             <div class='boks_youtube_embed_menu'>"
                + "                 <input class='boks_youtube_embed_link' type='text' placeholder='Copy your Youtube link here'>"
                + "                 <button class='boks_youtube_embed_button'>Preview embed</button>"
                + "                 <div class='clear_both'></div>"
                + "             </div>"
                + "         </div>"
                + "         <button class='boks_reply_post'>POST</button>"
                + "         <button class='boks_reply_cancel'>cancel</button>"
                + "         <button class='boks_reply_img_input_button'><i class='icon-picture'></i></button>"
                + "         <button class='boks_reply_img_button'><i class='fontello-brush'></i></button>"
                + "         <div class='clear_both'></div>"
                + "     </div>"
            return html
        }

        // p and top can be null if comments have a parent, otw parentid can be null
        templates.comments_box = function(comments, p, parentid){
            var content = templates.comments(comments.slice(0, k.page_size))
            var datap = ((p || p == 0) ? "data-p='" + p + "'" : "")
            var parent = (parentid ? "data-parent='" + parentid + "'" : "")
            var more_comments = (comments.length > 10 ? "" : "boks_hide")
            var html = "<div class='boks_comments_box data' " + parent + " " + datap + ">"
                + "         <div class='boks_comments'>"
                +               content
                + "         </div>"
                + "         <div>"
                + "             <button class='boks_more_comments_button " + more_comments + "' data-page='0'><i class='icon-chevron-down'></i></button>"
                + "         </div>"
                + "     </div>"
            return html
        }

        templates.comments = function(comments){
            var html = ""
            for (var i = 0; i < comments.length; i++){
                html += templates.comment(comments[i])
            }
            return html
        }

        templates.comment = function(comment){
            var text = templates.replace_text_with_p_link(templates.replace_text_with_link(comment.comment))
            var img = (comment.img ? "<div class='boks_comment_img_box'><img class='boks_comment_img' src='" + comment.img + "'></div>" : "")
            var youtube = (comment.youtube ? yt.thumbnail(comment.youtube, yt.k.big) : "")
            var dataid = "data-id='" + comment._id + "'"
            var datap = "data-p='" + comment.p + "'"
            var has_replies = (comment.replies > 0 ? "has_comments" : "")
            var has_votes = (comment.votes > 1 ? "has_likes" : "")
            var html = "<div class='boks_comment data' " + dataid + " " + datap + ">"
                + "         <div class='boks_comment_text_box'>"
                + "             <div class='boks_comment_content'>"
                + "                 <div class='boks_comment_text'>" + text + "</div>"
                +                   img
                +                   youtube
                + "             </div>"
                + "             <div class='boks_comment_username'>" + comment.username + "</div>"
                + "             <div class='boks_comment_created'>" + Date.create(comment.created).long() + "</div>"
                + "             <div class='boks_comment_menu'>"
                + "                 <button class='boks_reply boks_green_underline'>REPLY</button>"
                // + "                 <button class='boks_reply boks_green_underline'><i class='icon-pencil'></i></button>"
                + "                 <button class='boks_comment_reply " + has_replies + "'><i class='icon-comments-alt'></i>" + comment.replies + "</button>"
                + "                 <button class='boks_comment_thumbs_up " + has_votes + "'><i class='icon-thumbs-up-alt'></i><span class='boks_comment_votes'>" + comment.votes + "</span></button>"
                + "                 <button class='boks_comment_flag'><i class='icon-flag'></i></button>"
                + "             </div>"
                + "             <div class='addthis_toolbox addthis_default_style addthis_32x32_style' "
                + "                     addthis:url='http://bookses.com/read/" + o.bID + "?c=" + comment._id + "'>"
                + "                 <a class='addthis_button_facebook'></a>"
                + "                 <a class='addthis_button_twitter'></a>"
                + "                 <a class='addthis_button_pinterest_share'></a>"
                + "                 <a class='addthis_button_google_plusone_share'></a>"
                + "                 <a class='addthis_button_tumblr'></a>"
                + "             </div>"
                + "             <div class='clear_both'></div>"
                + "         </div>"
                + "         <div class='boks_reply_box_box'></div>"
                + "         <div class='boks_comments_box_box'></div>"
                + "     </div>"
            return html
        }

        templates.latest_comments = function(comments){
            var html = ""
            for (var i = 0; i < comments.length; i++){
                html += templates.latest_comment(comments[i])
            }
            return html
        }

        templates.latest_comment = function(comment){
            var is_edit = (comment.edit ? "is_edit" : "")
            var dataid = "data-id='" + comment._id + "'"
            var datap = "data-p='" + comment.p + "'"
            var text = templates.replace_text_with_p_link(templates.replace_text_with_link(comment.comment.slice(0, 200))) + (comment.comment.length > 200 ? " . . ." : "")
            var img = (comment.img ? "<div class='latest_comment_img_box'><img class='latest_comment_img' src='" + comment.thumb + "'></div>" : "")
            var youtube = (comment.youtube ? "<div class='latest_comment_yt_thumb'>" + yt.thumbnail(comment.youtube, yt.k.small) + "</div>" : "")
            if (youtube) img = ""
            var replies
            if (comment.replies == 0) replies = "<div class='comment_replies red'>new</div>"
            else if (comment.replies == 1) replies = "<div class='comment_replies green'>1 reply</div>"
            else replies = "<div class='comment_replies green'>" + comment.replies + " replies</div>"
            var html = "<div class='latest_comment_box " + is_edit + "'>"
                + "         <div class='latest_comment data' " + dataid + " " + datap +  ">"
                + "             <div class='comment_info'>"
                + "                 <div class='comment_user'>" + comment.username + "</div>"
                +                   replies
                + "                 <div class='comment_modified'>" + Date.create(comment.modified).relative() + "</div>"
                + "             </div>"
                +               img
                +               youtube
                + "             <div class='comment_text'>" + text + "</div>"
                + "         </div>"
                + "     </div>"
            return html
        }

        return templates
    }())

    var yt = (function(){
        var yt = {}

        yt.k = {
            small: "small",
            big: "big"
        }

        yt.embed = function(link){
            var html = "<iframe type='text/html' width='100%' height='300' src='http://www.youtube.com/embed/"
                + yt.extract_id(link)
                + "?autoplay=0' frameborder='0'/>"
            return html
        }

        yt.thumbnail = function(link, size){
            var random_id = Math.random() // so youtube can find the right box if you have multiple copies of the same video
            var id = yt.extract_id(link)
            var img_size
            if (size == yt.k.big) img_size = "0"
            else if (size == yt.k.small) img_size = "default"
            var html = "<div id='" + random_id + "' class='youtube_thumb_box data' data-ytid='" + id + "'>"
                + "         <img class='youtube_thumb' src='http://img.youtube.com/vi/"
                +               id + "/" + img_size + ".jpg' alt='youtube video'>"
                + "         <div class='youtube_thumb_caption'><i class='icon-play-circle'></i></div>"
                + "     </div>"
            return html
        }

        yt.extract_id = function(link){
            return $.url(link).param("v")
        }

        return yt
    }())

    var draw = (function(){
        var draw = {}

        draw.templates = (function(){
            var templates = {}

            templates.canvas = function(){
                var html = "<canvas class='draw_canvas'></canvas>"
                return html
            }

            templates.draw_box = function(){
                var html = "<div class='draw_box'>"
                    + "         <div class='draw_box_info'>Drawing only works on desktop and laptop running the latest browser for now.</div>"
                    + "         <button class='draw_cancel'><i class='icon-trash'></i></button>"
                    + "         <div class='draw_menu'>"
                    + "             <button class='draw_save_quit'>save & quit</button>"
                    + "             <button class='draw_draw_button'><i class='icon-file-alt'></i></button>"
                    + "             <input class='draw_picture_input' accept='image/*' type='file'>"
                    + "             <button class='draw_picture_button'><i class='icon-picture'></i></button>"
                    + "             <button class='draw_undo_button'><i class='icon-undo'></i></button>"
                    + "             <button class='draw_pencil_tool'><i class='fontello-fat-pencil'></i></button>"
                    + "             <input class='draw_color' value='000000'>"
                    + "             <input class='draw_brush_size' type='range' min='1' max='50' value='5'>"
                    + "         </div>"
                    + "         <div class='draw_canvas_box'></div>"
                    + "     </div>"
                return html
            }

            return templates
        }())

        draw.bindings = (function(){
            var bindings = {}

            bindings.click_draw_button = function(){
                draw.canvas_init()
            }

            bindings.click_choose_img = function(){
                $(this).parent().children(".draw_picture_input").click()
            }

            bindings.change_img_input = function(e){
                bindings.load_img(URL.createObjectURL(e.target.files[0]))
            }

            bindings.load_img = function(url){
                draw.canvas_init()
                var img = new Image()
                img.src = url
                img.onload = function(){
                    var img_fatness = img.width / img.height
                    var canvas_fatness = draw.k.cntxt.canvas.width / draw.k.cntxt.canvas.height
                    var w = img.width, h = img.height, x = 0, y = 0
                    if (img_fatness > canvas_fatness){
                        var w = draw.k.cntxt.canvas.width
                        var h = img.height * draw.k.cntxt.canvas.width / img.width
                        var y = (draw.k.cntxt.canvas.height - h) / 2
                    } else {
                        var w = img.width * draw.k.cntxt.canvas.height / img.height
                        var h = draw.k.cntxt.canvas.height
                        var x = (draw.k.cntxt.canvas.width - w) / 2
                    }
                    draw.canvas_init(w, h) // recreate canvas with new size cause you don't want the white padding
                    draw.k.cntxt.drawImage(img, 0, 0, img.width, img.height, 0, 0, w, h)
                }
            }

            bindings.click_draw_undo_button = function(){
                draw.undo()
            }

            bindings.click_draw_cancel = function(){
                draw.k.preview.attr("src", "").hide()
                draw.clear()
                $("#popup").html("").hide()
            }

            bindings.click_save_quit = function(){
                $("#popup").hide()
                draw.k.preview.attr("src", URL.createObjectURL(draw.get_file())).show()
            }

            return bindings
        }())

        draw.init = function(img){
            $("#popup").html(draw.templates.draw_box()).show()
                .off()
                .on("click", ".draw_cancel", draw.bindings.click_draw_cancel)
                .on("click", ".draw_save_quit", draw.bindings.click_save_quit)
                .on("click", ".draw_draw_button", draw.bindings.click_draw_button)
                .on("click", ".draw_undo_button", draw.bindings.click_draw_undo_button)
                .on("click", ".draw_picture_button", draw.bindings.click_choose_img)
                .on("change", ".draw_picture_input", draw.bindings.change_img_input)
            draw.clear()
            draw.k.preview = img
            if (img.attr("src")) draw.bindings.load_img(img.attr("src"))
            else draw.draw()
        }

        draw.init_input = function(img){
            draw.clear()
            draw.k.preview = img
            $("<input class='direct_picture_input' accept='image/*' type='file'>")
                .on("change", function(e){
                    draw.k.direct_input_file = e.target.files[0]
                    var reader = new FileReader()
                    reader.onload = function(e){
                        draw.k.preview.attr("src", e.target.result).show()
                    }
                    reader.readAsDataURL(draw.k.direct_input_file)
                }).click()
        }



        draw.draw = function(){
            draw.bindings.click_draw_button()
        }

        draw.clear = function(){
            draw.k = {
                direct_input_file: null,
                preview: null,
                canvas: null,
                cntxt: null,
                top: null,
                left: null,
                history: [],
                brush_size: $(".draw_brush_size"),
                color: $(".draw_color").spectrum({
                    color: "#000",
                    showInput: true,
                    className: "full-spectrum",
                    showInitial: true,
                    showPalette: true,
                    showSelectionPalette: true,
                    maxPaletteSize: 10,
                    preferredFormat: "hex",
                    localStorageKey: "spectrum.js",
                    palette: [
                        ["rgb(0, 0, 0)", "rgb(67, 67, 67)", "rgb(102, 102, 102)",
                         "rgb(204, 204, 204)", "rgb(217, 217, 217)","rgb(255, 255, 255)"],
                        ["rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0)",
                         "rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)", "rgb(153, 0, 255)", "rgb(255, 0, 255)"],
                        ["rgb(230, 184, 175)", "rgb(244, 204, 204)", "rgb(252, 229, 205)", "rgb(255, 242, 204)", "rgb(217, 234, 211)",
                         "rgb(208, 224, 227)", "rgb(201, 218, 248)", "rgb(207, 226, 243)", "rgb(217, 210, 233)", "rgb(234, 209, 220)",
                         "rgb(221, 126, 107)", "rgb(234, 153, 153)", "rgb(249, 203, 156)", "rgb(255, 229, 153)", "rgb(182, 215, 168)",
                         "rgb(162, 196, 201)", "rgb(164, 194, 244)", "rgb(159, 197, 232)", "rgb(180, 167, 214)", "rgb(213, 166, 189)",
                         "rgb(204, 65, 37)", "rgb(224, 102, 102)", "rgb(246, 178, 107)", "rgb(255, 217, 102)", "rgb(147, 196, 125)",
                         "rgb(118, 165, 175)", "rgb(109, 158, 235)", "rgb(111, 168, 220)", "rgb(142, 124, 195)", "rgb(194, 123, 160)",
                         "rgb(166, 28, 0)", "rgb(204, 0, 0)", "rgb(230, 145, 56)", "rgb(241, 194, 50)", "rgb(106, 168, 79)",
                         "rgb(69, 129, 142)", "rgb(60, 120, 216)", "rgb(61, 133, 198)", "rgb(103, 78, 167)", "rgb(166, 77, 121)",
                         "rgb(91, 15, 0)", "rgb(102, 0, 0)", "rgb(120, 63, 4)", "rgb(127, 96, 0)", "rgb(39, 78, 19)",
                         "rgb(12, 52, 61)", "rgb(28, 69, 135)", "rgb(7, 55, 99)", "rgb(32, 18, 77)", "rgb(76, 17, 48)"]
                    ]
                })
            }
        }

        draw.canvas_init = function(width, height){
            $canvas = $(".draw_canvas_box").html(draw.templates.canvas()).find("canvas")
            $canvas.attr("width", width || $canvas.parent().width() - 30).attr("height", height || $canvas.parent().height() - 60)
            draw.k.top = $canvas.offset().top
            draw.k.left = $canvas.offset().left

            draw.k.canvas = $canvas.get(0)
            draw.k.cntxt = draw.k.canvas.getContext("2d")

            draw.k.cntxt.lineJoin = "round"
            draw.k.cntxt.lineCap = "round"
            draw.k.cntxt.save()
            draw.k.cntxt.fillStyle = '#fff'
            draw.k.cntxt.fillRect(0, 0, draw.k.cntxt.canvas.width, draw.k.cntxt.canvas.height)
            draw.k.cntxt.restore()

            // this, cause the other handlers can't tell if mouse up or down outside the canvas
            var mouse_down
            document.body.onmousedown = function(){
                mouse_down = true
            }
            document.body.onmouseup = function(){
                mouse_down = false
            }

            $canvas.mousedown(function(e){
                draw.save_history()
                draw.k.cntxt.lineWidth = draw.k.brush_size.val()
                draw.k.cntxt.strokeStyle = draw.k.color.val()
                draw.k.cntxt.beginPath()
                draw.k.cntxt.moveTo(e.pageX - draw.k.left, e.pageY - draw.k.top)
            }).mouseup(function(e){
                draw.k.cntxt.lineTo(e.pageX - draw.k.left + 1, e.pageY - draw.k.top + 1)
                draw.k.cntxt.stroke()
                draw.k.cntxt.closePath()
            }).mousemove(function(e){
                if (mouse_down == true){
                    draw.k.cntxt.lineTo(e.pageX - draw.k.left + 1, e.pageY - draw.k.top + 1)
                    draw.k.cntxt.stroke()
                }
            }).on("mouseenter", function(){
                if (mouse_down == true){
                    draw.k.cntxt.beginPath()
                }
            })
        }

        draw.get_file = function(){
            if (draw.k.direct_input_file) return draw.k.direct_input_file
            else if (draw.k.canvas) return draw.dataURL_to_blob(draw.k.canvas.toDataURL())
            else return null
        }

        draw.dataURL_to_blob = function(dataURL){
            var binary = atob(dataURL.split(',')[1])
            var array = []
            for (var i = 0; i < binary.length; i++){
                array.push(binary.charCodeAt(i))
            }
            return new Blob([new Uint8Array(array)], {type: 'image/png'})
        }

        draw.save_history = function(){
            var imgData = draw.k.canvas.toDataURL("image/png")
            draw.k.history.push(imgData)
        }

        draw.undo = function(){
            if (draw.k.history.length > 0){
                var undoImg = new Image()
                $(undoImg).load(function(){
                    var context = draw.k.canvas.getContext("2d")
                    context.drawImage(undoImg, 0,0)
                })
                undoImg.src = draw.k.history.pop()
            }
        }

        return draw
    }())

    var edits = (function(){
        var edits = {}

        edits.originals = {} // stores original paragraphs

        edits.get_original = function(p){
            return edits.originals[p]
        }

        edits.get_edits = function(done){
            $.ajax({
                url: "/book/" + o.bID + "/edits",
                type: "get",
                success: function(re){
                    if (re.edits) done(null, re.edits)
                    else done(re)
                }
            })
        }

        edits.get_edit = function(id, done){
            api.get_comment(id, function(er, entry){
                done(er, entry)
            })
        }

        edits.render_edits = function(comments, done){
            async.eachSeries(comments, function(comment, done){
                var p = comment.p
                var paragraph = $("#" + o.bID + " .boks_text p.paragraph").eq(p)
                edits.originals[p] = paragraph.html()
                paragraph.html(comment.comment).addClass("has_edits")
                done(null)
            }, function(er){
                done(er)
            })
        }

        edits.init = function(done){
            async.waterfall([
                function(done){
                    edits.get_edits(function(er, entries){
                        done(er, entries)
                    })
                },
                function(entries, done){
                    edits.render_edits(entries, function(er){
                        done(er)
                    })
                },
            ], function(er, re){
                done(er)
            })
        }

        return edits
    }())

    var views = (function(){
        var views = {}

        views.init = function(){
            views.load_book(function(er){
                if (er) o.error(er)
            })
            users.init()
        }

        views.load_book = function(done){
            var paragraphs
            async.waterfall([
                function(done){
                    api.get_book(o.bID, function(er, _book){
                        k.book = _book
                        done(er)
                    })
                },
                function(done){
                    dom.box.html(templates.book_info(k.book))
                    css.fit($(".boks_book_info"), $(".boks_book_title"))
                    done(null)
                },
                function(done){
                    api.get_paragraphs(function(er, _paragraphs){
                        paragraphs = _paragraphs
                        views.draw_para_graph(paragraphs)
                        done(er)
                    })
                },
                function(done){
                    setTimeout(function(){
                        api.get_text(k.book, function(er, text){
                            done(er, text)
                        })
                    }, 0)
                },
                function(text, done){
                    dom.box.append(templates.reader(text))
                        .off()
                        .on("click", ".boks_text p.paragraph", bindings.click_p)
                    dom.content_right = dom.box.find(".boks_content_right")
                        .off()
                        .on("click", ".boks_more_comments_button", bindings.click_more_comments)
                        .on("click", ".boks_comment_content", bindings.click_comment_reply)
                        .on("click", ".boks_comment_reply", bindings.click_comment_reply)
                        .on("click", ".boks_comment_thumbs_up", bindings.click_comment_like)
                        .on("click", ".boks_edit_p", bindings.click_edit_p)
                        .on("click", ".edit_p_cancel", bindings.click_edit_p_cancel)
                        .on("click", ".edit_p_post", bindings.click_edit_p_post)
                        .on("click", ".boks_reply", bindings.click_reply)
                        .on("click", ".boks_p_link", bindings.click_p_link)
                        .on("click", ".boks_reply_post", bindings.click_reply_post)
                        .on("click", ".boks_reply_cancel", bindings.click_reply_cancel)
                        .on("click", ".boks_reply_img_button", bindings.click_reply_img)
                        .on("click", ".boks_reply_img_input_button", bindings.click_reply_img_input)
                        .on("click", ".boks_youtube_embed_button", bindings.click_youtube_embed_button)
                        .on("click", ".youtube_thumb", bindings.click_youtube_thumb)
                        .on("click", ".youtube_thumb_caption", bindings.click_youtube_thumb)
                    done(null)
                },
                function(done){
                    addthis.toolbox(".addthis_toolbox")
                    views.highlight_paragraphs(paragraphs)
                    edits.init(function(er){
                        done(null)
                    })
                },
                function(done){
                    views.format_poetry(k.book)
                    views.load_latest_comments(0, function(er){
                        done(null)
                    })
                },
                function(done){
                    $(".boks_spinner").html("").hide()
                    var comment_id = $.url(window.location).param("c")
                    if (comment_id){
                        views.load_comment(comment_id, function(er){
                            done(er)
                        })
                    } else done(null)
                },
                function(done){
                    notis.init($("#notification_menu"), $("#notification_tray"))
                    done(null)
                }
            ], function(er, re){
                done(er)
            })
        }

        views.format_poetry = function(book){
            if (book.poetry){
                $(".boks_text p").css("white-space", "pre-wrap")
            }
        }

        views.draw_para_graph = function(paragraphs){
            $(".boks_book_para_graph").html(templates.para_graph(paragraphs))
                .on("click", ".boks_para_box", bindings.click_para_box)
        }

        views.highlight_paragraphs = function(paragraphs){
            for (var i = 0; i < paragraphs.length; i++){
                var p = paragraphs[i]._id
                var pop = Math.min(paragraphs[i].count, k.page_size)
                var paragraph = $("#" + o.bID + " .boks_text p.paragraph").eq(p)
                css.color_code_p_margin(paragraph, pop)
            }
        }

        views.load_comments = function(parentid, p, box, done){
            async.waterfall([
                function(done){
                    api.get_comment_comments(parentid, 0, function(er, comments){
                        done(er, comments)
                    })
                },
                function(comments, done){
                    box.html(templates.comments_box(comments, p, parentid))
                    addthis.toolbox(".addthis_toolbox")
                    done(null)
                },
            ], function(er, re){
                if (er) done({error:"load_comments",parentid:parentid,er:er})
                else done(null)
            })
        }

        views.load_comment = function(id, done){
            async.waterfall([
                function(done){
                    api.get_comment(id, function(er, comment){
                        done(er, comment)
                    })
                },
                function(comment, done){
                    var paragraph = $("#" + o.bID + " .boks_text p.paragraph").eq(comment.p)
                    $("html, body").animate({scrollTop:paragraph.offset().top - 40}, 100)
                    dom.content_right.prepend(templates.comments_box([comment], comment.p, comment.parent))
                    addthis.toolbox(".addthis_toolbox")
                    dom.content_right.prepend(templates.p_menu(comment.p)).animate({scrollTop:0}, 100)
                    done(null)
                }
            ], function(er){
                done(er)
            })
        }

        views.load_new_comment = function(comment){
            var elmt = $(templates.comment(comment))
            if (comment.parent){
                $(".boks_comment[data-id='" + comment.parent + "']").find(".boks_comments").eq(0).prepend(elmt)
            } else {
                dom.content_right.find(".boks_comments_box[data-p='" + comment.p + "']").first()
                    .find(".boks_comments").eq(0).prepend(elmt)
            }
            addthis.toolbox(".addthis_toolbox")
            return elmt
        }

        views.load_latest_comments = function(page, done){
            async.waterfall([
                function(done){
                    api.get_latest_comments(page, function(er, comments){
                        done(er, comments)
                    })
                },
                function(comments, done){
                    views.render_latest_comments(comments)
                    done(null)
                }
            ], function(er){
                done(er)
            })
        }

        views.render_latest_comments = function(comments){
            $(".boks_latest_comments").append(templates.latest_comments(comments))
                .off()
                .on("click", ".latest_comment", bindings.click_latest_comment)
            // $(".hide_latest_edits").off().on("click", function(){
            //     $(".latest_comment_box.is_edit").css("display", "none")
            // })
            $(".boks_latest_comments_more").off().on("click", bindings.click_more_latest_comments)
        }

        return views
    }())

    var events = (function(){
        var events = {}

        events.k = {
            comments_loaded: "comments_loaded",
            wait_and_slide: "wait_and_slide",
        }

        events.wait = {
            comment_id: null
        }

        events.init = function(){
            // $(document)
            // whoever wants to slide to the comment, triggers
            // wait_and_slide, which stores the comment's id. then,
            // once the comments are loaded, comments_loaded is
            // triggered, which checks for the wait_and_slide id if it
            // exists, then it slides.
                // .on(events.k.wait_and_slide, events.handler_wait_and_slide)
                // .on(events.k.comments_loaded, events.handler_comments_loaded)
        }

        // events.handler_wait_and_slide = function(x){
        //     events.wait.comment_id = x.comment_id
        // }

        // events.handler_comments_loaded = function(){
        //     if (events.wait.comment_id){
        //         var comment = $(".boks_comment[data-id='" + events.wait.comment_id + "']")
        //         if (comment.length){
        //             var top = comment.position().top
        //             dom.content_right.animate({scrollTop:top}, 100)
        //         } else {
        //             views.load_comment(events.wait.comment_id, function(er){})
        //         }
        //     }
        //     events.wait.comment_id = null
        // }

        return events
    }())

    var pl = (function(){
        var pl = {}

        pl.k = {
            playing: false,
            playlist_pos: -1,
            playlist: []
        }

        pl.init = function(){
            $("#prev_track").off().on("click", pl.click_prev_track)
            $("#toggle_play_pause").off().on("click", pl.click_toggle_play_pause)
            $("#next_track").off().on("click", pl.click_next_track)
        }

        pl.clear = function(){
            $("#playlist_menu").hide()
            pl.k = {
                playing: false,
                playlist_pos: -1,
                playlist: []
            }
        }

        pl.click_prev_track = function(){
            if (pl.k.playlist_pos == 0) return
            var pos = pl.k.playlist_pos - 1
            pl.play_track(pos)
        }

        pl.click_next_track = function(){
            if (pl.k.playlist_pos == pl.k.playlist.length - 1) return
            var pos = pl.k.playlist_pos + 1
            pl.play_track(pos)
        }

        pl.click_toggle_play_pause = function(){
            if (pl.k.playing){
                pl.k.playlist[pl.k.playlist_pos].pauseVideo()
            } else {
                pl.k.playlist[pl.k.playlist_pos].playVideo()
            }
            pl.k.playing = !pl.k.playing
            pl.toggle_play_pause_buttons(pl.k.playing)
        }

        pl.play_track = function(pos){
            if (pos != pl.k.playlist_pos){ // pause current track if different
                var player = pl.k.playlist[pl.k.playlist_pos]
                if (player) player.pauseVideo()
            }
            setTimeout(function(){
                pl.k.playing = true
                pl.k.playlist_pos = pos
                pl.k.playlist[pl.k.playlist_pos].playVideo() // what if this is already playing? . . . it's fine
                pl.toggle_play_pause_buttons(pl.k.playing)
            }, 500)
        }

        pl.pause_track = function(pos){
            pl.k.playing = false
            pl.toggle_play_pause_buttons(pl.k.playing)
        }

        pl.toggle_play_pause_buttons = function(playing){
            if (playing){
                $("#toggle_play_pause").html("<i class='icon-pause'></i>")
            } else {
                $("#toggle_play_pause").html("<i class='icon-play'></i>")
            }
        }

        pl.add_track = function(player){
            var current = pl.k.playlist[pl.k.playlist_pos]
            if (current) current.pauseVideo()
            pl.k.playlist_pos = pl.k.playlist.length
            pl.k.playlist.push(player)
            pl.k.playing = true
            pl.toggle_play_pause_buttons(pl.k.playing)
            return pl.k.playlist_pos
        }

        return pl
    }())

    var bindings = (function(){
        var bindings = {}

        bindings.init = function(){
            $("#go_top_page").on("click", bindings.click_go_top_page)
            $("#clear_comments").on("click", bindings.click_clear_comments)
        }

        bindings.click_clear_comments = function(){
            if (dom.content_right) dom.content_right.html("")
            pl.clear()
        }

        bindings.click_p = function(){
            var that = $(this)
            var p = that.attr("data-p") || that.index() // all new books should have data-p paragraphs
            api.get_book_comments(o.bID, p, false, 0, function(er, comments){
                if (comments && comments.length){
                    dom.content_right
                        .prepend(templates.comments_box(comments, p, comments[0].parent)) // parent should be null
                } else {
                    dom.content_right.prepend(templates.comments_box([], p, null))
                }
                addthis.toolbox(".addthis_toolbox")
                dom.content_right.prepend(templates.p_menu(p)).animate({scrollTop:0}, 100)
                $("html, body").animate({scrollTop:that.offset().top - 40}, 100)
                // $(document).trigger(events.k.comments_loaded)
            })
        }

        bindings.click_more_comments = function(){
            var that = $(this)
            var container = that.closest(".data")
            var box = container.children(".boks_comments")
            var page = parseInt(that.attr("data-page")) + 1
            var p = container.attr("data-p")
            var parentid = container.attr("data-parent")
            async.waterfall([
                function(done){
                    if (parentid) api.get_comment_comments(parentid, page, function(er, comments){
                        done(er, comments)
                    })
                    else api.get_book_comments(o.bID, p, false, page, function(er, comments){
                        done(er, comments)
                    })
                },
                function(comments, done){
                    if (comments.length){
                        box.append(templates.comments(comments.slice(0, k.page_size)))
                        addthis.toolbox(".addthis_toolbox")
                    }
                    if (comments.length <= k.page_size) that.hide()
                    else that.attr("data-page", page)
                    done(null)
                },
            ], function(er, re){
                if (er) console.log(JSON.stringify(({error:"bindings.click_more_comments",er:er}), 0, 2))
            })
        }

        bindings.click_comment_reply = function(){
            var comment_box = $(this).closest(".data")
            var id = comment_box.attr("data-id")
            var p = comment_box.attr("data-p")
            var children_box = comment_box.find(".boks_comments_box_box")
            views.load_comments(id, p, children_box, function(er){
                if (er) alert(JSON.stringify(er, 0, 2))
            })
        }

        bindings.click_comment_like = function(){
            var that = $(this)
            users.is_logged_in(function(er, user){
                if (!user || !user.loggedin) return users.show_login_box($("#popup"))
                try {
                    var id = that.closest(".data").attr("data-id")
                    var boks_comment_votes = that.find(".boks_comment_votes")
                    boks_comment_votes.html(parseInt(boks_comment_votes.html()) + 1)
                    api.upvote_comment(id, function(er, num){
                        if (er && er.loggedin == false) alert("You have to be logged in")
                        else if (er) alert(JSON.stringify(er, 0, 2))
                    })
                } catch (e){
                    alert("something went wrong. couldn't upvote comment")
                }
            })
        }

        bindings.click_go_top_page = function(){
            $("html, body").animate({scrollTop:0}, 100)
        }

        bindings.click_reply = function(){
            draw.clear()
            var that = $(this)
            users.is_logged_in(function(er, user){
                if (!user || !user.loggedin) return users.show_login_box($("#popup"))
                $(".edit_p_box").remove()
                var data_box = that.closest(".data")
                var id = data_box.attr("data-id")
                var p = data_box.attr("data-p")
                var box = data_box.find(".boks_reply_box_box").eq(0)
                box.html(templates.reply_box(p, id))
                box.find(".boks_reply_text").hallo({
                    plugins: {
                        halloformat: {
                            formattings: {
                                underline: true,
                                strikethrough: true
                            }
                        },
                        halloheadings: {},
                        hallojustify: {},
                        hallolists: {},
                    },
                    toolbar: 'halloToolbarFixed',
                    parentElement: box.find(".boks_reply_toolbar").eq(0)
                }).focus().trigger("halloactivated")
                data_box.find(".boks_comment_content").click()
            })
        }

        bindings.click_reply_post = function(){
            var that = $(this)
            var data_box = that.closest(".data")
            var p = data_box.attr("data-p")
            var parentid = data_box.attr("data-parent")
            var comment = data_box.find(".boks_reply_text").html().trim()
            if (!comment) comment = "."

            if (!FormData) return alert("can't upload: please update your browser")
            var data = new FormData()
            data.append("book", o.bID)
            data.append("p", p)
            if (parentid) data.append("parent", parentid)
            data.append("comment", comment)

            var img = draw.get_file(), img_src
            if (img){
                data.append("img", img)
                img_src = URL.createObjectURL(img)
            }

            var link = data_box.find(".boks_youtube_embed_link").val().trim()
            if (link) data.append("youtube", link)

            data_box.remove()

            var fake_comment = {
                book: o.bID,
                p: p,
                parent: parentid,
                username: "you",
                comment: comment,
                img: img_src,
                youtube: link,
                created: new Date(),
                votes: 1,
                replies: 0,
                pop: 1
            }
            var new_comment = views.load_new_comment(fake_comment)
            $("#" + o.bID + " .boks_text p.paragraph").eq(fake_comment.p).addClass("p_margin")

            $.ajax({
                url: "/comment",
                type: "post",
                data: data,
                processData: false,
                contentType: false,
                success: function(re){
                    if (re.comment){
                        new_comment.attr("data-id", re.comment._id)
                        new_comment.find(".boks_comment_username").eq(0).html(re.comment.username)
                    } else if (re.loggedin == false) alert("you have to log in")
                    else alert(JSON.stringify({error:"create comment",er:re}, 0, 2))
                }
            })
        }

        bindings.click_reply_cancel = function(){
            $(this).closest(".data").remove()
        }

        bindings.click_reply_img = function(){
            draw.init($(this).closest(".data").find("img"))
        }

        bindings.click_reply_img_input = function(){
            draw.init_input($(this).closest(".data").find(".boks_reply_img img"))
        }

        bindings.click_para_box = function(){
            $(this).fadeOut(50).fadeIn(100)
            var p = $(this).attr("data-p")
            setTimeout(function(){
                bindings.go_to_p(p)
            }, 300)
        }

        bindings.click_p_link = function(){
            var p = $(this).attr("data-p-link")
            bindings.go_to_p(p)
        }

        bindings.go_to_p = function(p){
            var paragraph = $("#" + o.bID + " .boks_text p.paragraph").eq(p)
            $("html, body").animate({scrollTop:paragraph.offset().top - 40}, 100)
            paragraph.click()
        }

        bindings.click_edit_p = function(){
            var that = $(this)
            users.is_logged_in(function(er, user){
                if (!user || !user.loggedin) return users.show_login_box($("#popup"))
                var p = that.closest(".data").attr("data-p")
                var text = $("#" + o.bID + " .boks_text p.paragraph").eq(p).html()
                api.get_book_comments(o.bID, p, true, 0, function(er, comments){
                    if (comments && comments.length){
                        dom.content_right.prepend(templates.comments_box(comments, p, comments[0].parent))
                    } else {
                        dom.content_right.prepend(templates.comments_box([], p, null))
                    }
                    addthis.toolbox(".addthis_toolbox")
                    dom.content_right.prepend(templates.edit_p_box(p))
                    dom.content_right.prepend(templates.p_menu(p)).animate({scrollTop:0}, 100)
                    var editor = dom.content_right.find(".edit_p_text").eq(0).hallo({
                        plugins: {
                            halloformat: {
                                formattings: {
                                    underline: true,
                                    strikethrough: true
                                }
                            },
                            halloheadings: {},
                            hallojustify: {},
                            hallolists: {},
                        },
                        toolbar: 'halloToolbarFixed',
                        parentElement: $(".edit_p_toolbar").eq(0)
                    })
                        .html(text)
                        .focus()
                        .trigger("halloactivated")
                    if (k.book.poetry) editor.addClass("poetry_edit")
                    dom.content_right.find(".edit_p_original").eq(0).html(edits.get_original(p) || text)
                })
            })
        }

        bindings.click_edit_p_cancel = function(){
            $(this).closest(".data").remove()
        }

        bindings.click_edit_p_post = function(){
            var parent = $(this).closest(".data")
            var p = parent.attr("data-p")
            var text = parent.find(".edit_p_text").html()
            if (text.trim() == "") text = "<br>" // just being careful
            $("#" + o.bID + " .boks_text p.paragraph").eq(p).html(text)

            if (!FormData) return alert("can't edit paragraph: please update your browser")
            var data = new FormData()
            data.append("book", o.bID)
            data.append("p", p)
            data.append("edit", true)
            data.append("comment", text)

            var fake_comment = {
                book: o.bID,
                p: p,
                parent: null,
                username: "you",
                comment: text,
                created: new Date(),
                votes: 1,
                replies: 0,
                pop: 1
            }
            var new_comment = views.load_new_comment(fake_comment)
            $("#" + o.bID + " .boks_text p.paragraph").eq(fake_comment.p).addClass("has_edits")
            parent.remove()

            $.ajax({
                url: "/comment",
                type: "post",
                data: data,
                processData: false,
                contentType: false,
                success: function(re){
                    if (re.comment){
                        new_comment.attr("data-id", re.comment._id)
                        new_comment.find(".boks_comment_username").eq(0).html(re.comment.username)
                    } else if (re.loggedin == false) alert("you have to log in")
                    else alert(JSON.stringify({error:"edit paragraph",er:re}, 0, 2))
                }
            })

        }

        bindings.click_latest_comment = function(){
            var that = $(this)
            var p = that.attr("data-p")
            var id = that.attr("data-id")
            var paragraph = $("#" + o.bID + " .boks_text p.paragraph").eq(p)
            $("html, body").animate({scrollTop:paragraph.offset().top - 40}, 100)
            api.get_comment(id, function(er, comment){
                if (er){
                    console.log(JSON.stringify(er, 0, 2))
                } else if (comment){
                    dom.content_right.prepend(templates.comments_box([comment], p, comment.parent))
                    addthis.toolbox(".addthis_toolbox")
                    dom.content_right.prepend(templates.p_menu(p)).animate({scrollTop:0}, 100)
                } else {
                    console.log(JSON.stringify({error:"click latest comment: can't find comment"}, 0, 2))
                }
            })
        }

        bindings.click_more_latest_comments = function(){
            var that = $(this)
            var page = parseInt(that.attr("data-page")) + 1
            that.attr("data-page", page)
            views.load_latest_comments(page, function(er){})
        }

        bindings.click_youtube_embed_button = function(){
            var box = $(this).closest(".data")
            var link = box.find(".boks_youtube_embed_link").val().trim()
            if (!link) return alert("Please paste a link")
            box.find(".boks_youtube_embed_video").html(yt.thumbnail(link, yt.k.big))
        }

        bindings.click_youtube_thumb = function(){
            $("#playlist_menu").show()
            var box = $(this).closest(".data")
            var id = box.attr("id")
            var yt_id = box.attr("data-ytid")
            var player = new YT.Player(id, {
                height: 300,
                width: "100%",
                playerVars: {
                    autoplay: 1,
                },
                videoId: yt_id,
            })
            var pos = pl.add_track(player)
            player.addEventListener("onStateChange", (function(id, pos){
                return function(e){
                    if (e.data == YT.PlayerState.PLAYING){
                        pl.play_track(pos)
                    } else if (e.data == YT.PlayerState.PAUSED){
                        pl.pause_track(pos)
                    }
                }
            })(id, pos))
        }

        return bindings
    }())

    this.init = function(){
        views.init()
        bindings.init()
        events.init()
        pl.init()
    }

    this.next_chapter = function(){

    }

    this.prev_chapter = function(){

    }

    this.init()
}
