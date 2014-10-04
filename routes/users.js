var express = require('express');
var router = express.Router();
var auth = require('../auth.js').authenticate;

/* GET users listing. */
router.get('/', function(req, res) {
  res.send("respond with a resource");
});

router.get('/islogged', auth, function(req, res) {
  res.json({"login": true})
});

module.exports = router;
