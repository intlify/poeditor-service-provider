import { getToken } from '../src/utils'

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

test('token: return env token', () => {
  // setup
  process.env.POEDITOR_API_TOKEN = 'POEDITOR_API_TOKEN'

  expect(getToken('xxx')).toEqual('POEDITOR_API_TOKEN')
})


test('token: retgurn param token', () => {
  expect(getToken('xxx')).toEqual('xxx')
})
