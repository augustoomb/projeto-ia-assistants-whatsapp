require('dotenv').config();
const token = process.env.WHATSAPP_TOKEN

axios = require("axios");

const zapGetUserInfo = (objUser) => {

    let phone_number_id = objUser.metadata.phone_number_id; // Num cadastrado no business (receptor)
    let from = objUser.messages[0].from; // Quem enviou
    let msg_body = objUser.messages[0].text.body;

    return {
        phone_number_id,
        from,
        msg_body
    }
}

const zapRespondToUser = async (phone_number_id, to, answer) => {
    await axios({
        method: "POST",
        url:
          "https://graph.facebook.com/v19.0/" +
          phone_number_id +
          "/messages",
        data: {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: to,              
          text: { 
            preview_url: false,
            body: answer
          },              
        },
        headers: { 
          "Content-Type": "application/json",
          "Authorization" : `Bearer ${ token }`
        },
    });
}

module.exports = {
  zapGetUserInfo,
  zapRespondToUser,
};
