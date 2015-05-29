
var database = require("../database.js");
var cons = require("../cons.js");



database.init(function(err){

    var ProjectModel = database.ProjectModel;
    
    ProjectModel.fixProjectMembers(function(error){
        console.log(error);
    });
});


