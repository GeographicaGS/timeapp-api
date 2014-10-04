var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');

var auth = require('./auth.js').authenticate;
app = express();
var routes = require('./routes/index');
var users = require('./routes/users');
var config = require("./config.js");

var MongoClient = require('mongodb').MongoClient
    , format = require('util').format;

md5 = require('MD5');

var BaseModel = require("./models/basemodel.js");

var db = null;
app.projectModel = null;
app.userModel = null;
app.hoursModel = null;
app.projectSpendingsModel = null;
app.projectInvoicesModel = null;
app.projectMembersModel = null;
app.projectBudgetsModel = null;



MongoClient.connect(config.mongodb, function(err, localdb) {
    if(err) throw err;
    db = localdb;

    app.projectModel = new BaseModel(db,'projects');
    app.usersModel = new BaseModel(db,'users');
    app.hoursModel = new BaseModel(db, 'hours');
    app.projectSpendingsModel = new BaseModel(db, 'project_spendings');
    app.projectInvoicesModel = new BaseModel(db, 'project_invoices');
    app.projectMembersModel = new BaseModel(db, 'project_members');
    app.projectBudgetsModel = new BaseModel(db, 'project_budgets');

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


app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// Make our db accessible to our router
app.use(function(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "auth-hash,auth-username,auth-timestamp");
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
