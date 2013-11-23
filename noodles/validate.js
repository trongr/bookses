

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
        if (/^[a-zA-Z0-9]+$/.test(username)) done(null)
        else done({error:"invalid username",username:username,er:"must be alphanumeric"})
    }

    validate.password = function(password, done){
        if (password.length) done(null)
        else done({error:"empty password",password:password})
    }

    validate.text_length = function(text, done){
        if (!text || text.length == 0) done({error:"empty text"})
        else if (text.length > 500) done({error:"text longer than 500 characters"})
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
