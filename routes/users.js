var express = require('express');
var router = express.Router();
var auth = require('../auth.js').authenticate;

/* GET home page. */
router.get('/', auth, function(req, res) {
	app.usersModel.find().toArray(function(error, array){
   		res.send(array);
	});
});

module.exports = router;
