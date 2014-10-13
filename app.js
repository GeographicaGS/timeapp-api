var express = require("express");
var path = require("path");
var logger = require("morgan");
var bodyParser = require("body-parser");
var app = express();
var database = require("./database.js");

require("date-utils");

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Make our db accessible to our router
app.use(function(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "auth-hash,auth-username,auth-timestamp,Content-Type");
    res.header("Access-Control-Allow-Methods","GET,POST,PUT,DELETE");
    next();
});

app.userModel = null;

database.init(function(err){

    var auth = require("./auth.js").authenticate;

    //app.projectModel = null;
    //app.userModel = new UserModel(db);
    //app.projectModel = new ProjectModel(db);
    var routes = require("./routes/index");
    var users = require("./routes/users");
    var projects = require("./routes/projects");
    var timesheet = require("./routes/timesheet");

    app.use("/", routes);
    app.use("/users", users);
    app.use("/projects",projects);
    app.use("/timesheet",timesheet);

    // catch 404 and forward to error handler
    app.use(function(req, res, next) {
        var err = new Error("Not Found");
        err.status = 404;
        next(err);
    });

    // error handlers

    // development error handler
    // will print stacktrace
    // if (app.get("env") === "development") {
    //     app.use(function(err, req, res, next) {
    //         res.status(err.status || 500);
    //         res.json({
    //             message: err.message,
    //             error: err
    //         });
    //     });
    // }

    // // production error handler
    // // no stacktraces leaked to user
    // app.use(function(err, req, res, next) {
    //     res.status(err.status || 500);

    //     res.json({
    //             message: err.message,
    //             error: err
    //         });
    // });


 
});

module.exports = app;
