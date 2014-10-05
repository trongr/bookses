var templates = (function(){
    var templates = {}

    templates.dropcaps = function(text){
        var html = "<div class='firstletter'>" + text[0] + "</div>" + text.slice(1)
        return html
    }

    templates.books = function(books){
        var html = ""
        for (var i = 0; i < books.length; i++){
            var b = books[i]
            var published = ""
            var wip = ""
            if (b.ready) published = "<div class='published'>" + Date.create(b.readyon).short() + "</div>"
            else if (!b.preview) continue
            else {
                var days = new Date(b.readyon).getTime() - new Date()
                days = Math.ceil(days / 1000 / 60 / 60 / 24)
                wip = "<a class='wip'>Illustration in Progress: <span>" + days + "</span> Days to Go</a>"
            }
            var imgs = ""
            if (b.img_comments && b.img_comments.length){
                imgs +=  "<div class='imgs'>"
                for (var j = 0; j < b.img_comments.length; j++){
                    if (!b.img_comments[j].thumb) continue
                    imgs +=  "<div class='img'>"
                        +         "<a href='/b?id=" + b._id + "'><img src='" + b.img_comments[j].thumb + "'></a>"
                        +    "</div>"
                }
                imgs +=  "</div>"
            }
            var description = templates.dropcaps(b.description.slice(0, 250))
            if (b.description.length > 250) description += " . . . "
            html += "<div class='book'>"
                +        "<a class='title link' href='/b?id=" + b._id + "'>" + b.title + "</a>"
                +        wip
                +        published
                +        imgs
                +        "<div class='description'>" + description + "</div>"
                +   "</div>"
        }
        return html
    }

    templates.description = function(text){
        return templates.dropcaps(text)
    }

    templates.illos = function(entry){
        var html = "<div class='illos'>"
            +           "<img src='" + entry.img + "'>"
            +           "<div class='artists'><i>Artists.</i> " + (entry.artists ? entry.artists : "Anonymous") + "</div>"
            +           "<a class='improvethis link' href='/read/" + entry.book + "?p=" + entry.p + "'>Improve this image</a>"
            +      "</div>"
        return html
    }

    templates.imgs = function(entries){
        var html = ""
        for (var i = 0; i < entries.length; i++){
            var entry = entries[i]
            if (entry.thumb){
                html += "<div class='thumb'>"
                    +       "<a href='/read/" + entry.book + "?p=" + entry.p + "'><img src='" + entry.thumb + "'></a>"
                    +   "</div>"
            } else {
                var text = entry.comment.replace("<script>", "").replace("</script>", "")
                html += "<div class='comment'>"
                    +       "<a href='/read/" + entry.book + "?p=" + entry.p + "'>" + text + "---" + entry.username + "</a>"
                    +   "</div>"
            }
        }
        return html
    }

    templates.votes = function(votes, offset){
        var html = ""
        for (var i = 0; i < votes.length; i++){
            var v = votes[i]
            var text = v.text.replace("<script>", "").replace("</script>", "")
            html += "<div class='vote data' data-id='" + v._id + "'>"
                +       "<div class='votepos'>" + (offset + i + 1) + ".</div>"
                +       "<div class='votetext'>"
                +           text
                +       "</div>"
                +       "<div class='votemenu'>"
                +           "<button class='votes'>" + v.votes + "</button>"
                +           "<button class='upvote'><i class='fa fa-thumbs-o-up'></i></button>"
                +       "</div>"
                +   "</div>"
        }
        return html
    }

    return templates
}())