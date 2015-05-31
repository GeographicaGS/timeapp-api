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

/*
opts{
    id_user:
    year:
    week
}
*/
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
                colprojs.find({},
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
            
    }, udata, callback);
};

WeekModel.prototype.getWeeks = function(status, callback) { 
    var query = {};
     if (status && status!="0"){
        query["status"] = parseInt(status);
    }

    this._col.find(query,{sort: {year:-1,week:-1}}).toArray(callback);
};



/*
opts{
    id_user: id,
    status : status
}
*/
WeekModel.prototype.getUserWeeks = function(opts, callback) { 
    var query = {
        id_user: new ObjectID(opts.id_user)
    };

    if (opts.status && opts.status!="0"){
        query["status"] = parseInt(opts.status);
    }

    this._col.find(query,{sort: {date_send:1}}).toArray(callback);
};


WeekModel.prototype.getProjectsInWeek = function(id_week, callback) { 

    this._db.collection("projects_times").aggregate([
                { $match : {week : id_week} },
                { $group : {_id: "$id_project"}}
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

WeekModel.prototype.addComment = function(id,data,callback){

    this._col.update({_id : new ObjectID(id)}, {$push : { notes : {
            note: data.comment,
            id_user: new ObjectID(data.id_user),
            date: new Date()
        }}}, callback);

};

/*
opts {
    year:
    week:
    id_user:
}
*/
WeekModel.prototype.requestWeekID = function(opts, callback) { 

    var _this = this;

    this.getWeek(opts,function(err,week){
        if (err) callback(err);
        else{
            if (week._id){
                callback(null,week._id);
            }
            else{

                // create a week
                _this._col.insert({
                    id_user : new ObjectID(opts.id_user),
                    week : parseInt(opts.week),
                    year : parseInt(opts.year),
                    status : cons.ST_WEEK_PENDING,
                    notes : [] 
                },function(err,nitems){
                    if (err) callback(null);
                    else{
                        _this.getWeek(opts,function(err,week){
                            if (err) callback(err);
                            else if (week._id) callback(null,week._id);
                            // Just to be sure
                            else callback(null,null);
                        });
                    }
                });
            }
        }
    })
};
       


module.exports = WeekModel;