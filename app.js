var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var auth = require('./auth.js').authenticate;
var app = express();
var config = require("./config.js");

var MongoClient = require('mongodb').MongoClient
    , format = require('util').format;

md5 = require('MD5');

var db = null;

MongoClient.connect(config.mongodb, function(err, localdb) {
    if(err) throw err;
    db = localdb;

    if (config.createUsersOnStart){
        var collection = db.collection('users');
        var u = {
            username: "admin",
            password: md5("admin"),
            name: "Admin",
            surname : "Superadmin",
            profile : 1 };

        collection.insert(u, function(err, docs) {
            if (!err){
                console.log("Insert user successfully");
            }
            
        });

    }
    
})

var timestamp = new Date().getTime();

console.log("Hash: " + md5("admin" + md5("admin") + timestamp))
console.log("timestamp: " + timestamp);


app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// Make our db accessible to our router
app.use(function(req,res,next){
    req.db = db;
    next();
});

app.get('/auth/demo', 
    auth,
    function(req,res) { 
      res.send("You're in!");
    }
);

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.json({
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);

    res.json({
            message: err.message,
            error: err
        });
});


module.exports = app;
