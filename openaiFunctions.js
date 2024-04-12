require('dotenv').config();

const openai_token = process.env.OPENAI_TOKEN;
const assistant_id = process.env.ASSISTANT_ID;
const urlBase = "https://api.openai.com/v1";
const headers = { 
  "Authorization": "Bearer "+openai_token,
  "Content-Type": "application/json",
  "OpenAI-Beta": "assistants=v1"
};

const { readDataAnalytics } = require("./googleAnalytics");
const { readFromFileOnStorage, WriteToStorageFile } = require("./cloudStorageFunctions");


const listAvailableFunctions = (nameFunction) => {
  const objFunctions = {
    "readDataAnalytics": readDataAnalytics,
  }

  return objFunctions[nameFunction];
}


const openaiGetThreadId = async (userNumber) => {
  let threadId = "";

  // PEGA UM CONJUNTO COM OBJETO CHAVE/VALOR COM "phone_number": "threadId"
  const jsonUserThreads = await readFromFileOnStorage("conversations.json"); 

  // VERIFICA SE O TEL DO USUÁRIO ESTÁ ENTRE AS CHAVES DO ARQUIVO...
  if(jsonUserThreads[userNumber.toString()]) {
    threadId = jsonUserThreads[userNumber.toString()]; // ...SE SIM, RECUPERE O VALOR (THREAD)
  } else {
    threadId = await create_thread(); // ...SE NÃO, CRIE UMA THREAD PARA O NÚMERO
    await WriteToStorageFile(userNumber.toString(), threadId); // E SALVE NO ARQUIVO
  }

  return threadId;
}

const create_thread = async () => {
    const response = await axios({
      method: "POST",
      url:
        `${urlBase}/threads`,
      headers,
    });
            
    return response.data.id;    
}

const openaiCreateMessage = async (msg_body, thread_id) => {
    await axios({
      method: "POST",
      url:
        `${urlBase}/threads/${thread_id}/messages`,
      data: {
        "role": "user",
        "content": msg_body,
      },
      headers,
    });    
  }
  
  const openaiRun = async (thread_id) => {
      const response = await axios({
        method: "POST",
        url:
          `${urlBase}/threads/${thread_id}/runs`,
        data: {
          assistant_id,
        },
        headers,
      });

    if (!response.data.id) {
        throw "Problema ao executar a run";
    } else {
        return response.data.id;
    }    
  }
  
  const check_run_status = async (run_id, thread_id) => {      
    const response = await axios({
      method: "GET",
      url:
        `${urlBase}/threads/${thread_id}/runs/${run_id}`,
      headers,
    });
    
    // console.log("Status run: " + response.data.status);
    return response.data;      
  }

  const submit_tool_outputs = async (run_id, thread_id, tool_call_id) => {      
    const response = await axios({
      method: "POST",
      url:
        `${urlBase}/threads/${thread_id}/runs/${run_id}/submit_tool_outputs`,
      data: {
        tool_outputs: [
          {
              "tool_call_id": tool_call_id,
              "output": "submit_tool_outputs OK",
          }
        ],
      },
      headers,
    });
    
    return response.data;      
  }
  
const openaiGetAnswer = async (thread_id, responseType) => {
    const response =  await axios({
      method: "GET",
      url:
        `${urlBase}/threads/${thread_id}/messages`,
      headers,
    });
    const objResponse = response.data.data[0];

    return objResponse.content[0].text.value;
}

const openaiHandleRun = async (thread_id, run_id) => {

  let objStatusRun = "";
  let statusRun = "";
  let responseSelectedFunction = null;

  do {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    objStatusRun = await check_run_status(run_id, thread_id);
    statusRun = objStatusRun.status;
  
    if (statusRun === "requires_action") {

      const detectedFunctions = await objStatusRun.required_action.submit_tool_outputs.tool_calls;
      
      const tool_call = detectedFunctions[0];
      const nameFunction = tool_call.function.name;
      const argumentss = JSON.parse(tool_call.function.arguments);

      responseSelectedFunction = await listAvailableFunctions(nameFunction)(argumentss) || null;

      // NÃO TEM INFORMAÇAO RELEVANTE PRO USUÁRIO AQUI NO RETORNO...
      await submit_tool_outputs(run_id, thread_id, tool_call.id)

      objStatusRun = await check_run_status(run_id, thread_id);
      statusRun = objStatusRun.status

    } else if (statusRun === "expired" || statusRun === "failed" || statusRun === "cancelling"  || statusRun === "cancelled") {
      throw ("Erro ao executar a thread. Ela foi cancelada.")
    }

    console.log("STATUS DO PROCESSO: " + statusRun);

  } while (statusRun === "queued" || statusRun === "in_progress");

  return responseSelectedFunction;

}



module.exports = { 
  openaiGetThreadId,
  listAvailableFunctions,
  create_thread,
  openaiCreateMessage, 
  openaiRun, 
  check_run_status,
  submit_tool_outputs,
  openaiGetAnswer,
  openaiHandleRun,
};

