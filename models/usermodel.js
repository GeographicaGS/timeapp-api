var util = require("util"),
    BaseModel = require("./basemodel.js"),
    cons = require("../cons.js"),
    ObjectID = require('mongodb').ObjectID;

function UserModel(db) {
    BaseModel.call(this,db,db.collection("users"));
}

util.inherits(UserModel, BaseModel);

UserModel.prototype.getUserByUsername = function(username,callback) {
    this._col.findOne({username: username}, callback);
};

UserModel.prototype.getUserByID = function(id,callback) {
    this._col.findOne({_id: id}, callback);
};

UserModel.prototype.getUser = function(query,callback) {
    this._col.findOne(this.parseQuery(query), callback);
};

UserModel.prototype.getUsers = function(filter,callback){
    this._col.find(filter).toArray(function(error, array){
        for (var i=0;i< array.length;i++){
            delete array[i]["password"];
        }  
        callback(null,array);
    });
};

UserModel.prototype.getUserProjects = function(iduser,callback){

    var col = this._db.collection("projects");

    col.find({
        "members.id_user": new ObjectID(iduser)
    },
    {
        "fields" : ["name","_id"],
        "sort": { "name" : 1}
    }).toArray(callback);

};

module.exports = UserModel;

