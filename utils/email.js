var email   = require("emailjs");
var config = require('../config');
var server = email.server.connect(config.email.server);

function sendTextEmail(opts,callback){
    // opts: rcpto,subject,text
    if (!validateEmail(opts.to)){
        callback('No valid email address');
    }
    server.send({
       text:    opts.text, 
       from:    'TimeApp <'+ config.email.noreply +'>', 
       to:      opts.to,
       cc : opts.cc,
       subject: opts.subject
    }, function(err, message) { 
        if (callback){
            callback(err);    
        }
        
    });
}

function validateEmail(email) { 
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
} 

module.exports.sendTextEmail = sendTextEmail;



