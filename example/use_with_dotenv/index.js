
const express = require('express');
const dotEnv = require('dotenv');
const bodyParser = require("body-parser");
const envOneUI = require('../../index');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configure environment variables
const configuredEnv = dotEnv.config();

// Configure envOneUI
app.use(
  envOneUI.configure({
    secrets: ['AWS_ACCESS_SECRET', 'DB_CONNECTION_PASSWORD'],
    exclude: ['ANALYTICS_URL'],
    include: ['ENV'],
    isAuthRequired: true,
    configOutput: configuredEnv.parsed,
    tokenLifeTime: 60
  }),
);

app.get('/*', (req, res) => {
  const response = `<h1 style='text-align: center'> Go to <a href='/env'> /env </a> to check your environment variables </h1>`;
  res.send(response);
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Listening on http://0.0.0.0:${port}`);
});
