import { delay } from './utils'
import {
  Locale,
  Provider,
  PushArguments,
  PullArguments,
  ProviderPushMode,
  ProviderPullResource,
  LocaleMessage
} from 'vue-i18n-locale-message'
import { upload, getLocales, exportLocaleMessage } from './api'

import { debug as Debug } from 'debug'
const debug = Debug('poeditor-service-provider:provider')

const POEDITOR_API_INTERVAL_LIMITATION = 30

export default function provider (id: string, token: string, pushMode: ProviderPushMode, interval: number): Provider {
  /**
   *  push
   */
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

  /**
   *  pull
   */
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
