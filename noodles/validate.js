

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

    return validate
}())

console.log("requiring " + module.filename + " from " + require.main.filename)
if (require.main == module){

} else {

}
