
const {BetaAnalyticsDataClient} = require('@google-analytics/data');
// let credentialsJsonPath = "./projeto-ia-v4-416414-dfbdaa5b9032.json"

const analyticsDataClient = new BetaAnalyticsDataClient({
  keyFilename: "./projeto-ia-v4-416414-dfbdaa5b9032.json"
});

const propertyId = "321232899"; //teste

// Runs a simple report.
async function readDataAnalytics(objParams) {

  const { startDate, endDate } = objParams;

  let arrObjs = [];

  const [response] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [
      {
        startDate: startDate,
        endDate: endDate,
      },
    ],
    dimensions: [
      {
        name: 'city',
      },
    ],
    metrics: [
      {
        name: 'activeUsers',
      },
    ],
    limit: 10
  });

  response.rows.forEach(row => {
    // console.log(row.dimensionValues[0], row.metricValues[0]);
    // console.log(row.dimensionValues[0].value, row.metricValues[0].value);
    arrObjs.push({ "key": row.dimensionValues[0].value, "value": row.metricValues[0].value })
  });

  // console.log(arrObjs)

  return arrObjs;
}


module.exports = {
  readDataAnalytics,
}

