export function getToken (defaultToken?: string) {
  return process.env.POEDITOR_API_TOKEN || defaultToken
}

export const delay = (sec: number) => new Promise(resolve => { setTimeout(resolve, sec * 1000) })
