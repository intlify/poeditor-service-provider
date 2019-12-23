export function getToken (defaultToken?: string) {
  return process.env.POEDITOR_API_TOKEN || defaultToken
}
