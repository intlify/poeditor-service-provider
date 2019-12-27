import * as path from 'path'
import provider from '../src/provider'
import en from './fixtures/nest/en.json'
import ja from './fixtures/nest/ja.json'

// ------
// mocks
jest.mock('../src/api')
import * as api from '../src/api'

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
  const p = provider('12345', 'xxx',  1, 2)
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
  const p = provider('12345', 'xxx', 'file-path', 1 ,2)
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
