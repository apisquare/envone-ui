
const express = require('express');
const envOne = require('envone')
const bodyParser = require("body-parser");
const envOneApi = require('../index');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configure environment variables
const configuredEnvOne = envOne.config();

// Configure envOneApi
app.use(
  envOneApi.configure({
    secrets: ['AWS_ACCESS_SECRET', 'DB_CONNECTION_PASSWORD'],
    exclude: ['ANALYTICS_URL'],
    include: ['ENV'],
    isAuthRequired: true,
    configOutput: configuredEnvOne
  }),
);

app.get('/*', (req, res) => {
  const response = `<h1 style='text-align: center'> Go to <a href='/env'> /env </a> to check your environment variables </h1>`
  res.send(response);
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Listening on http://0.0.0.0:${port}`);
});
