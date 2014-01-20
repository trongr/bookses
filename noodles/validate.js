var k = {
    username_maxlen: 100
}

var validate = module.exports = (function(){
    var validate = {}

    validate.id = function(id, done){
        if (/^[0-9a-fA-F]{24}$/.test(id)){
            done(null)
        } else {
            done({error:"validate.id",id:id,er:"invalid id"})
        }
    }

    validate.username = function(username, done){
        if (!username) return done({error:"null username"})
        else if (username.length > k.username_maxlen) return done({error:"username too long",er:"must be less than 100 characters"})
        if (/^[a-zA-Z0-9]+$/.test(username)) done(null)
        else done({error:"invalid username",username:username,er:"must be alphanumeric"})
    }

    validate.password = function(password, done){
        if (password.length) done(null)
        else done({error:"empty password",password:password})
    }

    validate.text_length = function(text, done){
        if (!text || text.length == 0) done({error:"empty text"})
        else if (text.length > 10000) done({error:"text longer than 10000 characters"})
        else done(null)
    }

    validate.text_length_zero_ok = function(text, done){
        if (!text) done({error:"null text"})
        else if (text.length > 1000) done({error:"text longer than 1000 characters"})
        else done(null)
    }

    validate.integer = function(d, done){
        if (/^[0-9]+$/.test(d)) done(null)
        else done({error:"not a positive integer"})
    }

    validate.search_string = function(text, done){
        if (!text || text.length == 0) done({error:"empty text"})
        else if (text.length > 100) done({error:"search string longer than 100 characters"})
        else done(null)
    }

    return validate
}())

console.log("requiring " + module.filename + " from " + require.main.filename)
if (require.main == module){

} else {

}
