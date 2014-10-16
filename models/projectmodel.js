var util = require("util"),
    BaseModel = require("./basemodel.js"),
    merge = require("merge"),
    cons = require("../cons.js"),
    ObjectID = require('mongodb').ObjectID,
    uuid = require('node-uuid'),
    _= require("underscore");


function ProjectModel(db) {
    BaseModel.call(this,db,db.collection("projects"));
}

util.inherits(ProjectModel, BaseModel);

// CRUD

/* Params 
	*name: name of project
	*hour_cost: cost per hour
	*colour: colour for project's items
*/
ProjectModel.prototype.create = function(data, callback) {

	var d = merge(data,{
		status: cons.ST_PROJECT_OPEN,
        total_spendings : 0,
        total_invoices: 0,
        total_hours_price: 0,
		invoices: [],
		spendings : [],
		notes : []
    });

    this._col.insert(this.parseQuery(d),{},callback);
};

ProjectModel.prototype.getProject = function(slug, callback) { 
	this._col.findOne({
		slug : slug
	},callback);
};

ProjectModel.prototype.getProjectById = function(id,fields, callback) { 
	if (!fields){
		fields = {};
	}
	this._col.findOne({_id : new ObjectID(id)},fields,callback);
};

ProjectModel.prototype.edit = function(id, data, callback) {
    this._col.update(
    	{_id :  new ObjectID(id)},
    	{ $set : this.parseQuery(data)},
    	{},
    	callback);
};

ProjectModel.prototype.getProjects = function(opts, callback) { 

	this._col.find({status: cons.ST_PROJECT_OPEN},{sort: { name:1}}).toArray(callback);
};

/*
*/
ProjectModel.prototype.updateTotalHoursPrice = function(id, callback) { 
	
	var _this = this;
	// get project
	this.getProjectById(id,function(err,proj){
		if (err) {
			callback(err);
			return;
		}

		var total_price;
		var col = _this._db.collection("projects_times");

		if (proj.type_rate==1){
			// same rate for all) sum hours and mult by price
			
			col.aggregate([
				{ $match : { 
						id_project: new ObjectID(proj._id),
						approved: true
					} 
				},
				{ $group : {_id: "$id_project", total : {$sum : "$nhours"} } }
			],function(err, result) {

				if (err ){
					callback(err);
				}
				else if (result && result.length>0) {

					total_price = result[0].total * proj.hourly_rate;
					// save 
					_this.edit(proj._id,{total_hours_price : total_price},function(err,d){
						callback(null,total_price);
					});
				}
				else{
					_this.edit(proj._id,{total_hours_price : 0},function(err,d){
						callback(null,0);
					});
				}
			});
		}
		else if (proj.type_rate==2){
			// Rate for each user
			col.aggregate([
				{ $match : { id_project: new ObjectID(proj._id),approved: true} },
				{ $group : {_id: "$id_user", total : {$sum : "$nhours"} } }
			],function(err, result) {
				if (err){
					callback(err);
				}
				else if(result && result.length>0){
					total_price = 0;

					for (var i=0;i<result.length;i++){
						var user = _.filter(proj.members, function(m){ return m.id_user.equals(result[i]._id); })[0];
						total_price += (user.hourly_rate * result[i].total);
					}
					
					// save 
					_this.edit(proj._id,{total_hours_price : total_price},function(err,d){
						callback(null,total_price);
					});
				}
				else{
					_this.edit(proj._id,{total_hours_price : 0},function(err,d){
						callback(null,0);
					});
				}
			});
			
		}

	})
	 
};

/*
opts {
	id_project: id,
	date: date,
	desc: text,
	amount: int >0,
	id_user : id_user
}
*/

ProjectModel.prototype.addSpending = function(opts,callback){
	var data = {
		id: uuid.v1(),
		id_user : new ObjectID(opts.id_user),
		date : new Date(opts.date),
		desc : opts.desc,
		amount : parseInt(opts.amount)
	};

	this._col.update(
			{_id: new ObjectID(opts.id_project)},
			{ $push : {spendings : data } ,$inc: {total_spendings : data.amount} }
			,callback);

};

ProjectModel.prototype.updateProjectTotalSpendings  = function(id_project,callback){
	
	var _this = this;
	this._col.aggregate([
		{ $match: {"_id" : new ObjectID(id_project)}},
		{ $unwind: "$spendings"},
		{ $group : {_id: "$_id", total: { $sum : "$spendings.amount"}}}
		],function(err,result){
			if (err ){
				callback(err);
			}
			else{
				var total = result.length > 0 ? result[0].total : 0;
				_this._col.update(
					{_id: new ObjectID(id_project)},
					{ $set : {total_spendings :total}}
					,callback);
			}
	});
};

/*
opts {
	id_project : id
	id_spending: uuid,
	date: date,
	desc: text,
	amount: int >0,
	id_user : id_user
}
*/
ProjectModel.prototype.editSpending = function(opts,callback){

	var data = {
		id : opts.id_spending,
		id_user : new ObjectID(opts.id_user),
		date : new Date(opts.date),
		desc : opts.desc,
		amount : parseInt(opts.amount)
	};


	var _this = this;

	this._col.update(
		{"spendings.id": opts.id_spending},
		{ $set : {"spendings.$": data } },function(err){
			if (err) callback(err);
			else _this.updateProjectTotalSpendings(opts.id_project,callback);
		});

}

/*
opts {
    id_project: id,
    id_spending: uuid
}
*/
ProjectModel.prototype.getSpending = function(opts,callback){

	this.getProjectById(opts.id_project,{_id: 1, spendings: 1},function(err,proj){
		if (err){
			callback(err);
		}
		else{
			for (var i=0;i<proj.spendings.length;i++){
				if (proj.spendings[i].id==opts.id_spending){
					callback(null,proj.spendings[i]);
					return;
				}
			}
			callback(null,{error: 404});
		}
	});
}

/*

*/
ProjectModel.prototype.deleteSpending  = function(opts,callback){
	var _this = this;

	this._col.update(
		{ _id: new ObjectID(opts.id_project) },
		{ $pull: { "spendings": { id: opts.id_spending } }},function(err){
			if (err){
				callback(err);		
			}
			else{
				_this.updateProjectTotalSpendings(opts.id_project,callback);
			}
		});
}



/*
opts {
	id_project: id,
	ref: text,
	date: date,
	desc: text,
	amount: int >0,
	id_user : id_user
}
*/

ProjectModel.prototype.addInvoice = function(opts,callback){
	var data = {
		id: uuid.v1(),
		ref : opts.ref,
		id_user : new ObjectID(opts.id_user),
		date : new Date(opts.date),
		desc : opts.desc,
		amount : parseInt(opts.amount)
	};

	this._col.update(
			{_id: new ObjectID(opts.id_project)},
			{ $push : {invoices : data } ,$inc: {total_invoices : data.amount} }
			,callback);

};

ProjectModel.prototype.updateProjectTotalInvoices  = function(id_project,callback){
	
	var _this = this;
	this._col.aggregate([
		{ $match: {"_id" : new ObjectID(id_project)}},
		{ $unwind: "$invoices"},
		{ $group : {_id: "$_id", total: { $sum : "$invoices.amount"}}}
		],function(err,result){
			if (err ){
				callback(err);
			}
			else{
				var total = result.length > 0 ? result[0].total : 0;
				_this._col.update(
					{_id: new ObjectID(id_project)},
					{ $set : {total_invoices :total}}
					,callback);
			}
	});
};

/*
opts {
	id_project : id
	id_invoice: uuid,
	ref: ref
	date: date,
	desc: text,
	amount: int >0,
	id_user : id_user
}
*/
ProjectModel.prototype.editInvoice = function(opts,callback){

	var data = {
		id : opts.id_invoice,
		ref : opts.ref,
		id_user : new ObjectID(opts.id_user),
		date : new Date(opts.date),
		desc : opts.desc,
		amount : parseInt(opts.amount)
	};


	var _this = this;

	this._col.update(
		{"invoices.id": opts.id_invoice},
		{ $set : {"invoices.$": data } },function(err){
			if (err) callback(err);
			else _this.updateProjectTotalInvoices(opts.id_project,callback);
		});

}

/*
opts {
    id_project: id,
    id_invoice: uuid
}
*/
ProjectModel.prototype.getInvoice = function(opts,callback){

	this.getProjectById(opts.id_project,{_id: 1, invoices: 1},function(err,proj){
		if (err){
			callback(err);
		}
		else{
			for (var i=0;i<proj.invoices.length;i++){
				if (proj.invoices[i].id==opts.id_invoice){
					callback(null,proj.invoices[i]);
					return;
				}
			}
			callback(null,{error: 404});
		}
	});
}

/*

*/
ProjectModel.prototype.deleteInvoice  = function(opts,callback){
	var _this = this;

	this._col.update(
		{ _id: new ObjectID(opts.id_project) },
		{ $pull: { "invoices": { id: opts.id_invoice } }},function(err){
			if (err){
				callback(err);		
			}
			else{
				_this.updateProjectTotalInvoices(opts.id_project,callback);
			}
		});
}

/*
opts {
	id_project: id,
	date: date,
	desc: text,
	amount: int >0,
	id_user : id_user
}
*/

ProjectModel.prototype.addBudget = function(opts,callback){
	var data = {
		id: uuid.v1(),
		id_user : new ObjectID(opts.id_user),
		date : new Date(opts.date),
		desc : opts.desc,
		amount : parseInt(opts.amount)
	};

	this._col.update(
			{_id: new ObjectID(opts.id_project)},
			{ $push : {budgets : data } ,$inc: {total_budget : data.amount} }
			,callback);

};

ProjectModel.prototype.updateProjectTotalBudgets  = function(id_project,callback){
	
	var _this = this;
	this._col.aggregate([
		{ $match: {"_id" : new ObjectID(id_project)}},
		{ $unwind: "$budgets"},
		{ $group : {_id: "$_id", total: { $sum : "$budgets.amount"}}}
		],function(err,result){
			if (err ){
				callback(err);
			}
			else{
				var total = result.length > 0 ? result[0].total : 0;
				_this._col.update(
					{_id: new ObjectID(id_project)},
					{ $set : {total_budget :total}}
					,callback);
			}
	});
};

/*
opts {
	id_project : id
	id_budget: uuid,
	date: date,
	desc: text,
	amount: int >0,
	id_user : id_user
}
*/
ProjectModel.prototype.editBudget = function(opts,callback){

	var data = {
		id : opts.id_budget,
		id_user : new ObjectID(opts.id_user),
		date : new Date(opts.date),
		desc : opts.desc,
		amount : parseInt(opts.amount)
	};


	var _this = this;

	this._col.update(
		{"budgets.id": opts.id_budget},
		{ $set : {"budgets.$": data } },function(err){
			if (err) callback(err);
			else _this.updateProjectTotalBudgets(opts.id_project,callback);
		});

}

/*
opts {
    id_project: id,
    id_budget: uuid
}
*/
ProjectModel.prototype.getBudget = function(opts,callback){

	this.getProjectById(opts.id_project,{_id: 1, budgets: 1},function(err,proj){
		if (err){
			callback(err);
		}
		else{
			for (var i=0;i<proj.budgets.length;i++){
				if (proj.budgets[i].id==opts.id_budget){
					callback(null,proj.budgets[i]);
					return;
				}
			}
			callback(null,{error: 404});
		}
	});
}

/*

*/
ProjectModel.prototype.deleteBudget  = function(opts,callback){
	var _this = this;

	this._col.update(
		{ _id: new ObjectID(opts.id_project) },
		{ $pull: { "budgets": { id: opts.id_budget } }},function(err){
			if (err){
				callback(err);		
			}
			else{
				_this.updateProjectTotalBudgets(opts.id_project,callback);
			}
		});
}




module.exports = ProjectModel;