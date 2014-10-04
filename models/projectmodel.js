var util = require("util"),
    BaseModel = require("./basemodel.js");

function ProjectModel(db) {
    this._col = db.collection("projects");
    BaseModel.call(this,db);
}

util.inherits(ProjectModel, BaseModel);

// CRUD

/* Params 
	*name: name of project
	*hour_cost: cost per hour
	*colour: colour for project's items
*/
ProjectModel.prototype.createProject = function(params, callback) {
    this._col.insert({
    	name: params.name, 
    	hour_cost: params.hour_cost, 
    	colour: params.colour,
    	active: true
    },
   	callback);
};

/* Params
	id: id of the project
	name: name of the project
*/
ProjectModel.prototype.getProject = function(params, callback){
	if(params.id){
		this._col.findOne(this.parseQuery(params), callback);
	}else if(params.name){
		var self = this;
		this._col.find({name: params.name}, function(err, cursor){
			if(!err){
				cursor.toArray(self.callback);
			}else{
				self.callback(err, null);
			}
		});
	}
}

/* Params 
	*id: id of the project
	*name: name of project
	*hour_cost: cost per hour
	*colour: colour for project's items
*/
ProjectModel.prototype.updateProject = function(params, callback) {
	this._col.update(this.parseQuery(params),
		{ name: params.name, hour_cost: params.hour_cost, colour: params.colour},
		callback);
}

ProjectModel.prototype.deleteProject = function(id, callback){
	this._col.update({_id: id}, {active: false}, callback);
}

// Members

/* Params
	id_project: id of the project
	id_member: id of the member
*/
ProjectModel.prototype.getMembers = function(params, callback){
	if(Object.keys(params).length > 0){
		var col_member = this._bd.collection("project_members");
		var self = this;
		var query = {};
		params.id_project ? query.id_proj = params.id_project;
		params.id_member ? query._id = params.id_member;
		col_member.find(query, function(err, cursor){
			if(!err){
				cursor.toArray(function(err, array){
					if(!err){
						var members = [];
						var col_user = self._bd.collection("users");
						for (var member in array){
							col_user.findOne({_id: member.id_user}, function(err, user){
								if(!err){
									user.hour_cost = member.hour_cost;
									members.push(user);
								}else{
									self.callback(err, null);
								}
							});
						}
						self.callback(null, members);
					}else{
						self.callback(err, null);
					}
				});
			}else{
				self.callback(err, null);
			}
		});
	}else{
		callback({error: 'TODO: Define errors. ERROR: Empty params.'},null);
	}
}

/* Params 
	id_proj: id of project
	id_user: id of user
	hour_cost: cost per hour for this user
*/
ProjectModel.prototype.addMember = function(params, callback){
	var col_member = this._bd.collection("project_members");
	params.hour_cost ? hour_cost=null;
	var member_id = col_member.insert({
		id_proj: params.id_proj, 
		id_user: params.id_user, 
		hour_cost: params.hour_cost, 
		active: true
	}, callback);
	console.log("Last insert id: "+member_id);
}

/* Params 
	id_proj: id of project
	id_user: id of user
	hour_cost: cost per hour for this user
*/
ProjectModel.prototype.updateMemberCost = function(params, callback){
	var col_member = this._bd.collection(project_members);
	col_member.update(
		{id_proj: params.id_proj, id_user: params.id_user}, 
		{hour_cost: params.hour_cost}, 
		callback);
}

/* Params
	id_proj: id of project
	id_user: id of user
*/
ProjectModel.prototype.deleteMember = function(params, callback){
	var col_member = this._bd.collection(project_members);
	col_member.update({id_proj: params.id_proj, id_user: params.id_user}, {active: false}, callback);
}

// Hours

/* Params
	id_proj: id of project
	id_user: id of user
	id_hour: id of hour entry
*/
ProjectModel.prototype.getHours = function(params, callback){
	var col_hour = this._bd.collection("hours");
	var self = this;
	var query = {};
	params.id_hour ? query._id = params.id_hour;
	params.id_proj ? query.id_proj = params.id_proj;
	params.id_user ? query.id_user = params.id_user;
	col_hour.find(query, function(err, cursor){
		if(!err){
			cursor.toArray(self.callback);
		}else{
			self.callback(err, null);
		}
	});
}

/* Params 
	*id_proj: id of project
	*id_user: id of user
	*n_hours: number of hours
	comment: comment for this entry
*/
ProjectModel.prototype.addHour = function(params, callback){
	var col_hour = this._bd.collection("hours");
	var hour_id = col_hour.insert({
			id_proj: params.id_proj, 
			id_user: params.id_user, 
			n_hours: params.n_hours,
			date: new Date(),
			comment: params.comment,
		}, callback);
	console.log("Last insert id: "+hour_id);
}

/* Params
	*id_hour: id of hour entry
	n_hours: number of hours
	comment: comment for this entry
*/
ProjectModel.prototype.updateHour = function(params, callback){
	var col_hour = this._bd.collection("hours");
	var data = {};
	params.n_hours ? data.n_hours = params.n_hours;
	params.comment ? data.comment = params.n_hours;
	if (Object.keys(data).length > 0){
		col_hour.update({_id: params.id_hour}, data, callback);
	}else{
		callback({error: 'TODO: Define errors. ERROR: Empty params.'}, null);
	}
}

ProjectModel.prototype.deleteHour = function(id, callback){
	var col_hour = this._bd.collection("hours");
	col_hour.remove({_id: id}, callback);
}

// Budgets

/* Params
	id_proj: id of project
	id_budget: id of budget entry
*/
ProjectModel.prototype.getBudgets = function(params, callback){
	if(Object.keys(params).length > 0){
		var col_budget = this._bd.collection("project_budgets");
		var self = this;
		var query = {};
		params.id_budget ? query._id = params.id_budget;
		params.id_proj ? query.id_proj = params.id_proj;
		col_budget.find(query, function(err, cursor){
			if(!err){
				cursor.toArray(self.callback);
			}else{
				self.callback(err, null);
			}
		});
	}else{
		callback({error: 'TODO: Define errors. ERROR: Empty params.'}, null);
	}
}

/* Params 
	*id_proj: id of project
	*name: title for the budget
	desc: description
	*amount: amount of money
	date: date of the budget
*/
ProjectModel.prototype.addBudget = function(params, callback){
	var col_budget = this._bd.collection("project_budgets");
	var budget_id = col_budget.insert({
			id_proj: params.id_proj, 
			name: params.name, 
			desc: params.desc,
			date: params.date,
			amount: params.amount,
		}, callback);
	console.log("Last insert id: "+budget_id);
}

/* Params 
	*id_budget: id of budget
	name: title for the budget
	desc: description
	amount: amount of money
	date: date of the budget
*/
ProjectModel.prototype.updateBudget = function(params, callback){
	var col_budget = this._bd.collection("project_budgets");
	var data = {};
	params.name ? data.name = params.name;
	params.desc ? data.desc = params.desc;
	params.amount ? data.amount = params.amount;
	params.date ? data.date = params.date;
	if (Object.keys(data).length > 0){
		col_budget.update({_id: params.id_budget}, data, callback);
	}else{
		callback({error: 'TODO: Define errors. ERROR: Empty params.'}, null);
	}
}

ProjectModel.prototype.deleteBudget = function(id, callback){
	var col_budget = this._bd.collection("project_budgets");
	col_budget.remove({_id: id}, callback);
}

// Spendings

/* Params
	id_proj: id of project
	id_spending: id of spending entry
*/
ProjectModel.prototype.getSpendings = function(params, callback){
	if(Object.keys(params).length > 0){
		var col_spending = this._bd.collection("project_spendings");
		var self = this;
		var query = {};
		params.id_spending ? query._id = params.id_spending;
		params.id_proj ? query.id_proj = params.id_proj;
		col_spending.find(query, function(err, cursor){
			if(!err){
				cursor.toArray(self.callback);
			}else{
				self.callback(err, null);
			}
		});
	}else{
		callback({error: 'TODO: Define errors. ERROR: Empty params.'}, null);
	}
}

/* Params 
	*id_proj: id of project
	*name: title for the spending
	desc: description
	*cost: cost of the spending
	*date: date of the spending
*/
ProjectModel.prototype.addSpending = function(params, callback){
	var col_spending = this._bd.collection("project_spendings");
	var spending_id = col_spending.insert({
			id_proj: params.id_proj, 
			name: params.name, 
			desc: params.desc,
			date: params.date,
			cost: params.cost,
		}, callback);
	console.log("Last insert id: "+spending_id);
}

/* Params 
	*id_spending: id of spending
	name: title for the spending
	desc: description
	cost: cost of the spending
	date: date of the spending
*/
ProjectModel.prototype.updateSpending = function(params, callback){
	var col_spending = this._bd.collection("project_spendings");
	var data = {};
	params.name ? data.name = params.name;
	params.desc ? data.desc = params.desc;
	params.cost ? data.cost = params.cost;
	params.date ? data.date = params.date;
	if (Object.keys(data).length > 0){
		col_spending.update({_id: params.id_spending}, data, callback);
	}else{
		callback({error: 'TODO: Define errors. ERROR: Empty params.'}, null);
	}
}

ProjectModel.prototype.deleteSpending = function(id, callback){
	var col_spending = this._bd.collection("project_Spendings");
	col_spending.remove({_id: id}, callback);
}

// Invoices

/* Params
	id_proj: id of project
	id_invoice: id of invoice entry
*/
ProjectModel.prototype.getInvoices = function(params, callback){
	if(Object.keys(params).length > 0){
		var col_invoice = this._bd.collection("project_invoices");
		var self = this;
		var query = {};
		params.id_invoice ? query._id = params.id_invoice;
		params.id_proj ? query.id_proj = params.id_proj;
		col_invoice.find(query, function(err, cursor){
			if(!err){
				cursor.toArray(self.callback);
			}else{
				self.callback(err, null);
			}
		});
	}else{
		callback({error: 'TODO: Define errors. ERROR: Empty params.'}, null);
	}
}

/* Params 
	*id_proj: id of project
	*name: title for the invoice
	desc: description
	*cost: cost of the invoice
	date: date of the invoice
*/
ProjectModel.prototype.addInvoice = function(params, callback){
	var col_invoice = this._bd.collection("project_invoices");
	var invoice_id = col_invoice.insert({
			id_proj: params.id_proj, 
			name: params.name, 
			desc: params.desc,
			date: params.date,
			cost: params.cost,
		}, callback);
	console.log("Last insert id: "+invoice_id);
}

/* Params 
	*id_invoice: id of invoice
	name: title for the invoice
	desc: description
	cost: cost of the invoice
	date: date of the invoice
*/
ProjectModel.prototype.updateInvoice = function(params, callback){
	var col_invoice = this._bd.collection("project_invoices");
	var data = {};
	params.name ? data.name = params.name;
	params.desc ? data.desc = params.desc;
	params.cost ? data.cost = params.cost;
	params.date ? data.date = params.date;
	if (Object.keys(data).length > 0){
		col_invoice.update({_id: params.id_invoice}, data, callback);
	}else{
		callback({error: 'TODO: Define errors. ERROR: Empty params.'}, null);
	}
}

ProjectModel.prototype.deleteInvoice = function(id, callback){
	var col_invoice = this._bd.collection("project_invoices");
	col_invoice.remove({_id: id}, callback);
}


module.exports = ProjectModel;