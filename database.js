var db = null,
    MongoClient = require('mongodb').MongoClient,
    format = require('util').format,
    md5 = require("MD5"),
    config = require("./config.js");

function createIndex(){
    db.collection('users').ensureIndex({ username: 1 },{background:true,unique:true},function(err){
        if(err) {
            console.error('Error creating index ' + err.message);
        }
    });   

    db.collection('projects').ensureIndex({ name: 1},{background:true,unique:true},function(err){
        if(err) {
            console.error('Error creating index ' + err.message);
        }
    }); 

    db.collection('projects').ensureIndex({ status: 1,remove:1},{background:true},function(err){
        if(err) {
            console.error('Error creating index ' + err.message);
        }
    });

    db.collection('projects').ensureIndex({ slug: 1},{background:true,unique:true},function(err){
        if(err) {
            console.error('Error creating index ' + err.message);
        }
    });  

    db.collection('projects').ensureIndex({ slug: 1,remove:1},{background:true},function(err){
        if(err) {
            console.error('Error creating index ' + err.message);
        }
    });

}

function init(callback){
    MongoClient.connect(config.mongodb, function(err, localdb) {
        if(err) throw err;

        db = localdb;

        module.exports.db = db;

        createIndex();

        if (config.createUsersOnStart){
            var collection = db.collection('users');
            var u = {
                username: "admin",
                password: md5("admin"),
                name: "Admin",
                surname : "Superadmin",
                profile : 1 };

            collection.insert(u, function(err, docs) {
                if (!err){
                    console.log("Insert user successfully");
                }
            });
        }
        
        module.exports.UserModel = new (require("./models/usermodel.js"))(db);
        module.exports.ProjectModel = new (require("./models/projectmodel.js"))(db);

        callback(err);

    });
}

module.exports.init = init