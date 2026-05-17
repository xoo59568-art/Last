// lib/database.js

const fs = require("fs");

const settingsPath =
"./database/settings.json";

function load(file) {

 if (!fs.existsSync(file)) {

   fs.writeFileSync(
     file,
     JSON.stringify({})
   );

 }

 return JSON.parse(
   fs.readFileSync(file)
 );

}

const db = {

 settings: load(settingsPath),

 save() {

   fs.writeFileSync(

     settingsPath,

     JSON.stringify(
       this.settings,
       null,
       2
     )

   );

 }

};

module.exports = {
 db
};
