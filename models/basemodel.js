/**
* MODELS 

/**
Projects {
	slug: text,
	name: text,
	customer : text,
	type_rate : number,
	hourly_rate: number,
	creator : id_user,
	date_creation: date,
	date_start: date,
	date_finish: date,
	last_date_mod: date,
	last_user_mod: date,
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
			hourly_rate: number,
		}
	],

	notes: [
		{
			id_user: id,
			note: text,
			date: date
		}
	]

}

projects_hours{
	id_project :id,
	id_user: id,
	year: number,
	week: number,
	// Day of the week
	day: number,
	approved : boolean,
	nhours: number,
}

weeks{
	year: nummber,
	week: number,
	id_user: id,
	notes: {
		id_user: id,
		date: date,
		note: text
	}
}


Users {
	username: text,
	password: md5(text),
	name: text,
	surname: text,
	profile: number
} 
**/

var ObjectID = require('mongodb').ObjectID,
 	util = require('util');


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
		// if (query && query.hasOwnProperty("id")){
		// 	query._id = new ObjectID(query.id);
		// 	delete query["id"];
		// }
		for (var key in query){

			if (util.isArray(query[key])){
				for (var i=0;i<query[key].length;i++){
					query[key][i] = this.parseQuery(query[key][i]);	
				}
			}
			else if (key == "id"){
				query[key] = new ObjectID(query[key]);
			}
			else if(key.indexOf("id_") != -1){
				query[key] = new ObjectID(query[key]);
			}
			
		}
		return query;
	}
}

module.exports = BaseModel;