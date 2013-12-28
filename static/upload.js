var upload = (function(){
    var upload = {}

    var k = {
        box: null,
        progress: null,
        done: null,
        max_book_size: 10485760,
    }

    var templates = (function(){
        var templates = {}

        templates.upload = function(){
            var html = "<div id='upload_box'>"
                + "         <div class='popup_upload_cancel'></div>"
                + "         <div id='upload_box_left'>"
                + "             <div id='upload_box_header'>Publish</div>"
                + "             <div id='text_files_only'>NOTE. Bookses only supports plain text files at the moment. You can format and make minor edits after uploading.</div>"
                + "             <input id='upload_book_title' placeholder='title'><br>"
                + "             <textarea id='upload_book_description' placeholder='description'></textarea><br>"
                + "             <input id='local_book_upload' type='file'><br>"
                + "             <input id='is_poetry' type='checkbox'>Preserve line breaks, for poetry<br>"
                + "             <button id='post_upload_button'>UPLOAD</button>"
                + "             <button class='popup_upload_cancel'>cancel</button>"
                + "             <div class='clear_both'></div>"
                + "         </div>"
                + "         <div id='upload_box_right'>"
                + "             <div id='book_preview'></div>"
                + "         </div>"
                + "     </div>"
            return html
        }

        return templates
    }())

    var bindings = (function(){
        var bindings = {}

        bindings.click_popup_upload_cancel = function(){
            if (k.box) k.box.hide()
        }

        // mark
        bindings.click_post_upload_button = function(){
            var post_button = $(this).attr("disabled", true)
            users.is_logged_in(function(er, loggedin){
                if (!loggedin) return alert("please log in")

                var title = $("#upload_book_title").val().trim()
                var description = $("#upload_book_description").val().trim()
                if (!title || !description){
                    post_button.attr("disabled", false)
                    return alert("title and description can't be empty")
                }
                var file = $("#local_book_upload")[0].files[0]
                if (!file) return alert("please choose a file")
                else if (file.size > k.max_book_size){
                    post_button.attr("disabled", false)
                    return alert("your file is too big: must be less than 10MB")
                }
                var is_poetry = $("#is_poetry").prop("checked")

                if (!FormData) return alert("can't upload: please update your browser")
                var data = new FormData()
                data.append("file", file)
                data.append("title", title)
                data.append("description", description)
                data.append("poetry", is_poetry)

                bindings.click_popup_upload_cancel()

                $.ajax({
                    url: "/book",
                    type: "post",
                    data: data,
                    processData: false,
                    contentType: false,
                    success: function(re){
                        if (re.book){
                            k.done({book:re.book})
                        } else if (re.loggedin == false) alert("you have to log in")
                        else console.log(JSON.stringify({error:"book",er:re}, 0, 2))
                    },
                    error: function(xhr, status, er){
                        console.log(JSON.stringify({error:"upload",xhr:xhr,status:status,er:er}, 0, 2))
                    },
                    complete: function(){
                        k.progress({percent:0})
                    },
                    xhr: function(){
                        var xhr = $.ajaxSettings.xhr()
                        if (xhr && xhr.upload){
                            xhr.upload.addEventListener('progress', function(event) {
                                if (event.lengthComputable) {
                                    var percent = event.loaded / file.size * 100
                                    k.progress({percent:percent})
                                }
                            }, false)
                        }
                        return xhr
                    }
                })
            })
        }

        bindings.change_book_input = function(e){
            if (!(window.File && window.FileReader && window.Blob)) return
            var file = e.target.files[0].slice(0, 1024)
            var reader = new FileReader()
            reader.onload = function(e){
                $("#book_preview").text(e.target.result).flowtype({lineRatio:1})
            }
            reader.readAsText(file)
        }

        return bindings
    }())

    upload.init = function(x){
        k.box = x.box
        k.progress = x.progress
        k.done = x.done
        k.box.html(templates.upload()).show()
            .off()
            .on("click", "#post_upload_button", bindings.click_post_upload_button)
            .on("click", ".popup_upload_cancel", bindings.click_popup_upload_cancel)
            .on("change", "#local_book_upload", bindings.change_book_input)
    }

    return upload
}())
