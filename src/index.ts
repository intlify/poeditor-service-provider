import * as fs from 'fs'
import qs from 'querystring'
import FormData from 'form-data'
import axios from 'axios'

import {
  Locale,
  Provider,
  PushArguments,
  PullArguments,
  ProviderPullResource,
  ProviderPushFileInfo,
  ProviderConfiguration,
  LocaleMessage
} from 'vue-i18n-locale-message'
import { POEditorProviderConfiguration, POEditorLocaleMessage } from '../types'

import { debug as Debug } from 'debug'
const debug = Debug('poeditor-service-provider')

const POEDITOR_API_BASE_URL = 'https://api.poeditor.com/v2'
const POEDITOR_API_INTERVAL_LIMITATION = 30

async function getLocales (config: POEditorProviderConfiguration) {
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

async function exportLocaleMessage (config: POEditorProviderConfiguration, locale: Locale, format: string) {
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

async function upload (fileInfo: ProviderPushFileInfo, config: POEditorProviderConfiguration) {
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

const factory = (configration: ProviderConfiguration<POEditorProviderConfiguration>): Provider => {
  const id = configration.provider.id
  const token = configration.provider.token
  const interval = configration.provider.interval || 30
  const { pushMode } = configration
  const delay = (sec: number) => new Promise(resolve => { setTimeout(resolve, sec * 1000) })

  const push = async (args: PushArguments): Promise<void> => {
    const { resource, dryRun } = args
    return new Promise(async (resolve, reject) => {
      try {
        debug('provider#push:', resource, dryRun)
        debug(`push mode: config.pushMode=${pushMode}, resouroce.mode=${resource.mode}`)
        if (resource.mode !== pushMode && pushMode !== 'file-path') {
          throw new Error('invalid push mode!')
        }
        dryRun && console.log(`----- POEditorServiceProvider push dryRun mode -----`)
        const results = []
        const files = resource.files || []
        for (const file of files) {
          console.log(`upload '${file.path}' file with '${file.locale}' locale`)
          if (!dryRun) {
            const ret = await upload(file, { token, id })
            debug(`upload file '${file.path}' result`, ret)
            console.log(`wait ${POEDITOR_API_INTERVAL_LIMITATION} sec due to limit Editor API call ...`)
            await delay(interval)
            results.push(ret)
          } else {
            await delay(1)
            results.push(undefined)
          }
        }
        resolve()
      } catch (e) {
        reject(e)
      }
    })
  }

  const pull = async (args: PullArguments): Promise<ProviderPullResource> => {
    const { locales, dryRun } = args
    return new Promise(async (resolve, reject) => {
      dryRun && console.log(`----- POEditorServiceProvider pull dryRun mode -----`)
      const resource = {} as ProviderPullResource

      const fetchLocales = async (locales: Locale[]) => {
        if (locales.length === 0) {
          console.log('fetch locales')
          return await getLocales({ token, id })
        } else {
          return Promise.resolve(locales)
        }
      }

      try {
        const targetLocales = await fetchLocales(locales)
        for (const locale of targetLocales) {
          let message = {} as any // TODO: should be refactored LocaleMessage type definition
          console.log(`fetch '${locale}' locale messages`)
          const poeditorLocaleMessages = await exportLocaleMessage({ token, id }, locale, 'json')
          message = poeditorLocaleMessages.reduce((mesasge, m) => {
            message[m.term] = m.definition || ''
            return mesasge
          }, message)
          resource[locale] = message as LocaleMessage
        }
        debug('normalized resource', resource)

        resolve(resource)
      } catch (e) {
        reject(e)
      }
    })
  }

  return { push, pull } as Provider
}

export default factory
