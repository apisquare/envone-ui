# EnvOne-UI

Dashboard to review your application's runtime environment variables.

![Node.js CI Build](https://github.com/apisquare/envone-ui/workflows/Node.js%20CI%20Build/badge.svg)
[![NPM version](https://img.shields.io/npm/v/envone-ui.svg)](https://www.npmjs.com/package/envone-ui)
[![codecov](https://codecov.io/gh/apisquare/envone-ui/branch/master/graph/badge.svg)](https://codecov.io/gh/apisquare/envone-ui)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/envone-ui)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=apisquare_envone-ui&metric=alert_status)](https://sonarcloud.io/dashboard?id=apisquare_envone-ui)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fapisquare%2Fenvone-ui.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fapisquare%2Fenvone-ui?ref=badge_shield)

## Install

```shell
# with npm
npm install envone-ui

# or with Yarn
yarn add envone-ui
```

## Usage

### 1. Custom usage

```javascript
const app = express(); // create express server
const envOneUI = require('envone-ui'); // import envone-ui

// Configure envOneApi
app.use(envOneUI.configure({
    include: ['SERVER_URL', 'DB_USERNAME', 'DB_PASSWORD'],
    secrets: ['DB_PASSWORD'],
    isAuthRequired: true,
  }),
);
```

### 2. Use with EnvOne or Dotenv

  1. Configure `EnvOne` properly with your Node.js application to load environment variables from `.env.config` file, or configure `Dotenv` to loan environment variables from `.env`.
  ```js
  // Configure EnvOne
  const configuredEnv = require('envone').config();
  // Or configure Dotenv
  const configuredEnv = require('dotenv').config();
  ```

  2. Pass the configured output from `envone` or `dotenv` as a parameter to `EnvOne-UI` initialization method.
  ```javascript
  const app = express(); // create express server
  const envOneUI = require('envone-ui'); // import envone-ui

  app.use(envOneUI(configuredEnv))
  ```

  3. If you want to add custom configurations to `EnvOne-UI`, you can use `configure` method,
  ```javascript
  const app = express(); // create express serverenvone
  const envOneUI = require('envone-ui'); // import envone-ui

  // Configure envOneApi
  app.use(envOneUI.configure({
      include: ['ENV'],
      secrets: ['DB_PASSWORD'],
      exclude: ['ANALYTICS_URL'],
      isAuthRequired: true,
      configOutput: configuredEnv
    }),
  );
  ```
  <b>Note: </b> If you properly configured `.env.config` for secrets, you can avoid `secrets` configuration here. It fetches necessary configurations from the `EnvOne` config output.

## Configurations

  | Property | Value Type | Default value | Description |
  | -------  | ------------- | ------- | ----------- |
  | include | Array | [ ] | Environment keys to be included in the EnvOne-UI |
  | exclude | Array | [ ] | Environment keys to be excluded from the EnvOne-UI |
  | secrets | Array | [ ] | Environment keys to be indicated as secrets - these values will be partially hidden with `*` character |
  | isAuthRequired | Boolean | true | Does Authorization require to access environment dashboard or not |
  | authorizationToken | String | `ZLbDGoXOg2sl!K$XOg2sl` | Authorization token to access dashboard |
  | tokenSecret | String | `8nrkCeHHWwBSxYP3` | Secret value to be used to encode the JWT token |
  | tokenLifeTime | String | `10` | Token life time, you have to authorize again if token is expired (e.g: `1d, 2h, 10`) |
  | configOutput | Object | `null` | Configured output from `EnvOne` or `Dotenv` |
  | defaultApiPath | String | `/env` | Default API Path to access authorization dashboard |
  | dashboardApiPath | String | `/env/dashboard` | Dashboard path to access environment keys UI | 
  | | |
    

## Screenshots

<p align="center">
<img src="https://raw.githubusercontent.com/apisquare/envone-ui/master/docs/envone-ui-flow.gif" alt="envone-ui" align="center" />
</p>

## Contributions

You can add any suggestions/feature requirements/bugs to the Github issues page : [https://github.com/apisquare/envone-ui/issues](https://github.com/apisquare/envone-ui/issues)

Add your fixes and development changes as pull requests to this [repository](https://github.com/apisquare/envone-ui/pulls).

## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fapisquare%2Fenvone-api.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fapisquare%2Fenvone-api?ref=badge_large)
