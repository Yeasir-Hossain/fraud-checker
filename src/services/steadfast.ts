import { CheckResult } from "../types";

interface ISteadFast {
  _user: string;
  _password: string

  // methods
  login: () => Promise<string>
  check: (phone: string) => Promise<CheckResult>
}

class SteadFast implements ISteadFast {
  _user: string;
  _password: string;
  _token?: string | null
  _baseUrl: string

  constructor(user: string, password: string) {
    this._user = user;
    this._password = password;
    this._baseUrl = 'https://steadfast.com.bd';
    // this.login().then(console.log).catch(console.log);
  }

  async login() {
    const loginPage = await fetch(`${this._baseUrl}/login`);
    if (!loginPage.ok) throw new Error('Page is not accesible');
    const pageContent = await loginPage.text();
    const csrfMatch = pageContent.match(/name="_token"\svalue="([^"]+)"/);
    this._token = csrfMatch ? csrfMatch[1] : null;
    if (!this._token) throw new Error('CSRF token not found');

    let cookies = loginPage.headers.getSetCookie();
    let cookie = cookies.map(c => c.split(' ')[0]).join(' ');

    const loginResp = await fetch(`${this._baseUrl}/login`, {
      method: 'POST',
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
        'content-type': 'application/x-www-form-urlencoded',
        'cookie': cookie || ''
      },
      body: new URLSearchParams({
        _token: this._token,
        email: this._user,
        password: this._password
      }),
      redirect: 'manual'
    })

    cookies = loginResp.headers.getSetCookie()
    return cookies.map(c => c.split(' ')[0]).join(' ');
  }

  async check(number: string): Promise<CheckResult> {
    const cookie = await this.login();
    const resp = await fetch(`${this._baseUrl}/user/frauds/check/${number}`, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
        'content-type': 'application/json',
        'cookie': cookie || ''
      },
    });

    const { total_delivered, total_cancelled } = await resp.json();
    const result: CheckResult = {
      total: total_delivered + total_cancelled,
      delivered: total_delivered,
      cancelled: total_cancelled
    }

    return result
  }
}

export { SteadFast, ISteadFast }