require('dotenv').config();

express = require("express"),
body_parser = require("body-parser"),
axios = require("axios").default,
app = express().use(body_parser.json()); // creates express http server

const { zapGetUserInfo, zapRespondToUser } = require("./whatsAppFunctions");
const { updateSheet, createChartInNewSheet } = require("./googleSheets");
const { openaiCreateMessage, openaiRun,
  openaiGetAnswer, openaiHandleRun, openaiGetThreadId } = require("./openaiFunctions");


app.listen(process.env.PORT || 1337, () => console.log("webhook is listening"));

app.post("/webhook", async (req, res) => {

  try {
    if (req.body.object) {
      if (
        req.body.entry &&
        req.body.entry[0].changes &&
        req.body.entry[0].changes[0] &&
        req.body.entry[0].changes[0].value.messages &&
        req.body.entry[0].changes[0].value.messages[0]
      ) {  
          const { phone_number_id, from, msg_body } = zapGetUserInfo(req.body.entry[0].changes[0].value);
          const openaiThreadId = await openaiGetThreadId(from);
          
          await openaiCreateMessage(msg_body, openaiThreadId);
          const openaiRunId = await openaiRun(openaiThreadId);

          const response = await openaiHandleRun(openaiThreadId, openaiRunId);
          let responseType = "user";

          // SOMENTE SE EXECUTAR FUNCTIONS
          if (response) {
            await updateSheet(response);
            await createChartInNewSheet();
            responseType = "assistant";
          } 

          const answer = await openaiGetAnswer(openaiThreadId, responseType);
          await zapRespondToUser(phone_number_id, from, answer);

          res.sendStatus(200);
        }
      
    }     
    
    else {
      res.sendStatus(404);
    }

  } catch (error) {
    console.log("gerou a exceção: "+error);
    res.sendStatus(404);
  }     

});
  
// ESSA ROTA SERVE APENAS PARA VERIFICAÇÃO
  app.get("/webhook", (req, res) => {
    const verify_token = process.env.VERIFY_TOKEN;
  
    let mode = req.query["hub.mode"];
    let token = req.query["hub.verify_token"];
    let challenge = req.query["hub.challenge"];
  
    if (mode && token) {
      if (mode === "subscribe" && token === verify_token) {
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    }
  });
