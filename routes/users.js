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
  res.json({"login": true})
});

module.exports = router;
