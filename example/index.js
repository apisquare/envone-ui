
const express = require('express');
const envOne = require('envone')
envOne.config();
const cors = require('cors');
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  require('../index')({
    secrets: ['AWS_ACCESS_SECRET', 'DB_CONNECTION_PASSWORD'],
    exclude: ["ANALYTICS_URL"],
    include: ['ENV'],
    envOne: envOne
  }),
);

// Example route throwing requested status code
app.get('/hello', (req, res) =>
  res.send("Hello"),
);

app.get('/', (req, res) => {
  const response = `<h1 style='text-align: center'> Go to <a href='/env'> /env </a> to check your environment variables </h1>`
  res.send(response);
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Listening on http://0.0.0.0:${port}`);
});
