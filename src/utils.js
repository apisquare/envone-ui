
const jwt = require('jsonwebtoken');

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

function getProcessEnv() {
  return process.env;
}

module.exports = {
  formatEnvObjects,
  secretFormat,
  responseRedirect,
  signJwtToken,
  verifyJwtToken,
  getProcessEnv
}
