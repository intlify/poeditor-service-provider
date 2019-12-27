import { unflatten } from 'flat'
import { delay, getUploadFiles } from './utils'
import {
  Locale,
  Provider,
  PushArguments,
  PullArguments,
  LocaleMessage,
  LocaleMessages
} from 'vue-i18n-locale-message'
import { upload, getLocales, exportLocaleMessage } from './api'

import { debug as Debug } from 'debug'
const debug = Debug('poeditor-service-provider:provider')

const POEDITOR_API_INTERVAL_LIMITATION = 30

export default function provider (
  id: string,
  token: string,
  interval: number,
  indent: number
): Provider {
  /**
   *  push
   */
  const push = async (args: PushArguments): Promise<void> => {
    const { messages, dryRun, normalize } = args

    return new Promise(async (resolve, reject) => {
      try {
        debug('provider#push:', messages, dryRun)

        if (normalize && normalize !== 'flat') {
          return reject(new Error(`support nomalization format 'flat' only`))
        }

        dryRun && console.log(`----- POEditorServiceProvider push dryRun mode -----`)
        const results = []
        const files = await getUploadFiles(messages, indent, dryRun, normalize)

        for (const file of files) {
          console.log(`upload '${file.locale}' locale`)
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
  const pull = async (args: PullArguments): Promise<LocaleMessages> => {
    const { locales, dryRun, normalize } = args

    return new Promise(async (resolve, reject) => {
      dryRun && console.log(`----- POEditorServiceProvider pull dryRun mode -----`)
      const messages = {} as LocaleMessages

      if (normalize && normalize !== 'hierarchy') {
        return reject(new Error(`support nomalization format 'hierarchy' only`))
      }

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
          messages[locale] = (!normalize ? message : unflatten(message)) as LocaleMessage
        }
        debug('fetch locale messages', messages)

        resolve(messages)
      } catch (e) {
        reject(e)
      }
    })
  }

  return { push, pull } as Provider
}
