import MockAdapter from "axios-mock-adapter";


export default function mockAxios(axios) {
  const mock = new MockAdapter(axios, { delayResponse: 300 });
  return mock;
}
