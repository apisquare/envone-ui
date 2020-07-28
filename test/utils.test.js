const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon')

const envOneApiUtils = require('../src/utils');

describe("Test EnvOne API utility methods", () => {

  it("should formatEnvObjects parse valid object and return array of parsed objects", () => {
    const envObject = { "ENV": "DEV", "URL": "https://abc.com/api" }
    const result = envOneApiUtils.formatEnvObjects(envObject);
    expect(result).not.undefined;
    expect(Array.isArray(result)).is.true;
    expect(result.length).to.equals(2);
    expect(result[0].key).to.equals("ENV");
    expect(result[0].value).to.equals("DEV");
    expect(result[1].key).to.equals("URL");
    expect(result[1].value).to.equals("https://abc.com/api");
  })

  it("should formatEnvObjects parse empty object and return empty array", () => {
    const result = envOneApiUtils.formatEnvObjects({});
    expect(result).not.undefined;
    expect(Array.isArray(result)).is.true;
    expect(result.length).to.equals(0);
  })

  it("should formatEnvObjects parse null object and return empty array", () => {
    const result = envOneApiUtils.formatEnvObjects(null);
    expect(result).not.undefined;
    expect(Array.isArray(result)).is.true;
    expect(result.length).to.equals(0);
  })

  it("should secretFormat parse a valid secret and return text with hidden letters", () => {
    const secret = "da@asf21%@#ASF"
    const result = envOneApiUtils.secretFormat(secret);
    expect(result).not.undefined;
    expect(result.length).is.greaterThan(2);
    expect(result[0]).is.equals(secret[0]);
    for(let index = 1; index < result.length; index++) {
      expect(result[index]).is.equal("*")
    }
  })

  it("should secretFormat parse a empty secret and return only hidden letters", () => {
    const secret = ""
    const result = envOneApiUtils.secretFormat(secret);
    expect(result).not.undefined;
    expect(result.length).is.greaterThan(2);
    for(let index = 0; index < result.length; index++) {
      expect(result[index]).is.equal("*")
    }
  })

  it("should secretFormat parse a null secret and return only hidden letters", () => {
    const result = envOneApiUtils.secretFormat(null);
    expect(result).not.undefined;
    expect(result.length).is.greaterThan(2);
    for(let index = 0; index < result.length; index++) {
      expect(result[index]).is.equal("*")
    }
  })

  it("should responseRedirect attach the redirection headers", () => {
    let resLocation = "";

    const res = { writeHead: (a, b) => { resLocation = b; } , end: () => {} } 
    const spyWriteHead = sinon.spy(res, "writeHead");
    const spyEnd = sinon.spy(res, "end");
  
    expect(resLocation).not.haveOwnProperty("Location")
    envOneApiUtils.responseRedirect(res, "/abc/cdf");
    expect(spyWriteHead.calledOnce).is.true
    expect(spyEnd.calledOnce).is.true
    expect(resLocation).haveOwnProperty("Location")
    expect(resLocation.Location).is.equals("/abc/cdf")
  })

  it("should verify return error if the token is empty", () => {
    const result = envOneApiUtils.verifyJwtToken('', "mockSecret");
    expect(result).not.undefined;
    expect(result).haveOwnProperty("error")
  });

  it("should verify return error if the secret is different", () => {
    const token = envOneApiUtils.signJwtToken("0.0.0.0", "mockSecret1", 10)
    const result = envOneApiUtils.verifyJwtToken(token, "mockSecret2");
    expect(result).not.undefined;
    expect(result).haveOwnProperty("error")
  });

  it("should verify return error if the secret is expired", async () => {
    const token = envOneApiUtils.signJwtToken("0.0.0.0", "mockSecret1", 1)
    let result = envOneApiUtils.verifyJwtToken(token, "mockSecret1");
    expect(result).is.not.undefined;
    expect(result).is.not.haveOwnProperty("error")

    await new Promise((r) => setTimeout(r, 1500));

    result = envOneApiUtils.verifyJwtToken(token, "mockSecret1");
    expect(result).is.not.undefined;
    expect(result).is.haveOwnProperty("error")
  }).timeout(2500);

  it("should verify return valid object if the token is valid", () => {
    const token = envOneApiUtils.signJwtToken("0.0.0.0", "mockSecret", 10)
    const result = envOneApiUtils.verifyJwtToken(token, "mockSecret");
    expect(result).not.undefined;
    expect(result).not.haveOwnProperty("error")
  });

  it("should return error if lifeTime value is invalid", () => {
    const result = envOneApiUtils.signJwtToken("0.0.0.0", "mockSecret", "a");
    expect(result).not.undefined;
    expect(result).haveOwnProperty("error")
  });

  it("should have proper process environments", () => {
    const result = envOneApiUtils.getProcessEnv();
    expect(result).not.undefined;
  });
});