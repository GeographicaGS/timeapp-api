var util = require("util"),
    BaseModel = require("./basemodel.js");

function UserModel(db) {
    this._col = db.collection("users");
    BaseModel.call(this,db);
}

util.inherits(UserModel, BaseModel);

UserModel.prototype.getUser = function(username,callback) {
    this._col.findOne({username: username}, callback);
};


module.exports = UserModel;

