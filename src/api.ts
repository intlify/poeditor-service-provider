import * as fs from 'fs'
import qs from 'querystring'
import FormData from 'form-data'
import axios from 'axios'

import { debug as Debug } from 'debug'
const debug = Debug('poeditor-service-provider:api')

import {
  Locale,
  ProviderPushFileInfo
} from 'vue-i18n-locale-message'
import { POEditorProviderConfiguration, POEditorLocaleMessage } from '../types'

const POEDITOR_API_BASE_URL = 'https://api.poeditor.com/v2'

export async function getLocales (config: POEditorProviderConfiguration) {
  return new Promise<Locale[]>(resolve => {
    const data = {
      api_token: config.token,
      id: config.id
    }
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
    axios.post(`${POEDITOR_API_BASE_URL}/languages/list`, qs.stringify(data), { headers })
      .then(res => {
        const locales = res.data.result.languages.map((lang: any) => lang.code as Locale) as Locale[]
        debug('fetch locales:', locales)
        resolve(locales)
      })
  })
}

export async function exportLocaleMessage (config: POEditorProviderConfiguration, locale: Locale, format: string) {
  const download = async (url: string): Promise<POEditorLocaleMessage[]> => {
    return new Promise(resolve => {
      axios.get(url)
        .then(res => {
          debug('donwload:', res.data)
          resolve(res.data as POEditorLocaleMessage[])
        })
    })
  }

  return new Promise<POEditorLocaleMessage[]>(resolve => {
    const data = {
      api_token: config.token,
      id: config.id,
      language: locale,
      type: format
    }
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
    axios.post(`${POEDITOR_API_BASE_URL}/projects/export`, qs.stringify(data), { headers })
      .then(async (res) => {
        const url = res.data.result.url as string
        debug('/projects/export url:', url)
        const raw = await download(url)
        resolve(raw)
      })
  })
}

export async function upload (fileInfo: ProviderPushFileInfo, config: POEditorProviderConfiguration) {
  return new Promise(resolve => {
    const file = fs.createReadStream(fileInfo.path)
    const data = new FormData()
    data.append('file', file)
    data.append('api_token', config.token)
    data.append('id', config.id)
    data.append('language', fileInfo.locale)
    data.append('updating', 'terms_translations')
    data.append('overwrite', '1')
    data.append('sync_terms', '1')
    const formHeader = data.getHeaders()
    axios
      .post(`${POEDITOR_API_BASE_URL}/projects/upload`, data, { headers: { ...formHeader }})
      .then(ret => resolve(ret.data))
  })
}
