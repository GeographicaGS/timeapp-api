config = {
    port : 3000,
    //mongodb : 'mongodb://127.0.0.1:27017/timeapp',
    database : {
        "host" : "localhost",
        "port": 27017,
        "user": "timeapp_admin",
        "password" : "timeapp",
        "db" : "timeapp"
    },
    createUsersOnStart : false,
    authTimestampLiveTime: 3000,
    authEnable : true,
    email: {
        server: {
            user:    "XXX", 
            password:"XXXX", 
            host:    "XXXX", 
            ssl:     true
        },
        managerEmail: 'managers.timeapp@geographica.gs',
        noreply: 'no-reply-timeapp@geographica.gs',
    }
}

module.exports = config;