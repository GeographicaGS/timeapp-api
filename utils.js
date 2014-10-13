module.exports.dateDay = function(dateObject){
    var day = dateObject.getDay() - 1;

    if (day == -1)
        day = 6;

    return day;

}