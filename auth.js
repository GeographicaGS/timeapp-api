var md5 = require('MD5');
var config = require("./config.js")

function authenticate(req, res, next) {

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
        var db = req.db,
            col = db.collection("users"),
            currentTime = new Date().getTime();

        col.findOne({username: credentials.username},function(error,user){
            if (!user){
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

module.exports.authenticate = authenticate;