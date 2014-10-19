var express = require('express');
var router = express.Router();
var moduleauth = require('../auth.js');
var auth = moduleauth.authenticate;
var profile = moduleauth.profile;   
var slugs = require("slugs");
var cons = require("../cons.js");

var database = require("../database.js");
var ProjectModel = database.ProjectModel;
var uuid = require('node-uuid');

/* Create project. */
router.post('/',auth,profile(cons.ST_PROFILE_GESTOR),function(req, res) {
    
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
            id: uuid.v1(),
            amount: parseFloat(b.budget),
            desc: null,
            date: new Date(),
            id_user: req.user._id
        }],
        total_budget: parseFloat(b.budget)
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
router.put('/:slug',auth,profile(cons.ST_PROFILE_GESTOR),function(req, res) {
    
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
router.get('/:slug',auth,profile(cons.ST_PROFILE_GESTOR),function(req,res){
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

// Get projects 
router.get("",auth,profile(cons.ST_PROFILE_GESTOR),function(req,res){
    
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

// add project spendings
router.post('/:id/spendings',auth,profile(cons.ST_PROFILE_GESTOR),function(req, res) {
    var id = req.params.id;
        b = req.body;

    if (!id || id=="undefined" || !b.date || !b.desc || !b.amount){
        res.status(400).json({message: "Bad parameters"});
        return;
    }
    else{
        ProjectModel.addSpending({
            id_project: id,
            date: b.date,
            desc: b.desc,
            amount: b.amount,
            id_user : req.user._id
        },function(err){
            if (err) res.status(400).json({message: "Internal error", error: err});
            else res.json({ok:1});
        });
    }
});


// edit project spendings
router.put('/:id/spendings/:uuid',auth,profile(cons.ST_PROFILE_GESTOR),function(req, res) {
    var id = req.params.id,
        uuid = req.params.uuid;
        b = req.body;

    if (!id || id=="undefined" || !b.date || !b.desc || !b.amount || !uuid || uuid =="undefined"){
        res.status(400).json({message: "Bad parameters"});
        return;
    }
    else{
        ProjectModel.editSpending({
            id_project: id,
            id_spending: uuid,
            date: b.date,
            desc: b.desc,
            amount: b.amount,
            id_user : req.user._id
        },function(err){
            if (err) res.status(400).json({message: "Internal error", error: err});
            else res.json({ok:1});
        });
    }
});

// get specific spending
router.get('/:id/spendings/:uuid',auth,profile(cons.ST_PROFILE_GESTOR),function(req, res) {
    var id = req.params.id,
        uuid = req.params.uuid;
        b = req.body;

    if (!id || id=="undefined" || !uuid || uuid =="undefined") {
        res.status(400).json({message: "Bad parameters"});
        return;
    }
    else{
        ProjectModel.getSpending({
            id_project: id,
            id_spending: uuid
        },function(err,spending){
            if (err) res.status(400).json({message: "Internal error", error: err});
            else res.json(spending);
        });
    }
});


// delete specific spending
router.delete('/:id/spendings/:uuid',auth,profile(cons.ST_PROFILE_GESTOR), function(req, res) {
    var id = req.params.id,
        uuid = req.params.uuid;
        b = req.body;

    if (!id || id=="undefined" || !uuid || uuid =="undefined") {
        res.status(400).json({message: "Bad parameters"});
        return;
    }
    else{
        ProjectModel.deleteSpending({
            id_project: id,
            id_spending: uuid
        },function(err,spending){
            if (err) res.status(400).json({message: "Internal error", error: err});
            else res.json({ok:1});
        });
    }
});



// add project invoice
router.post('/:id/invoices',auth,profile(cons.ST_PROFILE_GESTOR), function(req, res) {
    var id = req.params.id;
        b = req.body;

    if (!id || id=="undefined" || !b.date || !b.desc || !b.amount || !b.ref){
        res.status(400).json({message: "Bad parameters"});
        return;
    }
    else{
        ProjectModel.addInvoice({
            id_project: id,
            ref: b.ref,
            date: b.date,
            desc: b.desc,
            amount: b.amount,
            id_user : req.user._id
        },function(err){
            if (err) res.status(400).json({message: "Internal error", error: err});
            else res.json({ok:1});
        });
    }
});


// edit project invoice
router.put('/:id/invoices/:uuid',auth,profile(cons.ST_PROFILE_GESTOR),function(req, res) {
    var id = req.params.id,
        uuid = req.params.uuid;
        b = req.body;

    if (!id || id=="undefined" || !b.date || !b.desc || !b.amount || !b.ref
            || !uuid || uuid =="undefined"){
        res.status(400).json({message: "Bad parameters"});
        return;
    }
    else{
        ProjectModel.editInvoice({
            id_project: id,
            id_invoice: uuid,
            ref: b.ref,
            date: b.date,
            desc: b.desc,
            amount: b.amount,
            id_user : req.user._id
        },function(err){
            if (err) res.status(400).json({message: "Internal error", error: err});
            else res.json({ok:1});
        });
    }
});

// get specific invoice
router.get('/:id/invoices/:uuid',auth,profile(cons.ST_PROFILE_GESTOR), function(req, res) {
    var id = req.params.id,
        uuid = req.params.uuid;
        b = req.body;

    if (!id || id=="undefined" || !uuid || uuid =="undefined") {
        res.status(400).json({message: "Bad parameters"});
        return;
    }
    else{
        ProjectModel.getInvoice({
            id_project: id,
            id_invoice: uuid
        },function(err,spending){
            if (err) res.status(400).json({message: "Internal error", error: err});
            else res.json(spending);
        });
    }
});


// delete specific spending
router.delete('/:id/invoices/:uuid',auth, profile(cons.ST_PROFILE_GESTOR),function(req, res) {
    var id = req.params.id,
        uuid = req.params.uuid;
        b = req.body;

    if (!id || id=="undefined" || !uuid || uuid =="undefined") {
        res.status(400).json({message: "Bad parameters"});
        return;
    }
    else{
        ProjectModel.deleteInvoice({
            id_project: id,
            id_invoice: uuid
        },function(err,spending){
            if (err) res.status(400).json({message: "Internal error", error: err});
            else res.json({ok:1});
        });
    }
});


// add project budgets
router.post('/:id/budgets',auth, profile(cons.ST_PROFILE_GESTOR),function(req, res) {
    var id = req.params.id;
        b = req.body;

    if (!id || id=="undefined" || !b.date || !b.desc || !b.amount){
        res.status(400).json({message: "Bad parameters"});
        return;
    }
    else{
        ProjectModel.addBudget({
            id_project: id,
            date: b.date,
            desc: b.desc,
            amount: b.amount,
            id_user : req.user._id
        },function(err){
            if (err) res.status(400).json({message: "Internal error", error: err});
            else res.json({ok:1});
        });
    }
});


// edit project budgets
router.put('/:id/budgets/:uuid',auth, profile(cons.ST_PROFILE_GESTOR),function(req, res) {
    var id = req.params.id,
        uuid = req.params.uuid;
        b = req.body;

    if (!id || id=="undefined" || !b.date || !b.desc || !b.amount || !uuid || uuid =="undefined"){
        res.status(400).json({message: "Bad parameters"});
        return;
    }
    else{
        ProjectModel.editBudget({
            id_project: id,
            id_budget: uuid,
            date: b.date,
            desc: b.desc,
            amount: b.amount,
            id_user : req.user._id
        },function(err){
            if (err) res.status(400).json({message: "Internal error", error: err});
            else res.json({ok:1});
        });
    }
});

// get specific budget
router.get('/:id/budgets/:uuid',auth, profile(cons.ST_PROFILE_GESTOR),function(req, res) {
    var id = req.params.id,
        uuid = req.params.uuid;
        b = req.body;

    if (!id || id=="undefined" || !uuid || uuid =="undefined") {
        res.status(400).json({message: "Bad parameters"});
        return;
    }
    else{
        ProjectModel.getBudget({
            id_project: id,
            id_budget: uuid
        },function(err,budget){
            if (err) res.status(400).json({message: "Internal error", error: err});
            else res.json(budget);
        });
    }
});


// delete specific budget
router.delete('/:id/budgets/:uuid',auth,profile(cons.ST_PROFILE_GESTOR), function(req, res) {
    var id = req.params.id,
        uuid = req.params.uuid;
        b = req.body;

    if (!id || id=="undefined" || !uuid || uuid =="undefined") {
        res.status(400).json({message: "Bad parameters"});
        return;
    }
    else{
        ProjectModel.deleteBudget({
            id_project: id,
            id_budget: uuid
        },function(err,budget){
            if (err) res.status(400).json({message: "Internal error", error: err});
            else res.json({ok:1});
        });
    }
});

module.exports = router;
