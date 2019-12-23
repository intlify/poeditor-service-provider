import factory from '../src/factory'
import { ProviderConfiguration } from 'vue-i18n-locale-message'
import { POEditorProviderConfiguration } from '../types'

// ------
// mocks
jest.mock('../src/provider')
import provider from '../src/provider'

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

test('basic', () => {
  // mocking ...
  const providerMock = provider as jest.MockedFunction<typeof provider>
  providerMock.mockReturnValue({ push: jest.fn(), pull: jest.fn() })
  
  // run
  const conf: ProviderConfiguration<POEditorProviderConfiguration> = {
    provider: {
      token: 'xxx',
      id: '12345',
      interval: 1
    },
    pushMode: 'file-path'
  }
  factory(conf)

  // verify
  expect(providerMock).toHaveBeenCalledWith('12345', 'xxx', 'file-path', 1)
})

test('env token', () => {
  // mocking ...
  process.env.POEDITOR_API_TOKEN = 'POEDITOR_API_TOKEN'
  const providerMock = provider as jest.MockedFunction<typeof provider>
  providerMock.mockReturnValue({ push: jest.fn(), pull: jest.fn() })
  
  // run
  const conf: ProviderConfiguration<POEditorProviderConfiguration> = {
    provider: {
      token: 'xxx',
      id: '12345'
    },
    pushMode: 'file-path'
  }
  factory(conf)

  // verify
  expect(providerMock).toHaveBeenCalledWith('12345', 'POEDITOR_API_TOKEN', 'file-path', 30)
})
