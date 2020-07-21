const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const jwt = require('jsonwebtoken');
const constants = require('./constants');
const { DEFAULT_TOKEN_SECRET,  DEFAULT_AUTH_TOKEN, DEFAULT_API_PATHS } = constants;

let IS_AUTH_REQUIRED = true;

const handleBardConfig = {
  ATTACH_SCRIPT: fs.readFileSync(path.join(__dirname, './webapp/dist/index.bundle.js')),
  ATTACH_VARS: `const envData=null`
};

const htmlTemplate = fs
.readFileSync(path.join(__dirname, './webapp/dist/index.html'))
.toString();

const render = Handlebars.compile(htmlTemplate);

/**
 * Log messages in console
 * @param {*} message 
 */
function logger (message) {
  if (IS_DEBUG_ENABLED) {
    // eslint-disable-next-line no-console
    console.log(`[envone][DEBUG] ${message}`);
  }
}

/**
 * Format environment keys and values as an array
 * @param {*} envData 
 */
function formatEnvObjects(envData) {
  let formattedEnvData = [];
  if (envData) {
    Object.keys(envData).forEach(envKey => {
      formattedEnvData.push({ key: envKey, value: envData[envKey]});
    });
  }
  return formattedEnvData;
}

/**
 * Format secret values to hide the actual content
 * @param {*} secretValue 
 */
function secretFormat(secretValue) {
  let formattedSecret = "";
  if (secretValue) {
    formattedSecret = secretValue[0];
  }
  const secretLength = Math.floor(5 + Math.random() * 4);
  for (let i = 1; i < secretLength; i++) {
    formattedSecret += '*';
  }
  return formattedSecret;
}

/**
 * Redirect response with given URL
 * @param {*} res 
 * @param {*} relativePath 
 */
function responseRedirect(res, relativePath) {
  res.writeHead(307,
    {Location: relativePath}
  );
  return res.end();
}

/**
 * Compile and send the environment dashboard component with the response.
 * @param {*} res 
 */
function sendCompiledEnvDashboard(res, envData) {
  handleBardConfig.ATTACH_VARS = `const envData=${JSON.stringify(formatEnvObjects(envData))}`;
  return res.send(render(handleBardConfig));
}

/**
 * Sign JWT token with given ip address
 * @param {*} ipAddress 
 */
function signJwtToken(ipAddress, jwtSecret) {
  const token = jwt.sign({
    ip: ipAddress,
    time: Date.now()
  }, jwtSecret, { expiresIn: '3s' });
  return token;
}

/**
 * Verify the JWT token
 * @param {*} token 
 */
function verifyJwtToken(token, jwtSecret) {
  if (!token) {
    return { error: 'empty' };
  }
  try {
    return jwt.verify(token, jwtSecret);
  } catch(err) {
    return { error: err.message };
  }
}

/**
 * Retrieve existing process environments, will be used to mock the process envs
 */
module.exports.retrieveProcessEnv = function () {
  return process.env;
};

function getProcessEnv() {
  return module.exports.retrieveProcessEnv();
}

/**
 * Middle ware wrapper to expose the data via given APIs
 * @param {*} config 
 */
function middlewareWrapper(config = {}) {
  const {
    include,
    exclude,
    secrets,
    envOne,
    authorizationToken = DEFAULT_AUTH_TOKEN,
    apiPath = {},
    isAuthRequired = true,
    tokenSecret = DEFAULT_TOKEN_SECRET
  } = config; // TODO: Reset envOneCallBack default

  IS_AUTH_REQUIRED = isAuthRequired;

  const { 
    default: DEFAULT_PATH = DEFAULT_API_PATHS.default,
    auth: AUTH_PATH = DEFAULT_API_PATHS.auth, 
    dashboard: DASHBOARD_PATH = DEFAULT_API_PATHS.dashboard
  } = apiPath;

  let envData;

  if (include) {
    if (Array.isArray(include)) {
      let inclusiveEnvData = {};
      include.forEach(key => {
        if (key in getProcessEnv()){
          inclusiveEnvData[key] =  getProcessEnv()[key];
        }
      });

      envData = inclusiveEnvData;
    } else {
      logger('Invalid type found for "include". It should be a valid array.');
    }
  }

  if (envOne) {
    const { getUserEnvironmentKeys } = envOne;
    if (typeof getUserEnvironmentKeys === 'function') {
      envKeys = [ ...getUserEnvironmentKeys() ];
      if (envKeys && Array.isArray(envKeys)) {
        let envOneData = {};
        envKeys.forEach(key => {
          if (key in getProcessEnv()){
            envOneData[key] =  getProcessEnv()[key];
          }
        });

        if (envData) {
          envData ={ ...envData, ...envOneData };
        } else {
          envData = envOneData;
        }
      } else {
        logger('Empty response from envData, Can not find any environment keys.');
      }
    } else {
      logger('Can not access getUserEnvironmentKeys from envOne. It should be a valid EnvOne package.');
    }
  } 
  
  if (envData) {
    if (exclude) {
      if (Array.isArray(exclude)) {
        exclude.forEach(key => {
          if (key in envData){
            delete envData[key];
          }
        });
      } else {
        logger('Invalid type found for "exclude". It should be a valid array.');
      } 
    }
  
    if (secrets) {
      if (Array.isArray(secrets)) {
        secrets.forEach(secretKey => {
          if (secretKey in envData){
            envData[secretKey] = secretFormat(envData[secretKey]);
          }
        });
      } else {
        logger('Invalid type found for "secrets". It should be a valid array.');
      } 
    }
  }

  /**
   * Custom middle ware function to expose environment variables APIs
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   */
  function middleware(req, res, next) {
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    if (!IS_AUTH_REQUIRED) {
      if (req.method.toUpperCase() === "GET" && req.path === DASHBOARD_PATH) {
        return sendCompiledEnvDashboard(res, envData);
      }
    } else {
      if (req.method.toUpperCase() == "POST") {
        if (req.path === AUTH_PATH) {
          const { authorization } = req.body;
          if (authorization === authorizationToken) {
            return responseRedirect(res, `${DASHBOARD_PATH}?token=${signJwtToken(ipAddress, tokenSecret)}`);
          } else {
            return res.status(401).send({ error: 'Invalid token'});
          }
        }
      } else if (req.method.toUpperCase() == "GET") {
        if (req.path === AUTH_PATH) {
          return responseRedirect(res, `${DEFAULT_PATH}?error=invalid_session`);
        } else if (req.path === DEFAULT_PATH) {
          handleBardConfig.ATTACH_VARS = `const envData=null`;
          return res.send(render(handleBardConfig));
        } else if (req.path === DASHBOARD_PATH) {
          const { token } = req.query;
          const { ip } = verifyJwtToken(token, tokenSecret);
          if (ip && ip === ipAddress) {
            return sendCompiledEnvDashboard(res, envData);
          } else {
            return responseRedirect(res, `${DEFAULT_PATH}?error=invalid_token`);
          }
        }
      }
    }

    next();
  }

  return middleware;
}

module.exports.middlewareWrapper = middlewareWrapper;
