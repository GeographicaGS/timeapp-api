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

/**
Projects {
	slug: text,
	name: text,
	customer : text,
	price_hour: number,
	creator : id_user,
	date_creation: date,
	date_start: date,
	date_finish: date,
	color: #fff,
	status: number,
	removed: false,
	total_spendings : number,
	total_invoices: number,
	total_hours_price: number,
	budgets : [
		{
			amount: number,
			desc: text,
			date: date,
			id_user: id
		}
	],
	invoices: [
		{
			invoice_number: text,
			amount: number,
			desc: text,
			date: date,
			id_user: id
		}
	],
	spendings : [
		{
			amount: number,
			desc: text,
			id_user: id
		}
	],
	members: [
		{
			id_user: id,
			price_hour: number,
		}
	]

}

Users {
	username: text,
	password: md5(text),
	name: text,
	surname: text,
	profile: number
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

		var keys = Object.keys(query);
		for (var key in keys){
			if(key.indexOf("id_") != -1){
				query.key = new ObjectID(querry.key);
			}
		}
		return query;
	}
}

module.exports = BaseModel;