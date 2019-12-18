import * as fs from 'fs'
import FormData from 'form-data'
import axios from 'axios'

import {
  Provider,
  ProviderPushResource,
  ProviderPushFileInfo,
  ProviderConfiguration
} from 'vue-i18n-locale-message'
import { POEditorProviderConfiguration } from '../types'

import { debug as Debug } from 'debug'
const debug = Debug('poeditor-service-provider')

const POEDITOR_API_BASE_URL = 'https://api.poeditor.com/v2'
const POEDITOR_API_INTERVAL_LIMITATION = 30

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

  const push = async (resouroce: ProviderPushResource, dryRun: boolean): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        debug('provider#push:', resouroce, dryRun)
        debug(`push mode: config.pushMode=${pushMode}, resouroce.mode=${resouroce.mode}`)
        if (resouroce.mode !== pushMode && pushMode !== 'file-path') {
          throw new Error('invalid push mode!')
        }
        dryRun && console.log(`dryRun mode ...`)
        const results = []
        const files = resouroce.files || []
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

  return { push } as Provider
}

export default factory
