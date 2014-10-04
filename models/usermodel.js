var util = require("util"),
    BaseModel = require("./basemodel.js");

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

module.exports = UserModel;

