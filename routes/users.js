var express = require('express');
var router = express.Router();
var auth = require('../auth.js').authenticate;
var database = require("../database.js");
var UserModel = database.UserModel;

/* GET users */
router.get('/', auth, function(req, res) {
	UserModel.getUsers({},function(error, array){
        if (error){
            res.status(400).json({
                message : "Error",
            });
        }
   		res.json({
            "results" : array
        });
	});
});

router.get('/islogged', auth, function(req, res) {
    
    user = {
        id : req.user._id,
        username : req.user.username,
        name : req.user.name,
        surname : req.user.name,
        profile : req.user.profile
    }

    res.json(user);
});

router.get('/projects', auth,function(req, res) {
    
    UserModel.getUserProjects(req.user._id,function(err,items){
        if (err){
            res.status(400).json({
                message : "Internal error",
                error : err
            });
        }
        else{
            res.json({
                "results": items
            });
        }
    })

});
module.exports = router;
