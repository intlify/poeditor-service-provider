import * as path from 'path'
import provider from '../src/provider'

// ------
// mocks
jest.mock('../src/api')
import * as api from '../src/api'
import { POEditorLocaleMessage } from '../types'

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

test('push method', async () => {
  // resources
  const enResource = path.resolve('./test/fixtures/en.json')
  const jaResource = path.resolve('./test/fixtures/ja.json')

  // mocking ...
  const apiMock = api as jest.Mocked<typeof api>
  apiMock.upload.mockImplementation((file, config) => Promise.resolve({ data: {} }))

  // run
  const p = provider('12345', 'xxx', 'file-path', 1)
  await p.push({
    resource: {
      mode: 'file-path',
      files: [{
        locale: 'en',
        path: enResource
      }, {
        locale: 'ja',
        path: jaResource
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

test('push method: dryRun mode', async () => {
  // mocking ...
  const apiMock = api as jest.Mocked<typeof api>
  apiMock.upload.mockImplementation((file, config) => Promise.resolve({ data: {} }))

  // run
  const p = provider('12345', 'xxx', 'file-path', 1)
  await p.push({
    resource: {
      mode: 'file-path',
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

test('pull method', async () => {
  // mocking ...
  const apiMock = api as jest.Mocked<typeof api>
  apiMock.exportLocaleMessage.mockImplementationOnce(({ token, id }, locale, format) => Promise.resolve([{
    term: 'hello',
    definition: 'hello',
    context: '',
    term_plural: '',
    reference: '',
    comment: ''
  }]))
  apiMock.exportLocaleMessage.mockImplementationOnce(({ token, id }, locale, format) => Promise.resolve([{
    term: 'hello',
    definition: 'こんにちわわわ！',
    context: '',
    term_plural: '',
    reference: '',
    comment: ''
  }]))

  // run
  const p = provider('12345', 'xxx', 'file-path', 1)
  const resource = await p.pull({ locales: ['en', 'ja'], dryRun: false })
  expect(spyLog).toHaveBeenNthCalledWith(1, `fetch 'en' locale messages`)
  expect(spyLog).toHaveBeenNthCalledWith(2, `fetch 'ja' locale messages`)
  expect(resource).toMatchObject({
    en: { hello: 'hello' },
    ja: { hello: 'こんにちわわわ！' }
  })
})

test('pull method: not specify locales', async () => {
  // mocking ...
  const apiMock = api as jest.Mocked<typeof api>
  apiMock.getLocales.mockImplementation(({ token, id }) => Promise.resolve(['en', 'ja']))
  apiMock.exportLocaleMessage.mockImplementationOnce(({ token, id }, locale, format) => Promise.resolve([{
    term: 'hello',
    definition: 'hello',
    context: '',
    term_plural: '',
    reference: '',
    comment: ''
  }]))
  apiMock.exportLocaleMessage.mockImplementationOnce(({ token, id }, locale, format) => Promise.resolve([{
    term: 'hello',
    definition: 'こんにちわわわ！',
    context: '',
    term_plural: '',
    reference: '',
    comment: ''
  }]))

  // run
  const p = provider('12345', 'xxx', 'file-path', 1)
  const resource = await p.pull({ locales: [], dryRun: true})
  expect(spyLog).toHaveBeenNthCalledWith(1, '----- POEditorServiceProvider pull dryRun mode -----')
  expect(spyLog).toHaveBeenNthCalledWith(2, `fetch locales`)
  expect(spyLog).toHaveBeenNthCalledWith(3, `fetch 'en' locale messages`)
  expect(spyLog).toHaveBeenNthCalledWith(4, `fetch 'ja' locale messages`)
  expect(resource).toMatchObject({
    en: { hello: 'hello' },
    ja: { hello: 'こんにちわわわ！' }
  })
})
