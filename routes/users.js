var express = require('express');
var router = express.Router();
var auth = require('../auth.js').authenticate;

/* GET home page. */
router.get('/', auth, function(req, res) {
	app.usersModel.find().toArray(function(error, array){
   		res.send(array);
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

router.get('/:id/timesheet', function(req, res) {
    var id = req.params.id;
    app.usersModel.getUser({
        id : id
    },function(error,user){
        res.json(user);     
    });

});

module.exports = router;
