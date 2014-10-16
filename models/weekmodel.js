var util = require("util"),
    BaseModel = require("./basemodel.js"),
    merge = require("merge"),
    cons = require("../cons.js"),
    ObjectID = require('mongodb').ObjectID,
    _ = require("underscore");

function WeekModel(db) {
    BaseModel.call(this,db,db.collection("weeks"));
}

util.inherits(WeekModel, BaseModel);

WeekModel.prototype.getWeek = function(opts, callback) { 

    this._col.findOne(
        {
            id_user : new ObjectID(opts.id_user),
            year : parseInt(opts.year),
            week : parseInt(opts.week)
        },function(err,data){

        if (err){
            callback(err,null);  
        }
        else if (data == null){
            callback(null,{
                year: opts.year,
                week : opts.week,
                id_user : opts.id_user,
                notes : [],
                date_send : null,
                status : cons.ST_WEEK_PENDING
            });
        }
        else{
            callback(null,data);
        }
    });
};

WeekModel.prototype.getWeekByID = function(id, callback) { 

    this._col.findOne({_id : new ObjectID(id)},callback);
};

WeekModel.prototype.getWeekCompleteByID = function(id, callback) { 

    var col = this._db.collection("projects_times"),
        colprojs = this._db.collection("projects");

    this._col.findOne({_id : new ObjectID(id)},function(err,week){
        if (err){
            callback(err);
        }
        else{
            // Hours by projects
            col.aggregate([
                { $match : { id_user: week.id_user,week: week.week,year: week.year} },
                { $group : {_id: "$id_project", total : {$sum : "$nhours"} } }
            ],function(err, result) {
                
                // get list of projects name
                colprojs.find({status: cons.ST_PROJECT_OPEN},
                    {_id:1,name:1},
                    {sort: { name:1}}).toArray(function(err,projs){
                        if (err){
                            callback(err);
                        }
                        else{

                            for (var i=0;i<result.length;i++){
                                var p = _.filter(projs, function(p){ return p._id.equals(result[i]._id); })[0];
                                result[i].projectname = p.name;
                            }

                            week.timesbyproject = result; 
                            callback(null,week);
                        }
                    });
            });
        }
    });
};

WeekModel.prototype.sendWeekForApproval = function(opts,data, callback) { 
    var udata = {
        $set : {status: cons.ST_WEEK_SENT,date_send: new Date()}
    };

    if (data){
        udata["$push"] = { notes : {
            note: data.note,
            id_user: new ObjectID(opts.id_user),
            date: new Date(),

        }};
    }

    this._col.update({
            id_user : new ObjectID(opts.id_user),
            year : parseInt(opts.year),
            week : parseInt(opts.week),
            
    }, udata,{upsert: true}, callback);
};

WeekModel.prototype.getWeeks = function(status, callback) { 
    this._col.find({status: parseInt(status)},{sort: {date_send:1}}).toArray(callback);
};

WeekModel.prototype.getProjectsInWeek = function(id_week, callback) { 

    this._db.collection("projects_times").aggregate([
                { $group : {_id: "$id_project"} }
            ],callback);
};

WeekModel.prototype.editWeek = function(id_week, data,callback) { 
    this._db.update({_id : new ObjectID(id_week)},{$set : this.parseQuery(data)},{},callback);
};

WeekModel.prototype.setWeekStatus = function(id,opts,callback){
    var data = {
        $set : {status: parseInt(opts.status)},
    };

    if (opts.note){
        data["$push"] = { notes : {
            note: opts.note,
            id_user: new ObjectID(opts.id_user),
            date: new Date()
        }};
    }

    this._col.update({
            _id : new ObjectID(id)
    }, data, callback);
}


module.exports = WeekModel;