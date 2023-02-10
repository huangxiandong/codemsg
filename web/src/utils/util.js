let formatDate = function (date, fmt) { //author: meizz 
  var o = {
      "M+": date.getMonth() + 1, //月份 
      "d+": date.getDate(), //日 
      "H+": date.getHours(), //小时 
      "m+": date.getMinutes(), //分 
      "s+": date.getSeconds(), //秒 
      "q+": Math.floor((date.getMonth() + 3) / 3), //季度 
      "S": date.getMilliseconds() //毫秒 
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
  if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
}

let generateId = function() {
  let now = Math.round(Date.now() / 1000);
  if(now > window.packetNo) {
    window.packetNo = now;
  }
  return window.packetNo++;
}

let formatString = function() {
  let a = arguments[0];
  for (let k in arguments) {
    if(k != 0) {
      a = a.replace("{" + k + "}", arguments[k])
    }
  }
  return a
}

let isImage = function(name) {
  let index = name.lastIndexOf(".");
  if(index != -1) {
    let surfix = name.substring(index+1);
    if(surfix === "png" || surfix === "jpg" || surfix === "gif"
      || surfix === "webp") {
      return true;
    }
  }
  return false;
}

let isAudio = function(name) {
  let index = name.lastIndexOf(".");
  if(index != -1) {
    let surfix = name.substring(index+1);
    if(surfix === "mp3" || surfix === "ogg" || surfix === "wav") {
      return true;
    }
  }
  return false;
}

let isVideo = function(name) {
  let index = name.lastIndexOf(".");
  if(index != -1) {
    let surfix = name.substring(index+1);
    if(surfix === "mp4" || surfix === "ogv" || surfix === "webm") {
      return true;
    }
  }
  return false;
}

export {
  formatDate,
  generateId,
  formatString,
  isImage,
  isAudio,
  isVideo
}