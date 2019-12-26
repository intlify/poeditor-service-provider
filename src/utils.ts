import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'
import { flatten } from 'flat'
import tmp from 'tmp-promise'

import { UploadFileInfo } from '../types'
import { ProviderPushFileInfo } from 'vue-i18n-locale-message'

import { debug as Debug } from 'debug'
const debug = Debug('poeditor-service-provider:utils')

const readFilePromisify = promisify(fs.readFile)
const writeFilePromisify = promisify(fs.writeFile)

export function getToken (defaultToken?: string) {
  return process.env.POEDITOR_API_TOKEN || defaultToken
}

export const delay = (sec: number) => {
  return new Promise(resolve => { setTimeout(resolve, sec * 1000) })
}

export async function getUploadFiles (orgFiles: ProviderPushFileInfo[], indent: number, normalize?: string) {
  if (!normalize) {
    return Promise.resolve(orgFiles as UploadFileInfo[])
  } else {
    return new Promise<UploadFileInfo[]>(async (resolve, reject) => {
      try {
        const retDir = await tmp.dir()

        const retFiles = [] as UploadFileInfo[]
        for (const file of orgFiles) {
          const orgData = await readFilePromisify(file.path)
          const orgJSON = JSON.parse(orgData.toString())
          const frattedJSON = flatten(orgJSON)
          const parsedOrgFile = path.parse(file.path)
          const tmpFilePath = path.resolve(retDir.path, parsedOrgFile.base)
          await writeFilePromisify(tmpFilePath, JSON.stringify(frattedJSON, null, indent))
          debug(`normalize locale messages: ${file.path} -> ${tmpFilePath}`)
          retFiles.push({ locale: file.locale, path: tmpFilePath })
        }

        resolve(retFiles)
      } catch (e) {
        reject(e)
      }
    })
  }
}
