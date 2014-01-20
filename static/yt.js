
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

    yt.thumbnail_src = function(link, size){
        var id = yt.extract_id(link)
        var img_size
        if (size == yt.k.big) img_size = "0"
        else if (size == yt.k.small) img_size = "default"
        return "http://img.youtube.com/vi/" + id + "/" + img_size + ".jpg"
    }

    yt.extract_id = function(link){
        return $.url(link).param("v")
    }

    return yt
}())
