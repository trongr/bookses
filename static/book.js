jQuery(function($){
    var book = new bok({
        box: $("#book"),
        bID: document.URL.match(/read\/(.*)$/)[1],
        error: function(er){
            alert("This book is either being processed or something's gone wrong. Please send me this message: " + JSON.stringify(er, 0, 2))
        }
    })
    ;(function(){
        (function(i,s,o,g,r,a,m){
            i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();
            a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
        })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
        ga('create', 'UA-45942817-1', 'bookses.com');
        ga('send', 'pageview');
    }())
});
