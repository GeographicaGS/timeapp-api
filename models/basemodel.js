/**
* MODELS 

* Projects {
	name: text,
	hour_cost: number,
	colour: hex,	
}

* Users {
	username: text,
	password: md5(text),
	name: text,
	surname: text,
	profile: number
} 

* Hours {
	id_proj: id,
	id_user: id,
	date: date,
	n_hours: number
}

* Project_Spendings {
	id_proj: id,
	name: text,
	desc: text,
	cost: number
}

* Project_Invoices {
	id_proj: id,
	title: text,
	desc: text,
	cost: number,
	paid: boolean
}

* Project_Members {
	id_proj: id,
	id_user: id,
	hour_cost: number	
}

* Project_budget {
	id_proj: id,
	name: text,
	desc: text,
	amount: number
}

**/

function BaseModel(db, collection){
	this._db = db.collection(collection);
	
	this.findOne = function(query, callback){
		this._db.findOne(query, callback);
	}

	this.find = function(query, callback){
		if(typeof(query) != "undefined" && typeof(callback) != "undefined"){
			return this._db.find(query, callback);
		}else{
			return this._db.find();
		}
	}

	this.insert = function(data, callback){
		this._db.insert(data, callback);
	}

	this.update = function(query, data, callback){
		this._db.update(query, data, callback);
	}

	this.delete = function(query, callback){
		this._db.delete(query, callback);
	}

	this.count = function(query, callback){
		this._db.count(query, callback);
	}
}

module.exports = BaseModel;