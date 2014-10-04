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
	n_hours: number,
	comment: text
}

* Project_Spendings {
	id_proj: id,
	name: text,
	desc: text,
	cost: number,
	date: date
}

* Project_Invoices {
	id_proj: id,
	title: text,
	desc: text,
	cost: number,
	paid: boolean,
	date: date
}

* Project_Members {
	id_proj: id,
	id_user: id,
	hour_cost: number	
}

* Project_Budget {
	id_proj: id,
	name: text,
	desc: text,
	amount: number,
	date: date
}

**/

var ObjectID = require('mongodb').ObjectID;


function BaseModel(db,defaultcol){
	this._db = db;
	this._col = defaultcol;
	
	this.findOne = function(query, callback){
		this._col.findOne(query, callback);
	}

	this.find = function(query, callback){
		if(typeof(query) != "undefined" && typeof(callback) != "undefined"){
			return this._col.find(query, callback);
		}
		else{
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

	this.parseQuery = function(query){
		if (query && query.hasOwnProperty("id")){

			query._id = new ObjectID(query.id);
			delete query["id"];
		}
		return query;
	}
}

module.exports = BaseModel;