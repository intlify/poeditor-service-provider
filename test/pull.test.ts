import * as path from 'path'
import factory from '../src/index'
import { ProviderConfiguration } from 'vue-i18n-locale-message'
import { POEditorProviderConfiguration } from '../types'

// ------
// mocks
jest.mock('axios')
import axios from 'axios'

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

test('specify locales', async () => {
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
  axiosMock.post.mockImplementationOnce((url, data, config) => Promise.resolve({
    data: { result: { url: DONWLOAD_URL } }
  }))
  axiosMock.get.mockImplementationOnce(url => Promise.resolve({
    data: [{
      term: 'hello',
      definition: 'こんにちわわわ！'
    }]
  }))
  
  // run
  const conf: ProviderConfiguration<POEditorProviderConfiguration> = {
    provider: {
      token: 'xxx',
      id: '12345',
      interval: 1
    },
    pushMode: 'file-path'
  }
  const provider = factory(conf)
  const resource = await provider.pull(['en', 'ja'], false)

  // verify
  expect(spyLog).toHaveBeenNthCalledWith(1, `fetch 'en' locale messages`)
  expect(spyLog).toHaveBeenNthCalledWith(2, `fetch 'ja' locale messages`)
  expect(resource).toMatchObject({
    en: { hello: 'hello' },
    ja: { hello: 'こんにちわわわ！' }
  })
  expect(axiosMock.get).toHaveBeenCalledTimes(2)
  expect(axiosMock.get).toHaveBeenLastCalledWith(DONWLOAD_URL)
})

test('not specify locales', async () => {
  // mocking ...
  const DONWLOAD_URL = 'https://intlify.dev/locales'
  const axiosMock = axios as jest.Mocked<typeof axios>
  axiosMock.post.mockImplementationOnce((url, data, config) => Promise.resolve({
    data: {result: { languages: [{
      code: 'en'
    }, {
      code: 'ja'
    }]}}
  }))
  axiosMock.post.mockImplementationOnce((url, data, config) => Promise.resolve({
    data: { result: { url: DONWLOAD_URL } }
  }))
  axiosMock.get.mockImplementationOnce(url => Promise.resolve({
    data: [{
      term: 'hello',
      definition: 'hello'
    }]
  }))
  axiosMock.post.mockImplementationOnce((url, data, config) => Promise.resolve({
    data: { result: { url: DONWLOAD_URL } }
  }))
  axiosMock.get.mockImplementationOnce(url => Promise.resolve({
    data: [{
      term: 'hello',
      definition: 'こんにちわわわ！'
    }]
  }))
  
  // run
  const conf: ProviderConfiguration<POEditorProviderConfiguration> = {
    provider: {
      token: 'xxx',
      id: '12345',
      interval: 1
    },
    pushMode: 'file-path'
  }
  const provider = factory(conf)
  const resource = await provider.pull(['en', 'ja'], true)

  // verify
  expect(spyLog).toHaveBeenNthCalledWith(1, '----- POEditorServiceProvider pull dryRun mode -----')
  expect(spyLog).toHaveBeenNthCalledWith(2, `fetch 'en' locale messages`)
  expect(spyLog).toHaveBeenNthCalledWith(3, `fetch 'ja' locale messages`)
  expect(resource).toMatchObject({
    en: { hello: 'hello' },
    ja: { hello: 'こんにちわわわ！' }
  })
  expect(axiosMock.get).toHaveBeenCalledTimes(2)
  expect(axiosMock.get).toHaveBeenLastCalledWith(DONWLOAD_URL)
})
