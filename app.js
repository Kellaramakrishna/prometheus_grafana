const express = require('express');
const client = require('prom-client');
const bodyParser = require('body-parser');

const app = express();
const register = new client.Registry();

client.collectDefaultMetrics({ register });

// Set up an object to store multiple meters
const meters = {};

// Set up an object to store building meters
const buildingMeters = {};

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// POST endpoint to receive meter readings
app.post('/meter_reading', (req, res) => {
  const { meterName, reading, timestamp } = req.body;

  if (!meterName || reading === undefined || !timestamp) {
    return res.status(400).send('Missing required fields: meterName, reading, timestamp');
  }

  // Create or update the gauge for the specific meter
  if (!meters[meterName]) {
    meters[meterName] = new client.Gauge({
      name: `meter_reading_${meterName}`,
      help: `Energy meter reading for ${meterName} in kWh`,
      labelNames: ['timestamp'],
    });
    register.registerMetric(meters[meterName]);
  }

  meters[meterName].set({ timestamp: timestamp.toString() }, reading);
  console.log(meters);
  res.send('Reading recorded successfully');
});

// POST endpoint to receive building meter readings
app.post('/building_meter_reading', (req, res) => {
  const { id, meterName, reading,timestamp} = req.body;

  // let timestamp=new Date()
  // console.log("timestamp==>",timestamp)

  if (!id || !meterName || reading === undefined || !timestamp) {
    return res.status(400).send('Missing required fields: id, meterName, reading, timestamp');
  }

  // Create or update the gauge for the specific meter
  if (!buildingMeters[id]) {
    buildingMeters[id] = new client.Gauge({
      name: `building_meter_reading_${id}`,
      help: `Energy meter reading for building ${id} - ${meterName} in kWh`,
      labelNames: ['timestamp'],
    }); 
    register.registerMetric(buildingMeters[id]);
  }

  buildingMeters[id].set({ timestamp: timestamp.toString() }, reading);
  console.log(buildingMeters);
  res.send('Reading recorded');
});



app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});



const port = 8000;
app.listen(port, () => {
  console.log(`Energy meter exporter listening at http://localhost:${port}`);
});


module.exports=app