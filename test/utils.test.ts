import * as path from 'path'
import { unflatten } from 'flat'
import { getToken, getUploadFiles } from '../src/utils'
import { ProviderPushFileInfo } from 'vue-i18n-locale-message'
import en from './fixtures/nest/en.json'
import ja from './fixtures/nest/ja.json'

// ------
// mocks

// fs module
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFile: jest.fn(),
  writeFile: jest.fn()
}))
import fs from 'fs'

// --------------------
// setup/teadown hooks

let orgEnv
beforeEach(() => {
  orgEnv = process.env
})

afterEach(() => {
  delete process.env.POEDITOR_API_TOKEN
  process.env = orgEnv
  jest.clearAllMocks()
})

// -----------
// test cases

test('getToken: return env token', () => {
  // setup
  process.env.POEDITOR_API_TOKEN = 'POEDITOR_API_TOKEN'

  expect(getToken('xxx')).toEqual('POEDITOR_API_TOKEN')
})

test('getToken: return param token', () => {
  expect(getToken('xxx')).toEqual('xxx')
})

test('getUploadFiles: no normalization', async () => {
  const files = [{
    locale: 'en',
    path: '/path/to/src/locales/en.json'
  }, {
    locale: 'ja',
    path: '/path/to/src/locales/ja.json'
  }] as ProviderPushFileInfo[]

  const uploadFiles = await getUploadFiles(files, 2)
  expect(uploadFiles).toEqual(expect.arrayContaining(files))
})

test('getUploadFiles: normalization', async () => {
  const files = [{
    locale: 'en',
    path: '/path/to/src/locales/en.json'
  }, {
    locale: 'ja',
    path: '/path/to/src/locales/ja.json'
  }] as ProviderPushFileInfo[]
  const readFiles = { en, ja }
  const writeFiles = {}

  // mocking ...
  const mockFS = fs as jest.Mocked<typeof fs>
  mockFS.readFile.mockImplementationOnce((p, cb) => cb(null, Buffer.from(JSON.stringify(en), 'utf-8')))
  mockFS.readFile.mockImplementationOnce((p, cb) => cb(null, Buffer.from(JSON.stringify(ja), 'utf-8')))
  mockFS.writeFile.mockImplementation((p, data, cb) => {
    writeFiles[p as string] = data
    cb(null)
  })


  const uploadFiles = await getUploadFiles(files, 2, 'flat')
  uploadFiles.forEach(file => {
    const orgData = readFiles[file.locale]
    const normalizeData = unflatten(JSON.parse(writeFiles[file.path]))
    expect(orgData).toMatchObject(normalizeData)
  })
})