var express = require('express');
var router = express.Router();
var auth = require('../auth.js').authenticate;

/* GET start page */
router.get('/', auth, function(req, res) {
   res.send("API running");
});

module.exports = router;
