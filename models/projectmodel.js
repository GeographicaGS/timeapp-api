var util = require("util"),
    BaseModel = require("./basemodel.js"),
    merge = require("merge"),
    cons = require("../cons.js"),
    ObjectID = require('mongodb').ObjectID,
    uuid = require('node-uuid'),
    _= require("underscore"),
    moment = require("moment");


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

	if (data.hasOwnProperty("members")){
		for (var i=0;i<data.members.length;i++){
			data.members[i].id_user = new ObjectID(data.members[i].id_user );
		}
	}

	var d = merge(data,{
		status: cons.ST_PROJECT_OPEN,
        total_spendings : 0,
        total_invoices: 0,
        total_hours_price: 0,
		invoices: [],
		spendings : [],
		notes : []
    });

	d.id_user = new ObjectID(d.id_user);
	d.creator = new ObjectID(d.creator);
	d.budgets[0].id_user = new ObjectID(d.id_user);

    this._col.insert(d,{},callback);
};

ProjectModel.prototype.getProject = function(slug, callback) { 
	this._col.findOne({
		slug : slug
	},callback);
};

function getMongoDateFilter(datefilter){
	var yearmin = datefilter.min.year,
		yearmax = datefilter.max.year,
		weekmin = datefilter.min.week,
		weekmax = datefilter.max.week;

	if (yearmin == yearmax){
		return {
			"year" : {
				$eq : yearmin
			},
			"week": {
				$gte: weekmin,
				$lte : weekmax
			}
		}
	}
	else {
		var orCondition = [
			// Min Year
			{
				"year" : { $eq : yearmin},
				"week" : { $gte : weekmin}
			},
			// Last year
			{
				"year" : { $eq : yearmax},
				"week" : { $lte : weekmax}
			}
		];
		
		if (yearmax-yearmin>1){
			// Add intermediate days
			var intermediateInYears = [];
			for (var i=yearmin+1;i<yearmax;i++){
				intermediateInYears.push(i);
			}	

			orCondition.push({
				"year" : {$in : intermediateInYears}
			});
		}
		
		return {
			$or : orCondition
		}
	}


}

function filterArrayByDate(array,startDate,endDate){

	var newArray = []; 
	for (var i=0;i<array.length;i++){
		var current = moment(array[i].date).startOf('day');
		if (current>=startDate && current<=endDate){
			newArray.push(array[i]);
		}
	}

	return newArray;
}

ProjectModel.prototype.getProjectForAdmin = function(opts, callback) { 
	var _this = this;
	this._col.findOne({
		slug : opts.slug
	},function(err,proj){
		if (err){
			callback(err);	
		} 
		else{

			var filter = {  $match : { 
					id_project: new ObjectID(proj._id),
					approved: true
				}
			};

			if (opts.datefilter){
				filter["$match"] = _.extend({},filter["$match"],getMongoDateFilter(opts.datefilter));

				var startDate = moment(opts.datefilter.min.year + "-01-01").day(1).isoWeek(opts.datefilter.min.week).startOf('day'),
					endDate = moment(opts.datefilter.max.year + "-01-01").day(7).isoWeek(opts.datefilter.max.week).startOf('day');
				
				// Filter budgets by date.
				proj.budgets = filterArrayByDate(proj.budgets,startDate,endDate);
				proj.spendings = filterArrayByDate(proj.spendings,startDate,endDate);
				proj.invoices = filterArrayByDate(proj.invoices,startDate,endDate);

			}

			// refresh totals
			proj.total_budget = 0;
			for (var i=0;i<proj.budgets.length;i++){
				proj.total_budget += proj.budgets[i].amount;
			}
			
			proj.total_spendings = 0;
			for (var i=0;i<proj.spendings.length;i++){
				proj.total_spendings += proj.spendings[i].amount;
			}
			
			proj.total_invoices = 0;
			for (var i=0;i<proj.invoices.length;i++){
				proj.total_invoices += proj.invoices[i].amount;
			}
				
			// let's get the hours grouped by user
			col = _this._db.collection("projects_times"),
			col.aggregate([
				filter
				,
				{ $group : {_id: "$id_user", total : {$sum : "$nhours"} } }
			],function(err, result) {
				if (err ){
					callback(err);
				}
				else{
					proj.users_times = {};
					for (var i=0;i< result.length;i++){
						proj.users_times[result[i]._id] = result[i].total;
					}

					// refresh total_hours_price
					proj.total_hours_price = 0;
					proj.total_hours = 0;
					for (user in proj.users_times){
						proj.total_hours += proj.users_times[user];

						if (proj.type_rate == 1){
							proj.total_hours_price += proj.users_times[user] * proj.hourly_rate;
						}
						else if (proj.type_rate == 2){
							var member = _.filter(proj.members, function(m){ return m.id_user.equals(user); })[0];
							proj.total_hours_price += proj.users_times[user] * member.hourly_rate;
						}
					}
					
					callback(null,proj);
				}
				
			});
		}	
	});
};


ProjectModel.prototype.getProjectById = function(id,fields, callback) { 

	this._col.findOne({_id : new ObjectID(id)},fields,callback);
}

ProjectModel.prototype.__performEdit = function(id,data,callback){
	var _this = this;
	this._col.update(
    	{_id :  new ObjectID(id)},
    	{ $set : data},
    	{},
    	function(err,data){
    		if (err){
    			callback(err,null);
    			return;
    		}
    		else{
    			_this.updateTotalHours(id,callback);
    		}
    	});
};

ProjectModel.prototype.__crudEdit = function(id,data,callback){
	this._col.update(
    	{_id :  new ObjectID(id)},
    	{ $set : data},
    	{},
    	callback);
}

ProjectModel.prototype.edit = function(id, data, callback) {
	if (data.hasOwnProperty("last_user_mod")){
		data.last_user_mod = new ObjectID(data.last_user_mod);	
	}
	
	var _this = this;
	// get current users
	this.getProjectById(id,{"members":1},function(err,oldproj){
		if (err){
			callback(err);
			return
		}

		if (data.hasOwnProperty("members")){
			for (var i=0;i<data.members.length;i++){
				data.members[i].id_user = new ObjectID(data.members[i].id_user );
			}
		}

		var oldmembersflat = _.pluck(oldproj.members,"id_user");
		var membersflat = _.pluck(data.members,"id_user");
		var usersToRemove = [];
		
		for (var i=0;i<oldproj.members.length;i++){

			var found = false;
			for (var j=0;j<data.members.length;j++){
				if (data.members[j].id_user.equals(oldproj.members[i].id_user)){
					found = true;
				}
			}

			if (!found){
				usersToRemove.push(oldproj.members[i].id_user);
			}
		}

		if (usersToRemove.length>0){
			var col = _this._db.collection("projects_times");
			col.count({
				id_project : new ObjectID(id),
				id_user : { $in : usersToRemove}
			},function(err,n){
				if (err){
					callback(err);
					return;
				}

				if (n!=0){
					callback("Trying to remove a user with hours from the project");
					return;
				}
				else{
					_this.__performEdit(id,data,callback);
				}

			});
		}
		else{
			_this.__performEdit(id,data,callback);
		}
	  
	});

};

ProjectModel.prototype.getProjects = function(opts, callback) { 
	console.log(opts);
	this._col.find(opts,{sort: { name:1}}).toArray(callback);
};

/*
*/
ProjectModel.prototype.updateTotalHours = function(id, callback) { 
	
	var _this = this;
	// get project
	console.log("UpdateTotalHours");
	console.log(id);
	this.getProjectById(id,{},function(err,proj){
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
					_this.__crudEdit(proj._id,{total_hours_price : total_price, total_hours: result[0].total},function(err,d){
						callback(null,total_price);
					});
				}
				else{
					_this.__crudEdit(proj._id,{total_hours_price : 0, total_hours : 0},function(err,d){
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
					var total_hours = 0;

					for (var i=0;i<result.length;i++){
						var user = _.filter(proj.members, function(m){ return m.id_user.equals(result[i]._id); })[0];
						total_price += (user.hourly_rate * result[i].total);
						total_hours += result[i].total;
					}
					
					// save 
					_this.__crudEdit(proj._id,{total_hours_price : total_price, total_hours: total_hours},function(err,d){
						callback(null,total_price);
					});
				}
				else{
					_this.__crudEdit(proj._id,{total_hours_price : 0, total_hours : 0	},function(err,d){
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

ProjectModel.prototype.__countMembers = function(p){
	var col = this._db.collection("projects_times"),
		members = _.pluck(p.members,"id_user"),
		_this = this;

	col.aggregate([
		{
			$match: {
				id_project : p["_id"],
				id_user : { $nin : members}
			}
		},
		{ $group : {_id: "$id_user" } }
		],function(err,result){
			if (err ){
				callback(err);
			}
			else{
				if (result.length){
					
					var col2 = _this._db.collection("users");
					for (var i=0;i<result.length;i++){


						col2.findOne({
							_id : new ObjectID(result[i]._id)
						},{"name":1,"surname":result},function(err,result){
							if (err){
								console.log(err);
							}
							else{
								console.log(p.name + ": " + result.name + " " + result.surname);
							}
						});
					}

				}
			}
	});
}

ProjectModel.prototype.__addMissingMembers = function(p){
	var col = this._db.collection("projects_times"),
		members = _.pluck(p.members,"id_user"),
		_this = this;

	col.aggregate([
		{
			$match: {
				id_project : p["_id"],
				id_user : { $nin : members}
			}
		},
		{ $group : {_id: "$id_user" } }
		],function(err,result){
			if (err ){
				callback(err);
			}
			else{
				if (result.length){
					
					var col2 = _this._db.collection("users");
					var members = [];

					for (var i=0;i<result.length;i++){
						members.push({
							id_user : new ObjectID(result[i]._id),
							hourly_rate : "25"
						});
					}

					_this._col.update(
						{_id :  p._id},
						{ $push: { members: { $each: members } } },
				    	{},
				    	function(err){
				    		if (err){
				    			console.log(error)
				    		}
				    		else{
				    			console.log("Fix project " + p.name)
				    		}
				    	});
				}
			}
	});	
}

ProjectModel.prototype.fixProjectMembers = function(callback){
	var _this = this;
	this._col.find({

	}).toArray(function (err,results){
		if (err){
			callback(err);
			return;
		}
		for (var i=0;i<results.length;i++){
			var p = results[i];
			_this.__countMembers(p);	
			//_this.__addMissingMembers(p);	
		}
		
		
	})
}




module.exports = ProjectModel;