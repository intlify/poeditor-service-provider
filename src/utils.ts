import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'
import { flatten } from 'flat'
import tmp from 'tmp-promise'

import { UploadFileInfo } from '../types'
import { LocaleMessages, Locale } from 'vue-i18n-locale-message'

const readFilePromisify = promisify(fs.readFile)
const writeFilePromisify = promisify(fs.writeFile)

export function getToken (defaultToken?: string) {
  return process.env.POEDITOR_API_TOKEN || defaultToken
}

export const delay = (sec: number) => {
  return new Promise(resolve => { setTimeout(resolve, sec * 1000) })
}

async function saveToTmp (messages: LocaleMessages, indent: number, dryRun: boolean) {
  return new Promise<UploadFileInfo[]>(async (resolve, reject) => {
    const files = [] as UploadFileInfo[]
    let dir = null
    try {
      dir = await tmp.dir()
      const locales = Object.keys(messages) as Locale[]
      for (const locale of locales) {
        const tmpFilePath = path.resolve(dir.path, `${locale}.json`)
        console.log(`save locale message to tmp: ${tmpFilePath}`)
        if (!dryRun) {
          await writeFilePromisify(tmpFilePath, JSON.stringify(messages[locale], null, indent))
        }
        files.push({ locale: locale, path: tmpFilePath })
      }
      resolve(files)
    } catch (e) {
      reject(e)
    } finally {
      dryRun && dir?.cleanup()
    }
  })
}

export async function getUploadFiles (messages: LocaleMessages, indent: number, dryRun: boolean, normalize?: string) {
  return new Promise<UploadFileInfo[]>(async (resolve, reject) => {
    let dir = null
    try {
      const files = await saveToTmp(messages, indent, dryRun)
      if (!normalize) {
        return resolve(files)
      } else {
        dir = await tmp.dir()
        const normalizedFiles = [] as UploadFileInfo[]
        for (const file of files) {
          const orgData = await readFilePromisify(file.path)
          const orgJSON = JSON.parse(orgData.toString())
          const frattedJSON = flatten(orgJSON)
          const parsedOrgFile = path.parse(file.path)
          const tmpFilePath = path.resolve(dir.path, parsedOrgFile.base)
          console.log(`normalize locale messages: ${file.path} -> ${tmpFilePath}`)
          if (!dryRun) {
            await writeFilePromisify(tmpFilePath, JSON.stringify(frattedJSON, null, indent))
          }
          normalizedFiles.push({ locale: file.locale, path: tmpFilePath })
        }
        resolve(normalizedFiles)
      }
    } catch (e) {
      reject(e)
    } finally {
      dryRun && dir?.cleanup()
    }
  })
}
