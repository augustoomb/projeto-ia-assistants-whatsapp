const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const bucket = storage.bucket('bucket-ia-v4');


const readFromFileOnStorage = async remoteFilePath => new Promise((resolve, reject) => {
    let dadosJson = '';
    bucket.file(remoteFilePath)
      .createReadStream()
      .on('data', d => (dadosJson += d))
      .on('end', () => resolve(JSON.parse(dadosJson)))
      .on('error', e => reject(e))
  })

async function WriteToStorageFile(phoneId, threadId) { // params sao string
  try {

      // RECUPERANDO OS DADOS DO ARQUIVO DO STORAGE
      const JsonDataToFile = await readFromFileOnStorage("conversations.json");

      // ADICIONANDO AO ARQUIVO AS INFORMAÇÕES PASSADAS POR PARÂMETRO
      JsonDataToFile[phoneId] = threadId;

      // Definir o nome do arquivo
      const fileName = 'conversations.json';

      // Criar um objeto para o arquivo
      const file = bucket.file(fileName);

      // Abrir um stream para o arquivo
      const stream = file.createWriteStream();

      // Escrever os dados no arquivo
      stream.write(JSON.stringify(JsonDataToFile));
      

      // Finalizar o stream
      await stream.end();

      const exists = await file.exists();

      // Verificar se o arquivo foi salvo
      // file.exists().then((exists) => {
      if (exists) {
        console.log('Arquivo salvo com sucesso!');
      } else {
        console.log('Erro ao salvar o arquivo.');  
      }          
      // });
    } catch (error) {
      console.log(error);
    }
}

module.exports = { 
  readFromFileOnStorage,
  WriteToStorageFile
};
