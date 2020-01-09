import * as path from 'path'
import provider from '../src/provider'
import en from './fixtures/nest/en.json'
import ja from './fixtures/nest/ja.json'

import { RawLocaleMessage } from 'vue-i18n-locale-message'

// ------
// mocks
jest.mock('../src/api')
import * as api from '../src/api'

jest.mock('../src/utils', () => ({
  ...jest.requireActual('../src/utils'),
  getUploadFilesWithRaw: jest.fn()
}))
import * as utils from '../src/utils'

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
  // mocking ...
  const apiMock = api as jest.Mocked<typeof api>
  apiMock.upload.mockImplementation((file, config) => Promise.resolve({ data: {} }))

  // run
  const p = provider('12345', 'xxx', 1, 2)
  await p.push({ messages: { en, ja }, dryRun: false })

  // verify
  expect(spyLog).toHaveBeenNthCalledWith(3, `upload 'en' locale`)
  expect(spyLog).toHaveBeenNthCalledWith(4, 'wait 30 sec due to limit Editor API call ...')
  expect(spyLog).toHaveBeenNthCalledWith(5, `upload 'ja' locale`)
  expect(spyLog).toHaveBeenNthCalledWith(6, 'wait 30 sec due to limit Editor API call ...')
})

test('push method: dryRun mode', async () => {
  // mocking ...
  const apiMock = api as jest.Mocked<typeof api>
  apiMock.upload.mockImplementation((file, config) => Promise.resolve({ data: {} }))

  // run
  const p = provider('12345', 'xxx', 1, 2)
  await p.push({ messages: { en, ja }, dryRun: true })

  // verify
  expect(spyLog).toHaveBeenNthCalledWith(1, '----- POEditorServiceProvider push dryRun mode -----')
  expect(spyLog).toHaveBeenNthCalledWith(4, "upload 'en' locale")
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
  const p = provider('12345', 'xxx', 1, 2)
  const resource = await p.pull({ locales: ['en', 'ja'], dryRun: false })

  // verify
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
  const p = provider('12345', 'xxx', 'file-path', 1 ,2)
  const resource = await p.pull({ locales: [], dryRun: true})

  // verify
  expect(spyLog).toHaveBeenNthCalledWith(1, '----- POEditorServiceProvider pull dryRun mode -----')
  expect(spyLog).toHaveBeenNthCalledWith(2, `fetch locales`)
  expect(spyLog).toHaveBeenNthCalledWith(3, `fetch 'en' locale messages`)
  expect(spyLog).toHaveBeenNthCalledWith(4, `fetch 'ja' locale messages`)
  expect(resource).toMatchObject({
    en: { hello: 'hello' },
    ja: { hello: 'こんにちわわわ！' }
  })
})

test('status method', async () => {
  // mocking ...
  const apiMock = api as jest.Mocked<typeof api>
  apiMock.getTranslationStatus.mockImplementationOnce(({ token, id }) => Promise.resolve([{
    locale: 'en',
    percentage: 100
  }, {
    locale: 'ja',
    percentage: 72
  }]))

  // run
  const p = provider('12345', 'xxx', 1, 2)
  const resource = await p.status({ locales: [] })

  // verify
  expect(resource).toMatchObject([{
    locale: 'en',
    percentage: 100
  }, {
    locale: 'ja',
    percentage: 72
  }])
})

test('status method: specified locals', async () => {
  // mocking ...
  const apiMock = api as jest.Mocked<typeof api>
  apiMock.getTranslationStatus.mockImplementationOnce(({ token, id }) => Promise.resolve([{
    locale: 'en',
    percentage: 100
  }, {
    locale: 'ja',
    percentage: 72
  }]))

  // run
  const p = provider('12345', 'xxx', 1, 2)
  const resource = await p.status({ locales: ['ja'] })

  // verify
  expect(resource).toMatchObject([{
    locale: 'ja',
    percentage: 72
  }])
})

test('import method', async () => {
  const messages = [{
    locale: 'en',
    format: 'json',
    data: Buffer.from(JSON.stringify(en))
  }, {
    locale: 'ja',
    format: 'json',
    data: Buffer.from(JSON.stringify(ja))
  }] as RawLocaleMessage[]

  // mocking ...
  const utilsMock = utils as jest.Mocked<typeof utils>
  utils.getUploadFilesWithRaw.mockImplementation((messages, dryRun) => {
    return messages.map(({ locale }) => ({ locale, path: `/path/${locale}.json` }))
  })
  const apiMock = api as jest.Mocked<typeof api>
  apiMock.upload.mockImplementation((file, config) => Promise.resolve({ data: {} }))

  // run
  const p = provider('12345', 'xxx', 1, 2)
  await p.import({ messages, dryRun: false })

  // verify
  expect(apiMock.upload).toHaveBeenCalledWith({ locale: 'en', path: '/path/en.json' }, { id: '12345', token: 'xxx' })
  expect(apiMock.upload).toHaveBeenCalledWith({ locale: 'ja', path: '/path/ja.json' }, { id: '12345', token: 'xxx' })
})
