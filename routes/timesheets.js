var express = require('express');
var router = express.Router();
var auth = require('../auth.js').authenticate;
var cons = require("../cons.js");
var utils = require("../utils.js");

var database = require("../database.js");
var TimeModel = database.TimeModel;
var moment = require("moment");

/* Create time. */
router.post('/time',auth, function(req, res) {

    var b = req.body;

    if (!b.date || !b.hours || !b.id_project || !b.minutes){
        res.status(400).json({
            message: "Bad parameters"
        });
        return;
    }

    var date = moment(b.date),
        h = parseInt(b.hours),
        m = parseInt(b.minutes);

    var data = {
        id_project : b.id_project,
        id_user : req.user._id,
        year : date.isoWeekYear(),
        week : date.isoWeek(),
        day: date.isoWeekday(),
        approved : false,
        nhours :  h + m/60,
    }

    TimeModel.insertTime(data,function(err,items){
        if (err){
            res.status(400).json({
                "message" : "Internal error",
                "error": err
            });
        }
        else{
            res.json({
                "insert" : true
            });
        }
    });

});


/* Edit time. */
router.put('/time/:id',auth, function(req, res) {

    var b = req.body,
        id = req.params.id;


    if (!id || !b.hours || !b.minutes){
        res.status(400).json({
            message: "Bad parameters"
        });
        return;
    }

    var h = parseInt(b.hours),
        m = parseInt(b.minutes);

    var data = {
        nhours :  h + m/60
    }

    TimeModel.getTime({id: id, id_user:req.user._id},function(err,time){
        if (err) res.status(400).json({ "message" : "Internal error","error": err});
        else{

            if ( // An user cannot edit other users time
                ! time.id_user.equals(req.user._id)
                // Cannot edit an approved time
                || time.approved
                ){
                
                res.status(403).json({forbidden: 1});   
            }
            else{

                TimeModel.updateTime(id,data,function(err,items){
                    if (err){
                        res.status(400).json({
                            "message" : "Internal error",
                            "error": err
                        });
                    }
                    else{
                        res.json({
                            "updated" : true
                        });
                    }
                });
            }
        }
    });
    

});

router.delete('/time/:id',auth, function(req, res) {

    var id = req.params.id;

    if (!id){
        res.status(400).json({
            message: "Bad parameters"
        });
        return;
    }
    
    TimeModel.getTime({id: id, id_user:req.user._id},function(err,time){
        if (err) res.status(400).json({ "message" : "Internal error","error": err});
        else{

             if ( // An user cannot edit other users time
                ! time.id_user.equals(req.user._id)
                // Cannot edit an approved time
                || time.approved
                ){
                
                res.status(403).json({forbidden: 1});   
            }
            
            else{

                TimeModel.removeTime(id,function(err,items){
                    if (err){
                        res.status(400).json({
                            "message" : "Internal error",
                            "error": err
                        });
                    }
                    else{
                        res.json({
                            "removed" : true
                        });
                    }
                });
            }
        }
    })
});

router.get('/week/:year/:week',auth, function(req, res) {

    TimeModel.getUserWeek({ id_user: req.user._id, year: req.params.year, week: req.params.week},function(err,items){
        if (err){
            res.status(400).json({
                "message" : "Internal error",
                "error": err
            });
        }
        else{
            res.json({
                "results" : items
            });
        }
    });

});

module.exports = router;
