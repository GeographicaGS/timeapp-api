var moment = require("moment");
var database = require("../database.js");
var cons = require("../cons.js");
var N_PREVIOUS_WEEK = 8;
var email = require("./email.js");
var sendTextEmail = email.sendTextEmail;
var config = require("../config.js");
var utils = require("../utils.js");


function processWeek(u,week,year){
    var WeekModel = database.WeekModel;
    WeekModel.getWeek({id_user:u._id,week:week,year:year},function(err,w){            

        var week_date_str = utils.getBeginWeekDateFormated(year,week) + " [" + week + "]";
        
        if (err){
            console.log(err);
        }

        if (!w){
            
            sendTextEmail({
                text: "Hey you little frog!\n\nYou've forgot to send your timesheet of the week " + week_date_str + "\n\n"
                        + "Upload it right now!",
                subject: "[L1] Timeapp - Missing week " + week_date_str + " - [" + u.name + " " + u.surname +"]",
                to : u.email,
                cc : config.email.managerEmail
            });
        }
        else if (w.status == cons.ST_WEEK_PENDING){
            sendTextEmail({
                text: "Hey you little frog!\n\nYou've forgot to send your timesheet of the week " + week_date_str + "\n\n"
                        + "Upload it right now!",
                subject: "[L1] Timeapp - Missing week " + week_date_str + " - [" + u.name + " " + u.surname +"]",
                to : u.email,
                cc : config.email.managerEmail
            });  
        }
        else if (w.status != cons.ST_WEEK_ACCEPTED){
            sendTextEmail({
                text: "Hey you little frog!\n\nYour week have not been accepted " + week_date_str + "\n\n"
                        + "Insist to your manager, I don't want to email you everyday that's is very tired!",
                subject: "[L1] Timeapp - Unaccepted week " + week_date_str + " - [" + u.name + " " + u.surname +"]",
                to : u.email,
                cc : config.email.managerEmail
            });   
        }

    });
}


function processUser(u){
    var current_week = moment().isoWeek();
    
    for (var j=0;j<=N_PREVIOUS_WEEK;j++){
        var date = moment().subtract(j,'weeks')
        var year = date.isoWeekYear();
        var week = date.isoWeek();

        if (week == current_week){
            continue;
        }
        
        var mondaydate = utils.getBeginWeekDate(year,week);
         if (mondaydate<u.date){
            // nothing to do. User was registered after this week.
            continue;
        }
        
        processWeek(u,week,year);
    }
}


database.init(function(err){

    var UserModel = database.UserModel;
    
    UserModel.getUsers({status: cons.ST_USER_ENABLE},function(error,users){
        if (error){

        }

        for (var i=0;i<users.length;i++){
            var u = users[i];

            if (["juanpe","hector","pedro","practica_1","practica_2"].indexOf(u.username) == -1){
                processUser(u);    
            }
            
        } 
    });
});

setTimeout(function(){
    process.exit(0);
},10*1000);

