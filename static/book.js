jQuery(function($){
    var book = new bok({
        box: $("#book"),
        bID: document.URL.match(/read\/(.*)$/)[1],
        error: function(er){
            alert("I think this book is being processed,\nor something has gone wrong and I\ncan't find it")
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
