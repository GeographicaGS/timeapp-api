var moment = require("moment");

function getWeekDate(year,week){
  year = parseInt(year);
  week = parseInt(week);
  var weekIdx = 1;
  // Finding first monday
  if (moment(year + "-01-01").isoWeekday(weekIdx).year() != year){
    weekIdx = 8;
  }

  return moment(year + "-01-01").isoWeekday(weekIdx).isoWeek(week);
}

function getBeginWeekDate(year,week){
  year = parseInt(year);
  week = parseInt(week);
  var weekIdx = 1;
  // Finding first monday
  if (moment(year + "-01-01").isoWeekday(weekIdx).year() != year){
    weekIdx = 8;
  }

  return moment(year + "-01-01").isoWeekday(weekIdx).isoWeek(week);
}

function getEndWeekDate(year,week){
  return getBeginWeekDate(year,week).day(7);
}

function getBeginWeekDateFormated(year,week){
  return getBeginWeekDate(year,week).format("DD/MM/YYYY");
}

function getEndWeekDateFormated(year,week){
  return getEndWeekDate(year,week).format("DD/MM/YYYY");
}

module.exports.getBeginWeekDateFormated = getBeginWeekDateFormated;
module.exports.getEndWeekDateFormated = getEndWeekDateFormated;
