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

function BaseModel(db,defaultcol){
	this._db = db;
	this._col = defaultcol;
	
	this.findOne = function(query, callback){
		this._col.findOne(query, callback);
	}

	this.find = function(query, callback){
		if(typeof(query) != "undefined" && typeof(callback) != "undefined"){
			return this._col.find(query, callback);
		}else{
			return this._col.find();
		}
	}

	this.insert = function(data, callback){
		this._col.insert(data, callback);
	}

	this.update = function(query, data, callback){
		this._col.update(query, data, callback);
	}

	this.delete = function(query, callback){
		this._col.delete(query, callback);
	}

	this.count = function(query, callback){
		this._col.count(query, callback);
	}
}

module.exports = BaseModel;