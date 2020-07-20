const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
var jwt = require('jsonwebtoken');
const JWT_SECRET = "SUTHA_TOKEN";
const isDebugEnabled = true;
const DEFAULT_AUTH_TOKEN = "123" //"ZLbDGoXOg2sl!K$XOg2sl";

const handleBardConfig = {
  ATTACH_SCRIPT: fs.readFileSync(path.join(__dirname, './webapp/dist/index.bundle.js')),
  ATTACH_VARS: `const envData=null`
};

const htmlTemplate = fs
.readFileSync(path.join(__dirname, './webapp/dist/index.html'))
.toString();

/**
 * Log messages in console
 * @param {*} message 
 */
function logger (message) {
  if (isDebugEnabled) {
    // eslint-disable-next-line no-console
    console.log(`[envone][DEBUG] ${message}`);
  }
}

function formatEnvObjects(envData) {
  let formattedEnvData = [];
  if (envData) {
    Object.keys(envData).forEach(envKey => {
      formattedEnvData.push({ key: envKey, value: envData[envKey]});
    });
  }
  return formattedEnvData;
}

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

function responseRedirect(res, relativePath) {
  res.writeHead(301,
    {Location: relativePath}
  );
  return res.end();
}

function signJwtToken(ipAddress) {
  const token = jwt.sign({
    ip: ipAddress,
    time: Date.now()
  }, JWT_SECRET, { expiresIn: '3s' });
  return token;
}

function verifyJwtToken(token) {
  if (!token) {
    return { error: 'empty' };
  }
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch(err) {
    return { error: err.message };
  }
}

function middlewareWrapper(config = {}) {
  const { include, exclude, secrets, envOne, authorizationToken = DEFAULT_AUTH_TOKEN } = config; // TODO: Reset envOneCallBack default

  let envData;

  if (include) {
    if (Array.isArray(include)) {
      let inclusiveEnvData = {};
      include.forEach(key => {
        if (key in process.env){
          inclusiveEnvData[key] =  process.env[key];
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
          if (key in process.env){
            envOneData[key] =  process.env[key];
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
  
  const render = Handlebars.compile(htmlTemplate);

  function middleware(req, res, next) {
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    if (req.path === "/env/auth" && req.method == "POST") {
      const { authorization } = req.body;
      if (authorization === authorizationToken) {
        return responseRedirect(res, `/env/dashboard?token=${signJwtToken(ipAddress)}`);
      } else {
        return res.status(401).send({ error: 'Invalid authorization'});
      }
    } else if (req.path === "/env") {
      handleBardConfig.ATTACH_VARS = `const envData=null`;
      return res.send(render(handleBardConfig));
    } else if (req.path === "/env/dashboard") {
      const { token } = req.query;
      const { ip } = verifyJwtToken(token);
      if (ip && ip === ipAddress) {
        handleBardConfig.ATTACH_VARS = `const envData=${JSON.stringify(formatEnvObjects(envData))}`;
        return res.send(render(handleBardConfig));
      } else {
        return responseRedirect(res, `/env?error=invalid_token`);
      }
    } else {
      next();
    }
  }

  return middleware;
}

module.exports = middlewareWrapper;
