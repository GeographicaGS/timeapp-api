var express = require('express');
var router = express.Router();
var auth = require('../auth.js').authenticate;
var cons = require("../cons.js");
var utils = require("../utils.js");

var database = require("../database.js");
var TimeModel = database.TimeModel;

/* Create time. */
router.post('/time',auth, function(req, res) {

    var b = req.body;

    if (!b.date || !b.hours || !b.id_project || !b.minutes){
        res.status(400).json({
            message: "Bad parameters"
        });
        return;
    }
    var date = new Date(b.date),
        h = parseInt(b.hours),
        m = parseInt(b.minutes);

    var data = {
        id_project : b.id_project,
        id_user : req.user._id,
        year : date.getFullYear(),
        week : date.getWeekNumber(),
        day: utils.dateDay(date),
        approved : false,
        nhours :  h + m/60,
        removed : false,
    }

    console.log(data);

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


/* Create time. */
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

});

router.delete('/time/:id',auth, function(req, res) {

    var id = req.params.id;

    if (!id){
        res.status(400).json({
            message: "Bad parameters"
        });
        return;
    }
    
    TimeModel.updateTime(id,{removed : true},function(err,items){
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
});


router.get('/week/:number',auth, function(req, res) {

    TimeModel.getUserWeek({ id_user: req.user._id, week: req.params.number},function(err,items){
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
