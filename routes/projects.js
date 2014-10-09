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

    if (!b.name || !b.customer ){
        res.status(400).json({
            message: "Bad parameters"
        });
    }
    
    var data = {
        slug: slugs(b.name),
        name: b.name,
        price_hour: null,
        creator : req.user._id,
        date_creation: new Date(),
        date_start: b.date_start ? b.date_start : new Date(),
        date_finish: b.date_finish ? b.date_finish : null,
        color: b.color ? b.color : "#ccc"
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


module.exports = router;
