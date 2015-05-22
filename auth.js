var md5 = require('MD5');
var config = require("./config.js");
var database = require("./database.js");
var UserModel = database.UserModel;
var cons = require("./cons.js");

function authenticate(req, res, next) {

    if (!config.authEnable){

        UserModel.getUser({ username: "admin"},function(error,user){
            req.user = user;
            next();
        });
       
        return;
    }

    var credentials = {
        hash : req.get("auth-hash"),
        username :req.get("auth-username"),
        timestamp : req.get("auth-timestamp")
    };

    if (!credentials.hash || !credentials.username || !credentials.timestamp){
        res.status(401);
        res.json({
            "messsage" : "Missing auth headers"
        });
    }
    else{

        var currentTime = new Date().getTime();

        UserModel.getUser({ username: credentials.username },function(error,user){
            if (!user || user.status!=cons.ST_USER_ENABLE){
                res.status(401)
                res.json({
                    "messsage" : "Bad credentials"
                });
                return;
            }

            // Is timestamp too old?
            if ((currentTime - credentials.timestamp) / 1000   > config.authTimestampLiveTime) {
                res.status(401)
                res.json({
                    "messsage" : "Expired request"
                });
                return;
            }
            // let check the password
            if (md5(credentials.username + user.password + credentials.timestamp) == credentials.hash){
                req.user = user;
                // login successfull, let's allow the request
                next();   
            }
            else{
                // bad username/ password
                res.status(401)
                res.json({
                    "messsage" : "Bad credentials"
                });
            }
        });      
    }
}

function profile(minprofile) {

    return function(req, res, next){

        if (!config.authEnable){
            next();
            return;
        }

        if (req.user.profile >= minprofile){
            next();
        }
        else{
            res.status(403).json({messsage : "Forbidden"});
        }
    }
}

module.exports.authenticate = authenticate;

module.exports.profile = profile;