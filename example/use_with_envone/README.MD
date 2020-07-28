# Configured EnvOne-UI with EnvOne

## Code


### Default configuration


```js

const express = require('express');
const bodyParser = require("body-parser");
const envone = require('envone');
const envOneUI = require('envone-ui');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configure environment variables
const configuredEnv = envone.config();

// Configure envOneUI with default properties
app.use(envOneUI(configuredEnv));
```

### Custom configuration

```js

const express = require('express');
const bodyParser = require("body-parser");
const envone = require('envone');
const envOneUI = require('envone-ui');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configure environment variables
const configuredEnv = envone.config();

// Configure envOneUI with custom properties
app.use(
  envOneUI.configure({
    secrets: ['AWS_ACCESS_SECRET', 'DB_CONNECTION_PASSWORD'],
    exclude: ['ANALYTICS_URL'],
    include: ['ENV'],
    isAuthRequired: true,
    configOutput: configuredEnv,
    tokenLifeTime: 60
  }),
);
```


## Run this example
1. Clone this repository : `git clone https://github.com/apisquare/envone-ui`
2. Go inside the example folder : `cd envone-ui/example/use_with_envone`
3. Install the required dependencies : `npm install or yarn`
4. Start the server : `yarn start`
5. Open your browser and go to [http://localhost:3000/env](http://localhost:3000/env) to get the EnvOne-UI dashboard.