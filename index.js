// index.js

const express =
require("express");

const app =
express();

const QRCode =
require("qrcode");

const config =
require("./config");

const {
 db
} =
require("./lib/database");

const {
 log
} =
require("./lib/logger");

const pkg =
require("gifted-baileys");

const {
 default: makeWASocket,
 useMultiFileAuthState,
 Browsers,
 DisconnectReason
} = pkg;

const Pino =
require("pino");

let sock;
let qrCode = "NOT READY";

async function startBot() {

 const {
   state,
   saveCreds
 } =

 await useMultiFileAuthState(
   "session"
 );

 sock =
 makeWASocket({

   auth: state,

   browser:
   Browsers.ubuntu(
     "ERAN-XMD"
   ),

   printQRInTerminal: false,

   logger: Pino({
     level: "silent"
   })

 });

 sock.ev.on(
   "creds.update",
   saveCreds
 );

 // ====================
 // CONNECTION
 // ====================

 sock.ev.on(

   "connection.update",

   async (update) => {

     const {
       connection,
       qr,
       lastDisconnect
     } = update;

     if (qr) {

       qrCode = qr;

       log(
         "info",
         "QR RECEIVED"
       );

     }

     if (
       connection === "open"
     ) {

       log(
         "success",
         "WhatsApp Connected"
       );

       // SEND OWNER MESSAGE

       await sock.sendMessage(

         `${config.owner}@s.whatsapp.net`,

         {

           text:
`╭━━━〔 ERAN-XMD 〕━━━
┃
┃ ✅ Bot Connected
┃ 🚀 Render Active
┃ ⚡ System Online
┃
╰━━━━━━━━━━━━━━`

         }

       );

     }

     if (
       connection === "close"
     ) {

       const shouldReconnect =

       lastDisconnect?.error
       ?.output
       ?.statusCode

       !==

       DisconnectReason
       .loggedOut;

       log(
         "error",
         "Connection Closed"
       );

       if (shouldReconnect) {

         startBot();

       }

     }

   }

 );

 // ====================
 // MESSAGE EVENT
 // ====================

 sock.ev.on(

   "messages.upsert",

   async ({ messages }) => {

     try {

       const msg =
       messages[0];

       if (!msg.message)
       return;

       const jid =
       msg.key.remoteJid;

       const text =

         msg.message
         ?.conversation ||

         msg.message
         ?.extendedTextMessage
         ?.text ||

         "";

       // ====================
       // AUTO STATUS
       // ====================

       if (
         jid ===
         "status@broadcast"
       ) {

         // AUTO VIEW

         if (
           db.settings
           .autostatusview
         ) {

           await sock
           .readMessages([
             msg.key
           ]);

           log(
             "info",
             "Viewed Status"
           );

         }

         // AUTO REACT

         if (
           db.settings
           .autostatusreact
         ) {

           const emojis = [
             "❤️",
             "🔥",
             "😍",
             "⚡",
             "🥰"
           ];

           const emoji =

           emojis[
             Math.floor(
               Math.random() *
               emojis.length
             )
           ];

           await sock.sendMessage(

             "status@broadcast",

             {

               react: {

                 key:
                 msg.key,

                 text:
                 emoji

               }

             }

           );

           log(
             "info",
             "Reacted Status"
           );

         }

         return;

       }

       // ====================
       // PREFIX
       // ====================

       if (
         !text.startsWith(
           config.prefix
         )
       ) return;

       const cmd =

       text
       .slice(
         config.prefix.length
       )
       .trim()
       .toLowerCase();

       log(
         "info",
         `${jid} -> ${cmd}`
       );

       // ====================
       // AUTO STATUS VIEW
       // ====================

       if (
         cmd ===
         "autostatus view on"
       ) {

         db.settings
         .autostatusview =
         true;

         db.save();

         return await sock
         .sendMessage(

           jid,

           {
             text:
             "✅ Auto Status View Enabled"
           },

           {
             quoted: msg
           }

         );

       }

       if (
         cmd ===
         "autostatus view off"
       ) {

         db.settings
         .autostatusview =
         false;

         db.save();

         return await sock
         .sendMessage(

           jid,

           {
             text:
             "❌ Auto Status View Disabled"
           },

           {
             quoted: msg
           }

         );

       }

       // ====================
       // AUTO STATUS REACT
       // ====================

       if (
         cmd ===
         "autostatus react on"
       ) {

         db.settings
         .autostatusreact =
         true;

         db.save();

         return await sock
         .sendMessage(

           jid,

           {
             text:
             "✅ Auto Status React Enabled"
           },

           {
             quoted: msg
           }

         );

       }

       if (
         cmd ===
         "autostatus react off"
       ) {

         db.settings
         .autostatusreact =
         false;

         db.save();

         return await sock
         .sendMessage(

           jid,

           {
             text:
             "❌ Auto Status React Disabled"
           },

           {
             quoted: msg
           }

         );

       }

     } catch (e) {

       log(
         "error",
         e.toString()
       );

     }

   }

 );

}

startBot();

// ====================
// EXPRESS ROUTES
// ====================

app.get(
 "/",

 (req, res) => {

   res.send(`
<h2>ERAN-XMD ACTIVE</h2>

<p>/pair?number=8801xxxx</p>
<p>/qr</p>
<p>/status</p>
<p>/alive</p>
<p>/restart</p>
`);

 }

);

// ====================
// PAIR
// ====================

app.get(

 "/pair",

 async (req, res) => {

   try {

     const number =
     req.query.number;

     if (!number) {

       return res.send(
         "Enter Number"
       );

     }

     if (
       sock.authState
       .creds.registered
     ) {

       return res.send(
         "Already Connected"
       );

     }

     const code =

     await sock
     .requestPairingCode(
       number
     );

     log(
       "info",
       `Pair Code: ${code}`
     );

     res.send(`
<h2>ERAN-XMD PAIR CODE</h2>

<h1>${code}</h1>
`);

   } catch (e) {

     log(
       "error",
       e.toString()
     );

     res.send(
       e.toString()
     );

   }

 }

);

// ====================
// QR
// ====================

app.get(

 "/qr",

 async (req, res) => {

   try {

     const qr =
     await QRCode.toDataURL(
       qrCode
     );

     res.send(`
<img src="${qr}" />
`);

   } catch {

     res.send(
       "QR NOT READY"
     );

   }

 }

);

// ====================
// STATUS
// ====================

app.get(

 "/status",

 (req, res) => {

   res.json({

     bot: config.botname,

     status: "online",

     autostatusview:
     db.settings
     .autostatusview,

     autostatusreact:
     db.settings
     .autostatusreact

   });

 }

);

// ====================
// ALIVE
// ====================

app.get(

 "/alive",

 (req, res) => {

   res.send(`
<h1>ERAN-XMD ONLINE</h1>
`);

 }

);

// ====================
// RESTART
// ====================

app.get(

 "/restart",

 (req, res) => {

   res.send(
     "Restarting..."
   );

   process.exit(1);

 }

);

// ====================
// SERVER
// ====================

app.listen(

 config.port,

 () => {

   log(
     "success",

     `Server Running On Port ${config.port}`

   );

 }

);
