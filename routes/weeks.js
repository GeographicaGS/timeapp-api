var express = require('express');
var router = express.Router();
var moduleauth = require('../auth.js');
var auth = moduleauth.authenticate;
var profile = moduleauth.profile;   
var slugs = require("slugs");
var cons = require("../cons.js");

var database = require("../database.js");
var WeekModel = database.WeekModel;
var ProjectModel = database.ProjectModel;
var TimeModel = database.TimeModel;

/* Get weeks by status */
router.get("/list",auth,profile(cons.ST_PROFILE_GESTOR),function(req,res){
    var st = req.param("status");

    WeekModel.getWeeks(st,function(err,items){
        if (err ){
            res.status(400).json({
                message: "Internal error",
                error: err
            });
        }
        else{
            res.json({ results : items});
        }
    });
});

router.get("/user/list",auth,function(req,res){
    var st = req.param("status");

    WeekModel.getUserWeeks({
        status: st,
        id_user: req.user._id
    },function(err,items){
        if (err ){
            res.status(400).json({
                message: "Internal error",
                error: err
            });
        }
        else{
            res.json({ results : items});
        }
    });
});

/* Get week by id */
router.get("/:id",auth,function(req,res){
    var id = req.params.id;

    WeekModel.getWeekCompleteByID(id,function(err,data){

        if (err ){
            res.status(400).json({
                message: "Internal error",
                error: err
            });
        }
        else{

            if (req.user.profile<cons.ST_PROFILE_GESTOR 
                && !data.id_user.equals(req.user._id)){
                res.status(403).json({forbidden:1})
            }
            else{
                res.json(data);    
            }    
            
        }
    });
});

/* Change week status */
router.post("/change_status/:id",auth,profile(cons.ST_PROFILE_ADMIN),function(req,res){
    var b = req.body,
        id = req.params.id,
        week = null;    

    b.status = parseInt(b.status);

    if (!b.status || !id || b.status=="undefined" || 
        (b.status!=cons.ST_WEEK_REJECTED && b.status!=cons.ST_WEEK_ACCEPTED) ){
        res.status(400).json({
            message: "Bad parameters"
        });
        return;
    }

    function sendError(err){
        res.status(400).json({
            message : "Internal error",
            err: err,
        });
    }
    
    function getWeek(){
        WeekModel.getWeekByID(id,function(err,data){
            if (err){
                sendError(err);
            }
            else{
                week = data;
                updateTimes();
            }
        })
    }

    // update all document projects_times
    function updateTimes(){

        TimeModel.approveOrRejectWeek({
            id_user: week.id_user,
            year: week.year,
            week: week.week,
            status: b.status

        },function(err,d){
            if (err){
                sendError(err);
            }
            else{
                updateProjectTotalHoursPrice();
            }
        });

    }

    // update project document with total_hours
    function updateProjectTotalHoursPrice(){
        WeekModel.getProjectsInWeek(week._id,function(err,result){
            if (err){
                sendError(err);
            }
            else{
                for (var i=0;i<result.length;i++){

                    ProjectModel.updateTotalHoursPrice(result[i]._id,function(err,total){
                        if (err){
                            sendError(err);
                        }
                    });
                }    
            }
        });
    }


    // update week status
    function setWeekStatus(){

        opts = {
            status: b.status,
            note : b.note,
            id_user : req.user._id
        }

        WeekModel.setWeekStatus(id,opts,function(err,d){
            if (err){
                sendError(err);
            }
            else{
                res.json({ok:1})
            }
        });
    }

   
    getWeek();
    setWeekStatus();
    

});

/* Add a comment to week*/
router.post("/addcomment/:id",auth,function(req,res){
    if (!req.body.comment || req.body.comment=="undefined" || !req.params.id || req.params.id=="undefined"){
        res.status(400).json({message:"Bad parameters"});
    }
    else{
        WeekModel.addComment(req.params.id,{
                comment: req.body.comment,
                id_user : req.user._id
            },function(err){
            if (err) res.status(400).json({message: "Internal error", error: err});
            else res.json({ok:1})
        });
    }
});


/* Get user week. */
router.get('/:year/:week',auth, profile(cons.ST_PROFILE_GESTOR),function(req, res) {
    
    var year = req.params.year,
        week = req.params.week;

    if (!year || !week || !req.user._id){
        res.status(400).json({
            message: "Bad parameters"
        });
        return;
    }

    WeekModel.getWeek({ year: year, week: week, id_user: req.user._id},function(err,data){
        
        if (err ){
            res.status(400).json({
                message: "Internal error",
                error: err
            });
        }
        else{
            res.json(data);
        }
    });

});

/* Send week for approval */
router.post('/:year/:week',auth, function(req, res) {
    
    var year = req.params.year,
        week = req.params.week;

    if (!year || !week || !req.user._id){
        res.status(400).json({
            message: "Bad parameters"
        });
        return;
    }

    var data = req.body.note ? { note : req.body.note } : null;

    WeekModel.sendWeekForApproval({ year: year, week: week, id_user: req.user._id},data,function(err,data){
        if (err ){
            res.status(400).json({
                message: "Internal error",
                error: err
            });
        }
        else{
            res.json({send : true});
        }
    });

});

router.post("/requestweekid/:year/:week",auth,function(req,res){
    
    var year = req.params.year,
        week = req.params.week;

    if (!year || !week || !req.user._id){
        res.status(400).json({
            message: "Bad parameters"
        });
        return;
    }

    WeekModel.requestWeekID({year: year, week: week,id_user: req.user._id},function(err,id){
        if (err) res.status(400).json({message: "Internal error"});
        else res.json({id: id});
    });

});


module.exports = router;
