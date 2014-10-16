var util = require("util"),
    BaseModel = require("./basemodel.js"),
    merge = require("merge"),
    cons = require("../cons.js"),
    ObjectID = require('mongodb').ObjectID;

function TimeModel(db) {
    BaseModel.call(this,db,db.collection("projects_times"));
}

util.inherits(TimeModel, BaseModel);

TimeModel.prototype.insertTime = function(data, callback) { 
    this._col.insert(this.parseQuery(data),{},callback);
};

TimeModel.prototype.updateTime = function(id,data, callback) { 
    this._col.update({_id : new ObjectID(id)},{$set:data},callback);
};

TimeModel.prototype.getTime = function(opts, callback) { 
    var query = {
        _id : new ObjectID(opts.id),
        id_user : new ObjectID(opts.id_user)
    };
    this._col.findOne(query,callback);
};




TimeModel.prototype.approveOrRejectWeek = function(opts, callback) { 

    var value = opts.status == cons.ST_WEEK_ACCEPTED ? true : false;
    console.log(value);
    this._col.update(
        {
            year : opts.year,
            week : opts.week,
            id_user: new ObjectID(opts.id_user)
        }
        ,{$set:{approved:value}},
        {multi : true}
        ,callback);
};

TimeModel.prototype.removeTime = function(id, callback) { 
    this._col.remove({_id : new ObjectID(id)},callback);
};
// opts = {
//     id_user:
//     week: 
// }
TimeModel.prototype.getUserWeek = function(opts, callback) { 

    this._col.find(
        {
            id_user : new ObjectID(opts.id_user),
            year : parseInt(opts.year),
            week : parseInt(opts.week)
        }
    ).toArray(function(err,items){
        if (err){
            callback(err,null);  
        }
        else{
            response = [];
            for (var i=0;i<7;i++){
                response[i] = {
                    day : i+1,
                    projects : []
                };
            }
            for (var i=0;i<items.length;i++){
                response[items[i].day-1].projects.push({
                    id_project : items[i].id_project,
                    nhours : items[i].nhours,
                    id : items[i]._id
                });
            }

            callback(null,response);
        }
    });
};

module.exports = TimeModel;