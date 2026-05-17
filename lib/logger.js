// lib/logger.js

const chalk = require("chalk");

function log(type, text) {

 const time =
 new Date().toLocaleTimeString();

 if (type === "info") {

   console.log(
     chalk.blue(
       `[${time}] INFO → ${text}`
     )
   );

 }

 if (type === "success") {

   console.log(
     chalk.green(
       `[${time}] SUCCESS → ${text}`
     )
   );

 }

 if (type === "error") {

   console.log(
     chalk.red(
       `[${time}] ERROR → ${text}`
     )
   );

 }

}

module.exports = {
 log
};
