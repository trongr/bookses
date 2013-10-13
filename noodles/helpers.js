

var helpers = module.exports = (function(){
    var helpers = {}

    helpers.check_id = function(id, done){
        if (/^[0-9a-fA-F]{24}$/.test(id)){
            done(null)
        } else {
            done({error:"helpers.check_id",id:id,er:"invalid id"})
        }
    }

    return helpers
}())

console.log("requiring " + module.filename + " from " + require.main.filename)
if (require.main == module){

} else {

}
