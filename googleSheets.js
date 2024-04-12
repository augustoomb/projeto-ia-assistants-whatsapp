const { google } = require('googleapis');
require('dotenv').config();

const clientEmail = process.env.CLIENT_MAIL;
const privateKey = process.env.PRIVATE_KEY;
const googleSheetId = process.env.GOOGLE_SHEET_ID;
const googleSheetPage = process.env.GOOGLE_SHEET_ID;

// authenticate the service account
const googleAuth = new google.auth.JWT(
    clientEmail,
    null,
    privateKey.replace(/\\n/g, '\n'),
    'https://www.googleapis.com/auth/spreadsheets'
);

async function readSheet() {
    try {
      // google sheet instance
      const sheetInstance = await google.sheets({ version: 'v4', auth: googleAuth});
      // read data in the range in a sheet
      const infoObjectFromSheet = await sheetInstance.spreadsheets.values.get({
          auth: googleAuth,
          spreadsheetId: googleSheetId,
          range: `${googleSheetPage}!A1:B5`
      });
      
      const valuesFromSheet = infoObjectFromSheet.data.values;
      console.log(valuesFromSheet);
    }
    catch(err) {
      console.log("readSheet func() error", err);  
    }
}


// TODO: [X] RECEBER DADOS EM FORMATO JSON (CIDADES VS. QUANTIDADE DE USUÁRIOS)
// TODO: [] PEGAR DADOS E ESCREVER NUMA PLANILHA. (DÁ PRA CUSTOMIZAR PLANILHA VIA API?)
// TODO: [] GERAR GRÁFICO COM OS DADOS DA PLANILHA
// TODO: [] DEVOLVER LINK COM ARQUIVO (PLANILHA)


  
async function updateSheet(values) {

    const sheetInstance = await google.sheets({ version: 'v4', auth: googleAuth});
    
    // Atualizar os valores na planilha 
    await sheetInstance.spreadsheets.values.update({
        auth: googleAuth,
        spreadsheetId: googleSheetId,
        range: 'A1:B',
        valueInputOption: 'USER_ENTERED',
        resource: {
            values:[
                ['Cidade', 'Usuários'],
                ...values.map(item => [item.key, item.value])
            ]
        },
    });
    return "dados atualizados"
}

async function createChartInNewSheet() {
    const sheetInstance = await google.sheets({ version: 'v4', auth: googleAuth });

    // // Adicionando uma nova aba chamada "gráfico"
    // await sheetInstance.spreadsheets.batchUpdate({
    //     spreadsheetId: googleSheetId,
    //     resource: {
    //         requests: [
    //             {
    //                 addSheet: {
    //                     properties: {
    //                         title: 'gráfico'
    //                     }
    //                 }
    //             }
    //         ]
    //     }
    // });

    // Criando o gráfico na nova aba "gráfico"
    await sheetInstance.spreadsheets.batchUpdate({
        spreadsheetId: googleSheetId,
        resource: {
            requests: [
                {
                    addChart: {
                        chart: {
                            spec: {
                                title: 'Quantidade de usuários que acessaram o site Vs Cidade',
                                basicChart: {
                                    chartType: 'BAR',
                                    legendPosition: 'BOTTOM_LEGEND',
                                    axis: [
                                        { position: 'BOTTOM_AXIS', title: 'Usuários' },
                                        { position: 'LEFT_AXIS', title: 'Cidade' }
                                    ],
                                    domains: [
                                        {
                                            domain: {
                                                sourceRange: {
                                                    sources: [
                                                        {
                                                            sheetId: 0, // ID da aba "teste1"
                                                            startRowIndex: 1,
                                                            endRowIndex: 1000, // Altere conforme necessário
                                                            startColumnIndex: 0,
                                                            endColumnIndex: 1
                                                        }
                                                    ]
                                                }
                                            }
                                        }
                                    ],
                                    series: [
                                        {
                                            series: {
                                                sourceRange: {
                                                    sources: [
                                                        {
                                                            sheetId: 0, // ID da aba "teste1"
                                                            startRowIndex: 1,
                                                            endRowIndex: 1000, // Altere conforme necessário
                                                            startColumnIndex: 1,
                                                            endColumnIndex: 2
                                                        }
                                                    ]
                                                }
                                            }
                                        }
                                    ]
                                }
                            },
                            position: {
                                overlayPosition: {
                                    anchorCell: {
                                        sheetId: 2004257649, // ID da nova aba "gráfico"
                                        rowIndex: 1,
                                        columnIndex: 0
                                    },
                                    offsetXPixels: 0,
                                    offsetYPixels: 0,
                                    widthPixels: 600,
                                    heightPixels: 400
                                }
                            }
                        }
                    }
                }
            ]
        }
    });
    
    return "Gráfico criado com sucesso na aba 'gráfico'";
}



module.exports = { 
    readSheet,
    updateSheet,
    createChartInNewSheet
};
