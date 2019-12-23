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

test('API call', async () => {
  // resources
  const enResource = path.resolve('./test/fixtures/en.json')
  const jaResource = path.resolve('./test/fixtures/ja.json')

  // mocking ...
  const axiosMock = axios as jest.Mocked<typeof axios>
  axiosMock.post.mockImplementation((url, data, config) => Promise.resolve({ data: {} }))

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
  await provider.push({
    resource: {
      mode: conf.pushMode,
      files: [{
        locale: 'en',
        path: path.resolve('./test/fixtures/en.json')
      }, {
        locale: 'ja',
        path: path.resolve('./test/fixtures/ja.json')
      }]
    },
    dryRun: false
  })

  // verify
  expect(spyLog).toHaveBeenNthCalledWith(1, `upload '${enResource}' file with 'en' locale`)
  expect(spyLog).toHaveBeenNthCalledWith(2, 'wait 30 sec due to limit Editor API call ...')
  expect(spyLog).toHaveBeenNthCalledWith(3, `upload '${jaResource}' file with 'ja' locale`)
  expect(spyLog).toHaveBeenNthCalledWith(4, 'wait 30 sec due to limit Editor API call ...')
})

test('dryRun mode', async () => {
  // run
  const conf: ProviderConfiguration<POEditorProviderConfiguration> = {
    provider: {
      token: 'xxx',
      id: '12345'
    },
    pushMode: 'file-path'
  }
  const provider = factory(conf)
  await provider.push({
    resource: {
      mode: conf.pushMode,
      files: [{
        locale: 'en',
        path: '/path/to/project/src/locales/en.json'
      }]
    },
    dryRun: true
  })

  // verify
  expect(spyLog).toHaveBeenNthCalledWith(1, '----- POEditorServiceProvider push dryRun mode -----')
  expect(spyLog).toHaveBeenNthCalledWith(2, "upload '/path/to/project/src/locales/en.json' file with 'en' locale")
})
