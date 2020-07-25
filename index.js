const envOneApi = require('./src/api');

const envOneApiModule = module.exports = envOneApi.api;
envOneApiModule.configure = envOneApi.configure
