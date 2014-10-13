var express = require('express');
var router = express.Router();
var auth = require('../auth.js').authenticate;
var slugs = require("slugs");
var cons = require("../cons.js");

var database = require("../database.js");
var ProjectModel = database.ProjectModel;

/* Create project. */
router.post('/',auth, function(req, res) {
    
    var b = req.body;

    if (!b.name || !b.budget || !b.type_rate){
        res.status(400).json({
            message: "Bad parameters"
        });
        return;
    }

    var data = {
        slug: slugs(b.name),
        name: b.name,
        members : b.members ? b.members : [],
        type_rate: b.type_rate,
        hourly_rate: b.hourly_rate ? b.hourly_rate : null,
        creator : req.user._id,
        date_creation: new Date(),
        date_start: b.date_start ? b.date_start : null,
        date_finish: b.date_finish ? b.date_finish : null,
        color: b.color ? b.color : "#ccc",
        budgets : [{
            amount: b.budget,
            desc: null,
            date: new Date(),
            id_user: req.user._id
        }]
    };

    ProjectModel.create(data,function(err,items){
        
        if (err || !items.length){
            res.status(400).json({
                message: "Internal error",
                error: err
            });
        }
        else{
            res.json({
                id: items[0]._id,
                slug: items[0].slug
            });
        }
    });

});

/* Edit project. */
router.put('/:slug',auth, function(req, res) {
    
    var b = req.body;

    if (!b.name || !b.type_rate){
        res.status(400).json({
            message: "Bad parameters"
        });
        return;
    }

    var data = {
        slug: slugs(b.name),
        name: b.name,
        members : b.members ? b.members : [],
        type_rate: b.type_rate,
        hourly_rate: b.hourly_rate ? b.hourly_rate : null,
        last_date_mod: new Date(),
        last_user_mod: req.user._id,
        date_start: b.date_start ? b.date_start : null,
        date_finish: b.date_finish ? b.date_finish : null,
        color: b.color ? b.color : "#ccc"
    };

    ProjectModel.edit(b._id,data,function(err,item){
        if (err ){
            res.status(400).json({
                message: "Internal error",
                error: err
            });
        }
        else{
            res.json({
                id: b._id,
                slug: data.slug
            });
        }
    });

});

// Get project by slug
router.get('/:slug',auth,function(req,res){
    var slug = req.params.slug;
    ProjectModel.getProject(slug,function(err,project){
        if (err){
            res.status(400).json({
                message: "Internal error",
                error: err
            });
        }
        else{
            res.json(project);
        }
    });
});

// Get projects by slug
router.get("",auth,function(req,res){
    
    ProjectModel.getProjects({},function(err,projects){
        if (err){
            res.status(400).json({
                message: "Internal error",
                error: err
            });
        }
        else{
            res.json({
                results: projects,
            });
        }
    });
});


module.exports = router;
