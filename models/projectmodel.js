var util = require("util"),
    BaseModel = require("./basemodel.js"),
    merge = require("merge"),
    cons = require("../cons.js"),
    ObjectID = require('mongodb').ObjectID;

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
        removed: false,
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
		removed : false,
		slug : slug
	},callback);
};

ProjectModel.prototype.edit = function(id, data, callback) {
    this._col.update(
    	{_id :  new ObjectID(id)},
    	this.parseQuery(data),
    	{},
    	callback);
};

ProjectModel.prototype.getProjects = function(opts, callback) { 

	this._col.find(
		{
			removed : false
		},
		{
			sort: { name:1}
		}
	).toArray(callback);
};


module.exports = ProjectModel;