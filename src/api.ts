import * as fs from 'fs'
import qs, { ParsedUrlQueryInput } from 'querystring'
import FormData from 'form-data'
import axios from 'axios'

import { debug as Debug } from 'debug'
const debug = Debug('poeditor-service-provider:api')

import { Locale, TranslationStatus, RawLocaleMessage } from 'vue-i18n-locale-message'
import {
  POEditorProviderConfiguration,
  POEditorLocaleMessage,
  POEditorLanguage,
  UploadFileInfo
} from '../types'

const POEDITOR_API_BASE_URL = 'https://api.poeditor.com/v2'

async function getLanguageList (config: POEditorProviderConfiguration) {
  return new Promise<POEditorLanguage[]>((resolve, reject) => {
    if (!config.token) { return reject(new Error('invalid `config.token` param')) }
    const data: ParsedUrlQueryInput = {
      api_token: config.token, // eslint-disable-line
      id: config.id
    }
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
    axios.post(`${POEDITOR_API_BASE_URL}/languages/list`, qs.stringify(data), { headers })
      .then(res => {
        const languages = res.data.result.languages as POEditorLanguage[]
        debug('fetch languages:', languages)
        resolve(languages)
      })
  })
}

export async function getLocales (config: POEditorProviderConfiguration) {
  const languages = await getLanguageList(config)
  return languages.map(lang => lang.code as Locale) as Locale[]
}

export async function getTranslationStatus (config: POEditorProviderConfiguration) {
  const languages = await getLanguageList(config)
  return languages.map(lang => ({ locale: lang.code, percentage: lang.percentage })) as TranslationStatus[]
}

export async function exportRawLocaleMessage (config: POEditorProviderConfiguration, locale: Locale, format: string) {
  const download = async (url: string): Promise<any> => { // eslint-disable-line
    return new Promise(resolve => {
      axios.get(url)
        .then(res => {
          debug('donwload:', res.data)
          resolve(res.data)
        })
    })
  }

  return new Promise<RawLocaleMessage>((resolve, reject) => {
    if (!config.token) { return reject(new Error('invalid `config.token` param')) }
    const data: ParsedUrlQueryInput = {
      api_token: config.token, // eslint-disable-line
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
        resolve({
          locale,
          format,
          data: Buffer.from(raw, 'utf-8')
        })
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

  return new Promise<POEditorLocaleMessage[]>((resolve, reject) => {
    if (!config.token) { return reject(new Error('invalid `config.token` param')) }
    const data: ParsedUrlQueryInput = {
      api_token: config.token, // eslint-disable-line
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

export async function upload (fileInfo: UploadFileInfo, config: POEditorProviderConfiguration) {
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
