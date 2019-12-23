import * as path from 'path'

// ------
// mocks
jest.mock('axios')
import axios from 'axios'
import { getLocales, exportLocaleMessage, upload } from '../src/api'

// --------------------
// setup/teadown hooks

let spyLog
beforeEach(() => {
  spyLog = jest.spyOn(global.console, 'log')
})

afterEach(() => {
  spyLog.mockRestore()
  jest.clearAllMocks()
})

// -----------
// test cases

test('getLocales', async () => {
  // mocking ...
  const axiosMock = axios as jest.Mocked<typeof axios>
  axiosMock.post.mockImplementationOnce((url, data, config) => Promise.resolve({
    data: {result: { languages: [{
      code: 'en'
    }, {
      code: 'ja'
    }]}}
  }))
  
  // run
  const locales = await getLocales({ token: 'xxx', id: '12345' })

  // verify
  expect(locales).toEqual(['en', 'ja'])
})

test('exportLocaleMessage', async () => {
  // mocking ...
  const DONWLOAD_URL = 'https://intlify.dev/locales'
  const axiosMock = axios as jest.Mocked<typeof axios>
  axiosMock.post.mockImplementationOnce((url, data, config) => Promise.resolve({
    data: { result: { url: DONWLOAD_URL } }
  }))
  axiosMock.get.mockImplementationOnce(url => Promise.resolve({
    data: [{
      term: 'hello',
      definition: 'hello'
    }]
  }))

  const messages = await exportLocaleMessage({ token: 'xxx', id: '12345' }, 'en', 'json')

  expect(messages).toEqual([{
    definition: 'hello',
    term: 'hello'
  }])
  expect(axiosMock.get).toHaveBeenCalledTimes(1)
  expect(axiosMock.get).toHaveBeenLastCalledWith(DONWLOAD_URL)
})

test('upload', async () => {
  // mocking ...
  const axiosMock = axios as jest.Mocked<typeof axios>
  axiosMock.post.mockImplementation((url, data, config) => Promise.resolve({ data: { result: {} } }))

  // run
  const res = await upload({
    locale: 'en',
    path: path.resolve('./test/fixtures/en.json')
  }, {
    token: 'xxx',
    id: '12345'
  })

  // verify
  expect(res).toEqual({ result: {} })
})