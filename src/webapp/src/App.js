import React from 'react';
import './asserts/css/App.css';

// eslint-disable-next-line
const documentEnvData = envData;
const originUrl = window.location ? window.location.origin : null;

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      authToken: ""
    };

    this.onAuthorizeClick = this.onAuthorizeClick.bind(this);
    this.getRows = this.getRows.bind(this);
    this.setAuthToken = this.setAuthToken.bind(this);
  }

  onAuthorizeClick() {
    const { authToken } = this.state;
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorization: authToken }),
      redirect: 'follow'
    };
    fetch(`${originUrl}/env/auth`, requestOptions)
      .then(response => {
        if (response.redirected) {
          window.location.href = response.url;
        }
        response.json();
      });
  }

  getRows(environmentConfig) {
    if (environmentConfig) {
      const tableRows = environmentConfig.map(envConfig => 
        <tr key={envConfig.key}>
          <td data-label="Key">{envConfig.key}</td>
          <td data-label="Value">{envConfig.value}</td>
        </tr>
      );
      return tableRows;  
    }
    return <></>;
  }

  setAuthToken(e) {
    const token = e.target.value;
    this.setState({
      authToken: token
    });
  }

  render() {
    const { authToken } = this.state;
    return (
      <div className="App">
        <header className="App-header">
          <p>
            Environment Variables
          </p>
        </header>

        <div className="content">
          {documentEnvData ? (
            <table>
              <thead>
                <tr>
                  <th scope="col">Key</th>
                  <th scope="col">Value</th>
                </tr>
              </thead>
              <tbody>
                {this.getRows(documentEnvData)}
              </tbody>
            </table>
          ) : (
            <div className="auth-form-wrap">
              <input type="text" placeholder="Enter authorize token" onChange={this.setAuthToken} value={authToken} />
              <input type="submit"  onClick={this.onAuthorizeClick} value="Authorize" />
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default App;
