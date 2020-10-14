const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon')
const jsdom = require("jsdom");
const utils = require('../src/utils')

const envOneApi = require('../src/api');
const envOneConstants = require('../src/constants');

const envOneConfigureMockResponse = {
  parsed: {
    BFF_URL: 'http://mock-server/api/v1',
    SALESFORCE_URL: 'https://dev-salesforce.com/v1/test',
    AWS_ACCESS_KEY: 'w5Dty3EaFi983etw',
    AWS_ACCESS_SECRET: 'jQACONG$45APjQACONG$45AP',
    DB_CONNECTION_URL: 'https://dev-service-xyz-dev.xyx.dev-mongo.com',
    DB_CONNECTION_PASSWORD: 'w5Dty3EaFi983etw',
    ANALYTICS_URL: 'https://analytics.dev-services.com/',
    CONTACT_US_EMAIL: 'hello-dev@abcd.com'
  }
}
const envOneSecrets = ['DB_CONNECTION_PASSWORD', 'AWS_ACCESS_SECRET']

const jwtMockSecret = "mockSecret";
const jwtTokenLifeTime = 10

let mockRequest = {}
let mockResponse = {}
let mockResponseStub = {}
let mockNext = () => {}
let isNextExecuted = false;
let retrieveProcessEnvStub;
let lastResponseStatus = null;
let lastResponseRedirection = null;

describe("Test EnvOne API methods", () => {
  beforeEach((done) => {
    lastResponseStatus = null;
    lastResponseRedirection = null;
    mockRequest = {
      headers: [],
      path: "",
      method: 'get',
      query: {},
      body: {},
      connection: {
        remoteAddress: "0.0.0.0"
      }
    }
    mockResponse = {
      send: (data) => data,
      writeHead: (status, redirectObject) => {
        lastResponseStatus = status;
        lastResponseRedirection = redirectObject;
      },
      end: () => {},
      status: (status) => {
        lastResponseStatus = status; 
        return  { send: () => {} }
      }
    }
    mockResponseStub = {
      send: sinon.spy(mockResponse, "send"),
      writeHead: sinon.spy(mockResponse, "writeHead"),
      end: sinon.spy(mockResponse, "end"),
      status: sinon.spy(mockResponse, "status"),
    }
    isNextExecuted = false;
    mockNext = () => isNextExecuted = true;

    retrieveProcessEnvStub = sinon.stub(envOneApi, 'retrieveProcessEnv').returns(envOneConfigureMockResponse.parsed);
    done()
  });

  afterEach((done) => {
    retrieveProcessEnvStub.restore();
    done()
  })

  it("should move to next(), if the request does not point to any of given environment related APIs", () => {
    const middleware = envOneApi.configure();
    mockRequest.path = "/api_name_1";
    expect(mockRequest.path).is.not.equal(envOneConstants.DEFAULT_API_PATHS.auth);
    expect(mockRequest.path).is.not.equal(envOneConstants.DEFAULT_API_PATHS.default);
    expect(mockRequest.path).is.not.equal(envOneConstants.DEFAULT_API_PATHS.dashboard);
    expect(isNextExecuted).false;
    middleware(mockRequest, mockResponse, mockNext);
    expect(isNextExecuted).true;
  })

  it("should not move to next(), if the request points to any of given environment related APIs", () => {
    const middleware = envOneApi.configure();
    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.default;
    expect(isNextExecuted).false;
    middleware(mockRequest, mockResponse, mockNext);
    expect(isNextExecuted).false;

    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.dashboard;
    expect(isNextExecuted).false;
    middleware(mockRequest, mockResponse, mockNext);
    expect(isNextExecuted).false;

    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.auth;
    expect(isNextExecuted).false;
    middleware(mockRequest, mockResponse, mockNext);
    expect(isNextExecuted).false;

    mockRequest.method = "post"
    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.auth;
    expect(isNextExecuted).false;
    middleware(mockRequest, mockResponse, mockNext);
    expect(isNextExecuted).false;
  })


  it("should have only auth component in default URL if isAuthRequired=true", () => {
    const middleware = envOneApi.configure({
      include: ["BFF_URL"]
    });
    
    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.default;
    const htmlMarkup = middleware(mockRequest, mockResponse, mockNext);
    const document = new jsdom.JSDOM(htmlMarkup, { runScripts: "dangerously" }).window.document;

    expect(document.getElementById("envOneApi_auth_content")).not.null;
    expect(document.getElementById("envOneApi_env_table")).is.null;
    expect(document.querySelectorAll('#envOneApi_env_table_row').length).is.equals(0);
  })

  it("should not render anything in default URL if isAuthRequired=false", () => {
    const middleware = envOneApi.configure({
      include: ["BFF_URL"],
      isAuthRequired: false
    });
    
    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.default;
    const htmlMarkup = middleware(mockRequest, mockResponse, mockNext);
    const document = new jsdom.JSDOM(htmlMarkup, { runScripts: "dangerously" }).window.document;

    expect(document.body.childElementCount).is.equals(0);
  })

  it("should not have any body data when directly calling /dashboard pathname if isAuthRequired=true", () => {
    const middleware = envOneApi.configure({
      include: ["BFF_URL"]
    });
    
    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.dashboard;
    const htmlMarkup = middleware(mockRequest, mockResponse, mockNext);
    const document = new jsdom.JSDOM(htmlMarkup, { runScripts: "dangerously" }).window.document;
    // Will be redirected to /env, so there won't be any body
    expect(document.body.childElementCount).is.equals(0);
  })

  it("should have proper body data when directly calling /dashboard pathname if isAuthRequired=false", () => {
    const middleware = envOneApi.configure({
      include: ["BFF_URL"],
      isAuthRequired: false
    });
    
    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.dashboard;
    const htmlMarkup = middleware(mockRequest, mockResponse, mockNext);
    const document = new jsdom.JSDOM(htmlMarkup, { runScripts: "dangerously" }).window.document;
    
    expect(document.getElementById("envOneApi_auth_content")).is.null;
    expect(document.getElementById("envOneApi_env_table")).is.not.null;
    expect(document.querySelectorAll('#envOneApi_env_table_row').length).is.equals(1);
  })

  it("should render only given keys in `include` if those are available in process.env", () => {
    const middleware = envOneApi.configure({
      include: ["BFF_URL", "SALESFORCE_URL"],
      tokenSecret: jwtMockSecret
    });
    
    token = utils.signJwtToken("0.0.0.0", jwtMockSecret, jwtTokenLifeTime);
    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.dashboard;
    mockRequest.query = { token }

    const htmlMarkup = middleware(mockRequest, mockResponse, mockNext);
    const document = new jsdom.JSDOM(htmlMarkup, { runScripts: "dangerously" }).window.document;
    
    expect(document.getElementById("envOneApi_auth_content")).is.null;
    expect(document.getElementById("envOneApi_env_table")).not.null;
    const selectedTableRows = document.querySelectorAll('#envOneApi_env_table_row')
    expect(selectedTableRows.length).is.equals(2);
    expect(selectedTableRows[0].children[0].textContent).is.equals("BFF_URL")
    expect(selectedTableRows[0].children[1].children[0].textContent).is.equals(envOneConfigureMockResponse.parsed.BFF_URL)
    expect(selectedTableRows[1].children[0].textContent).is.equals("SALESFORCE_URL")
    expect(selectedTableRows[1].children[1].children[0].textContent).is.equals(envOneConfigureMockResponse.parsed.SALESFORCE_URL)
  })

  it("should not render any keys in `include` if those are not available in process.env", () => {
    const middleware = envOneApi.configure({
      include: ["BFF_URL", "SALESFORCE_URL", "SALESFORCE_ADMIN_KEY"],
      tokenSecret: jwtMockSecret
    });
    
    expect(Object.keys(envOneConfigureMockResponse.parsed)).not.contains("SALESFORCE_ADMIN_KEY")

    token = utils.signJwtToken("0.0.0.0", jwtMockSecret, jwtTokenLifeTime);
    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.dashboard;
    mockRequest.query = { token }

    const htmlMarkup = middleware(mockRequest, mockResponse, mockNext);
    const document = new jsdom.JSDOM(htmlMarkup, { runScripts: "dangerously" }).window.document;
    
    expect(document.getElementById("envOneApi_auth_content")).is.null;
    expect(document.getElementById("envOneApi_env_table")).not.null;
    const selectedTableRows = document.querySelectorAll('#envOneApi_env_table_row')
    expect(selectedTableRows.length).is.equals(2);
    expect(selectedTableRows[0].children[0].textContent).is.equals("BFF_URL")
    expect(selectedTableRows[0].children[1].children[0].textContent).is.equals(envOneConfigureMockResponse.parsed.BFF_URL)
    expect(selectedTableRows[1].children[0].textContent).is.equals("SALESFORCE_URL")
    expect(selectedTableRows[1].children[1].children[0].textContent).is.equals(envOneConfigureMockResponse.parsed.SALESFORCE_URL)
  })

  it("should not render any content from `include`, if `include` is not an array", () => {
    const middleware = envOneApi.configure({
      include: { "BFF_URL": "" },
      tokenSecret: jwtMockSecret
    });
    
    expect(Object.keys(envOneConfigureMockResponse.parsed)).not.contains("SALESFORCE_ADMIN_KEY")

    token = utils.signJwtToken("0.0.0.0", jwtMockSecret, jwtTokenLifeTime);
    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.dashboard;
    mockRequest.query = { token }

    const htmlMarkup = middleware(mockRequest, mockResponse, mockNext);
    const document = new jsdom.JSDOM(htmlMarkup, { runScripts: "dangerously" }).window.document;
    
    expect(document.getElementById("envOneApi_auth_content")).is.null;
    expect(document.getElementById("envOneApi_env_table")).not.null;
    const selectedTableRows = document.querySelectorAll('#envOneApi_env_table_row')
    expect(selectedTableRows.length).is.equals(0);
  })

  it("should not render any keys from `exclude`", () => {
    const middleware = envOneApi.configure({
      include: ["BFF_URL", "SALESFORCE_URL"],
      exclude: ["SALESFORCE_URL"],
      tokenSecret: jwtMockSecret
    });

    token = utils.signJwtToken("0.0.0.0", jwtMockSecret, jwtTokenLifeTime);
    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.dashboard;
    mockRequest.query = { token }

    const htmlMarkup = middleware(mockRequest, mockResponse, mockNext);
    const document = new jsdom.JSDOM(htmlMarkup, { runScripts: "dangerously" }).window.document;
    
    expect(document.getElementById("envOneApi_auth_content")).is.null;
    expect(document.getElementById("envOneApi_env_table")).not.null;
    const selectedTableRows = document.querySelectorAll('#envOneApi_env_table_row')
    expect(selectedTableRows.length).is.equals(1);
    expect(selectedTableRows[0].children[0].textContent).is.equals("BFF_URL")
    expect(selectedTableRows[0].children[1].textContent).is.equals(envOneConfigureMockResponse.parsed.BFF_URL)
  })

  it("should render keys from `exclude` properly with hidden letters", () => {
    const middleware = envOneApi.configure({
      include: ["BFF_URL", "AWS_ACCESS_SECRET"],
      secrets: ["AWS_ACCESS_SECRET"],
      tokenSecret: jwtMockSecret
    });

    token = utils.signJwtToken("0.0.0.0", jwtMockSecret, jwtTokenLifeTime);
    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.dashboard;
    mockRequest.query = { token }

    const htmlMarkup = middleware(mockRequest, mockResponse, mockNext);
    const document = new jsdom.JSDOM(htmlMarkup, { runScripts: "dangerously" }).window.document;
    
    expect(document.getElementById("envOneApi_auth_content")).is.null;
    expect(document.getElementById("envOneApi_env_table")).not.null;
    const selectedTableRows = document.querySelectorAll('#envOneApi_env_table_row')
    expect(selectedTableRows.length).is.equals(2);
    expect(selectedTableRows[0].children[0].textContent).is.equals("BFF_URL")
    expect(selectedTableRows[0].children[1].children[0].textContent).is.equals(envOneConfigureMockResponse.parsed.BFF_URL)
    expect(selectedTableRows[1].children[0].textContent).is.equals("AWS_ACCESS_SECRET")
    const renderedSecret = selectedTableRows[1].children[1].children[0].textContent;
    expect(renderedSecret).is.not.equals(envOneConfigureMockResponse.parsed.AWS_ACCESS_SECRET)
    expect(renderedSecret.length).is.greaterThan(2);
    expect(renderedSecret[0]).is.equals(envOneConfigureMockResponse.parsed.AWS_ACCESS_SECRET[0])
    for(let index = 1; index < renderedSecret.length; index++) {
      expect(renderedSecret[index]).is.equal("*")
    }
  })


  it("should process `configOutput` properly, and render only available keys", () => {
    const middleware = envOneApi.configure({
      tokenSecret: jwtMockSecret,
      configOutput: envOneConfigureMockResponse
    });

    token = utils.signJwtToken("0.0.0.0", jwtMockSecret, jwtTokenLifeTime);
    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.dashboard;
    mockRequest.query = { token }

    const htmlMarkup = middleware(mockRequest, mockResponse, mockNext);
    const document = new jsdom.JSDOM(htmlMarkup, { runScripts: "dangerously" }).window.document;
    
    expect(document.getElementById("envOneApi_auth_content")).is.null;
    expect(document.getElementById("envOneApi_env_table")).not.null;
    const selectedTableRows = document.querySelectorAll('#envOneApi_env_table_row')
    expect(selectedTableRows.length).is.equals(Object.keys(envOneConfigureMockResponse.parsed).length);
  })

  it("should process `configOutput` properly, and avoid keys from `exclude` when render dashboard", () => {
    const middleware = envOneApi.configure({
      tokenSecret: jwtMockSecret,
      configOutput: envOneConfigureMockResponse,
      exclude: ["BFF_URL"]
    });

    token = utils.signJwtToken("0.0.0.0", jwtMockSecret, jwtTokenLifeTime);
    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.dashboard;
    mockRequest.query = { token }

    const htmlMarkup = middleware(mockRequest, mockResponse, mockNext);
    const document = new jsdom.JSDOM(htmlMarkup, { runScripts: "dangerously" }).window.document;
    
    expect(document.getElementById("envOneApi_auth_content")).is.null;
    expect(document.getElementById("envOneApi_env_table")).not.null;
    const selectedTableRows = document.querySelectorAll('#envOneApi_env_table_row')
    expect(selectedTableRows.length).is.equals(Object.keys(envOneConfigureMockResponse.parsed).length - 1);
  })

  it("should process `configOutput` properly, and render `secrets` properly", () => {
    const middleware = envOneApi.configure({
      tokenSecret: jwtMockSecret,
      configOutput: envOneConfigureMockResponse,
      secrets: ["AWS_ACCESS_SECRET"]
    });

    token = utils.signJwtToken("0.0.0.0", jwtMockSecret, jwtTokenLifeTime);
    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.dashboard;
    mockRequest.query = { token }

    const htmlMarkup = middleware(mockRequest, mockResponse, mockNext);
    const document = new jsdom.JSDOM(htmlMarkup, { runScripts: "dangerously" }).window.document;
    
    expect(document.getElementById("envOneApi_auth_content")).is.null;
    expect(document.getElementById("envOneApi_env_table")).not.null;
    const selectedTableRows = document.querySelectorAll('#envOneApi_env_table_row')
    expect(selectedTableRows.length).is.equals(Object.keys(envOneConfigureMockResponse.parsed).length);

    expect(selectedTableRows[3].children[0].textContent).is.equals("AWS_ACCESS_SECRET")
    const renderedSecret = selectedTableRows[3].children[1].children[0].textContent;
    expect(renderedSecret).is.not.equals(envOneConfigureMockResponse.parsed.AWS_ACCESS_SECRET)
    expect(renderedSecret.length).is.greaterThan(2);
    expect(renderedSecret[0]).is.equals(envOneConfigureMockResponse.parsed.AWS_ACCESS_SECRET[0])
    for(let index = 1; index < renderedSecret.length; index++) {
      expect(renderedSecret[index]).is.equal("*")
    }
  })

  it("should not render any content from `configOutput`, if `configOutput` is not a proper object", () => {
    const middleware = envOneApi.configure({
      configOutput: ["BFF_URL"],
      tokenSecret: jwtMockSecret
    });
    
    expect(Object.keys(envOneConfigureMockResponse.parsed)).not.contains("SALESFORCE_ADMIN_KEY")

    token = utils.signJwtToken("0.0.0.0", jwtMockSecret, jwtTokenLifeTime);
    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.dashboard;
    mockRequest.query = { token }

    const htmlMarkup = middleware(mockRequest, mockResponse, mockNext);
    const document = new jsdom.JSDOM(htmlMarkup, { runScripts: "dangerously" }).window.document;
    
    expect(document.getElementById("envOneApi_auth_content")).is.null;
    expect(document.getElementById("envOneApi_env_table")).not.null;
    const selectedTableRows = document.querySelectorAll('#envOneApi_env_table_row')
    expect(selectedTableRows.length).is.equals(0);
  })

  it("should not render any content from `configOutput`, if `configOutput` does not have any keys", () => {
    const middleware = envOneApi.configure({
      configOutput: {},
      tokenSecret: jwtMockSecret
    });
    
    expect(Object.keys(envOneConfigureMockResponse.parsed)).not.contains("SALESFORCE_ADMIN_KEY")

    token = utils.signJwtToken("0.0.0.0", jwtMockSecret, jwtTokenLifeTime);
    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.dashboard;
    mockRequest.query = { token }

    const htmlMarkup = middleware(mockRequest, mockResponse, mockNext);
    const document = new jsdom.JSDOM(htmlMarkup, { runScripts: "dangerously" }).window.document;
    
    expect(document.getElementById("envOneApi_auth_content")).is.null;
    expect(document.getElementById("envOneApi_env_table")).not.null;
    const selectedTableRows = document.querySelectorAll('#envOneApi_env_table_row')
    expect(selectedTableRows.length).is.equals(0);
  })

  it("should process `configOutput` properly, and pick `secrets` properly from the envOne config output", () => {
    const envOneConfigOutput = { ...envOneConfigureMockResponse, SECRET_ENVIRONMENT_KEYS: envOneSecrets}
    const middleware = envOneApi.configure({
      tokenSecret: jwtMockSecret,
      configOutput: envOneConfigOutput,
    });

    token = utils.signJwtToken("0.0.0.0", jwtMockSecret, jwtTokenLifeTime);
    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.dashboard;
    mockRequest.query = { token }

    const htmlMarkup = middleware(mockRequest, mockResponse, mockNext);
    const document = new jsdom.JSDOM(htmlMarkup, { runScripts: "dangerously" }).window.document;
    
    expect(document.getElementById("envOneApi_auth_content")).is.null;
    expect(document.getElementById("envOneApi_env_table")).not.null;
    const selectedTableRows = document.querySelectorAll('#envOneApi_env_table_row')
    expect(selectedTableRows.length).is.equals(Object.keys(envOneConfigureMockResponse.parsed).length);

    expect(selectedTableRows[3].children[0].textContent).is.equals("AWS_ACCESS_SECRET")
    let renderedSecret = selectedTableRows[3].children[1].children[0].textContent;
    expect(renderedSecret).is.not.equals(envOneConfigureMockResponse.parsed.AWS_ACCESS_SECRET)
    expect(renderedSecret.length).is.greaterThan(2);
    expect(renderedSecret[0]).is.equals(envOneConfigureMockResponse.parsed.AWS_ACCESS_SECRET[0])
    for(let index = 1; index < renderedSecret.length; index++) {
      expect(renderedSecret[index]).is.equal("*")
    }

    expect(selectedTableRows[5].children[0].textContent).is.equals("DB_CONNECTION_PASSWORD")
    renderedSecret = selectedTableRows[5].children[1].children[0].textContent;
    expect(renderedSecret).is.not.equals(envOneConfigureMockResponse.parsed.DB_CONNECTION_PASSWORD)
    expect(renderedSecret.length).is.greaterThan(2);
    expect(renderedSecret[0]).is.equals(envOneConfigureMockResponse.parsed.DB_CONNECTION_PASSWORD[0])
    for(let index = 1; index < renderedSecret.length; index++) {
      expect(renderedSecret[index]).is.equal("*")
    }
  })

  it("should hide the secrets from configOutput even secrets configuration has any issues", () => {
    const envOneConfigOutput = { ...envOneConfigureMockResponse, SECRET_ENVIRONMENT_KEYS: envOneSecrets}
    const middleware = envOneApi.configure({
      tokenSecret: jwtMockSecret,
      configOutput: envOneConfigOutput,
      secrets: { "BFF_URL": "" }
    });

    token = utils.signJwtToken("0.0.0.0", jwtMockSecret, jwtTokenLifeTime);
    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.dashboard;
    mockRequest.query = { token }

    const htmlMarkup = middleware(mockRequest, mockResponse, mockNext);
    const document = new jsdom.JSDOM(htmlMarkup, { runScripts: "dangerously" }).window.document;
    
    expect(document.getElementById("envOneApi_auth_content")).is.null;
    expect(document.getElementById("envOneApi_env_table")).not.null;
    const selectedTableRows = document.querySelectorAll('#envOneApi_env_table_row')
    expect(selectedTableRows.length).is.equals(Object.keys(envOneConfigureMockResponse.parsed).length);

    expect(selectedTableRows[0].children[0].textContent).is.equals("BFF_URL")
    expect(selectedTableRows[0].children[1].children[0].textContent).is.equals(envOneConfigureMockResponse.parsed.BFF_URL)

    expect(selectedTableRows[3].children[0].textContent).is.equals("AWS_ACCESS_SECRET")
    let renderedSecret = selectedTableRows[3].children[1].children[0].textContent;
    expect(renderedSecret).is.not.equals(envOneConfigureMockResponse.parsed.AWS_ACCESS_SECRET)
    expect(renderedSecret[0]).is.equals(envOneConfigureMockResponse.parsed.AWS_ACCESS_SECRET[0])
    for(let index = 1; index < renderedSecret.length; index++) {
      expect(renderedSecret[index]).is.equal("*")
    }

    expect(selectedTableRows[5].children[0].textContent).is.equals("DB_CONNECTION_PASSWORD")
    renderedSecret = selectedTableRows[5].children[1].children[0].textContent;
    expect(renderedSecret).is.not.equals(envOneConfigureMockResponse.parsed.DB_CONNECTION_PASSWORD)
    expect(renderedSecret[0]).is.equals(envOneConfigureMockResponse.parsed.DB_CONNECTION_PASSWORD[0])
    for(let index = 1; index < renderedSecret.length; index++) {
      expect(renderedSecret[index]).is.equal("*")
    }
  })

  it("should not have any body data when directly calling /dashboard with expired token", async () => {
    const middleware = envOneApi.configure({
      include: ["BFF_URL"],
      tokenSecret: jwtMockSecret,
      tokenLifeTime: 2
    });

    token = utils.signJwtToken("0.0.0.0", jwtMockSecret, 1);
    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.dashboard;
    mockRequest.query = { token }

    let htmlMarkup = middleware(mockRequest, mockResponse, mockNext);
    let document = new jsdom.JSDOM(htmlMarkup, { runScripts: "dangerously" }).window.document;
    
    expect(document.getElementById("envOneApi_auth_content")).is.null;
    expect(document.getElementById("envOneApi_env_table")).not.null;
    const selectedTableRows = document.querySelectorAll('#envOneApi_env_table_row')
    expect(selectedTableRows.length).is.equals(1);

    await new Promise((r) => setTimeout(r, 1500));

    htmlMarkup = middleware(mockRequest, mockResponse, mockNext);
    document = new jsdom.JSDOM(htmlMarkup, { runScripts: "dangerously" }).window.document;

    expect(document.body.childElementCount).is.equals(0);
    expect(document.getElementById("envOneApi_auth_content")).is.null;
    expect(document.getElementById("envOneApi_env_table")).is.null;
  }).timeout(2000);

  it("should not have any body data when /env/auth API has any issues", async () => {
    const middleware = envOneApi.configure({
      include: ["BFF_URL"],
      tokenSecret: jwtMockSecret,
      tokenLifeTime: '2ss', // Invalid life time for token
      authorizationToken: 'mockToken'
    });

    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.auth;
    mockRequest.method = "post"
    mockRequest.body = { authorization: 'mockToken' }

    const htmlMarkup = middleware(mockRequest, mockResponse, mockNext);
    const document = new jsdom.JSDOM(htmlMarkup, { runScripts: "dangerously" }).window.document;
    
    expect(document.body.childElementCount).is.equals(0);
    expect(document.getElementById("envOneApi_auth_content")).is.null;
    expect(document.getElementById("envOneApi_env_table")).is.null;
    expect(lastResponseStatus).is.equals(500);
  })

  it("should redirect to /env/dashboard, when calling /env/auth with valid token", async () => {
    const middleware = envOneApi.configure({
      include: ["BFF_URL"],
      tokenSecret: jwtMockSecret,
      tokenLifeTime: 2,
      authorizationToken: 'mockToken'
    });

    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.auth;
    mockRequest.method = "post"
    mockRequest.body = { authorization: 'mockToken' }

    const htmlMarkup = middleware(mockRequest, mockResponse, mockNext);
    const document = new jsdom.JSDOM(htmlMarkup, { runScripts: "dangerously" }).window.document;
    
    expect(document.body.childElementCount).is.equals(0);
    expect(lastResponseStatus).is.equals(307);
    expect(lastResponseRedirection).haveOwnProperty("Location");
    expect(lastResponseRedirection.Location.split('?')[0]).is.equals(envOneConstants.DEFAULT_API_PATHS.dashboard)
  })

  it("should work with direct method to configure endpoints", () => {
    const middleware = envOneApi.api();
    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.default;
    expect(isNextExecuted).false;
    middleware(mockRequest, mockResponse, mockNext);
    expect(isNextExecuted).false;

    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.dashboard;
    expect(isNextExecuted).false;
    middleware(mockRequest, mockResponse, mockNext);
    expect(isNextExecuted).false;

    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.auth;
    expect(isNextExecuted).false;
    middleware(mockRequest, mockResponse, mockNext);
    expect(isNextExecuted).false;

    mockRequest.method = "post"
    mockRequest.path = envOneConstants.DEFAULT_API_PATHS.auth;
    expect(isNextExecuted).false;
    middleware(mockRequest, mockResponse, mockNext);
    expect(isNextExecuted).false;
  })
});