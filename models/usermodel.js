var UserModel = BaseModel(db, 'users');

UserModel.prototype.getWhaterever = function(){
	return "whatever";
}