var db = null,
    MongoClient = require('mongodb').MongoClient,
    format = require('util').format,
    md5 = require("MD5"),
    config = require("./config.js"),
    cons = require("./cons.js");

function createIndex(){
    db.collection('users').ensureIndex({ username: 1 },{background:true,unique:true},function(err){
        if(err) {
            console.error('Error creating index ' + err.message);
        }
    });   

    db.collection('users').ensureIndex({ email: 1 },{background:true,unique:true},function(err){
        if(err) {
            console.error('Error creating index ' + err.message);
        }
    });   

    db.collection('users').ensureIndex({ status: 1 },{background:true,},function(err){
        if(err) {
            console.error('Error creating index ' + err.message);
        }
    });  

    db.collection('users').ensureIndex({ username: 1, status:1},{background:true,unique:true},function(err){
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

    db.collection('projects').ensureIndex({ "members.id_user":1 },{background:true},function(err){
        if(err) {
            console.error('Error creating index ' + err.message);
        }
    });

    db.collection('weeks').ensureIndex({ year: 1,week:1,id_user:1},{background:true,unique:true},function(err){
        if(err) {
            console.error('Error creating index ' + err.message);
        }
    });

    db.collection('weeks').ensureIndex({ year: 1,week:1,id_user:1,removed:1},{background:true},function(err){
        if(err) {
            console.error('Error creating index ' + err.message);
        }
    });

    db.collection('weeks').ensureIndex({ year: 1,week:1},{background:true},function(err){
        if(err) {
            console.error('Error creating index ' + err.message);
        }
    });

    db.collection('projects_times').ensureIndex({ id_project: 1,id_user:1, year:1, week:1},{background:true},function(err){
        if(err) {
            console.error('Error creating index ' + err.message);
        }
    });

    db.collection('projects_times').ensureIndex({ id_project: 1},{background:true},function(err){
        if(err) {
            console.error('Error creating index ' + err.message);
        }
    });

    db.collection('projects_times').ensureIndex({ id_project: 1,id_user:1, year:1, week:1,day:1,removed:1},{background:true,unique:true},function(err){
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
            var users = [{
                username: "admin",
                password: md5("1234"),
                name: "Admin",
                email: "admin@geographica.gs",
                surname : "Superadmin",
                profile : cons.ST_PROFILE_ADMIN ,
                status : cons.ST_USER_ENABLE
            },
            {
                username: "alasarr",
                password: md5("1234"),
                email: "alberto.asuero@geographica.gs",
                name: "Alberto",
                surname : "Asuero",
                profile : cons.ST_PROFILE_ADMIN ,
                status : cons.ST_USER_ENABLE
            },
            {
                username: "paula",
                password: md5("1234"),
                email: "paula.julia@geographica.gs",
                name: "Paula",
                surname : "Juliá",
                profile : cons.ST_PROFILE_ADMIN ,
                status : cons.ST_USER_ENABLE
            },
            {
                username: "hector",
                password: md5("1234"),
                email: "hector.garcia@geographica.gs",
                name: "Héctor",
                surname : "García",
                profile : cons.ST_PROFILE_ADMIN ,
                status : cons.ST_USER_ENABLE
            },
            {
                username: "pablo",
                password: md5("1234"),
                email: "pablo.garcia@geographica.gs",
                name: "Pablo",
                surname : "García",
                profile : cons.ST_PROFILE_USER ,
                status : cons.ST_USER_ENABLE
            },
            {
                username: "javier",
                password: md5("1234"),
                email: "javier.aragon@geographica.gs",
                name: "Javier",
                surname : "Aragón",
                profile : cons.ST_PROFILE_USER ,
                status : cons.ST_USER_ENABLE
            },
             {
                username: "raul",
                password: md5("1234"),
                email: "raul.yeguas@geographica.gs",
                name: "Raúl",
                surname : "Yeguas",
                profile : cons.ST_PROFILE_USER ,
                status : cons.ST_USER_ENABLE
            }]
            ;

            collection.insert(users, function(err, docs) {
                if (!err){
                    console.log("Insert user successfully");
                }
            });
        }
        
        module.exports.UserModel = new (require("./models/usermodel.js"))(db);
        module.exports.ProjectModel = new (require("./models/projectmodel.js"))(db);
        module.exports.TimeModel = new (require("./models/timemodel.js"))(db);

        callback(err);

    });
}

module.exports.init = init