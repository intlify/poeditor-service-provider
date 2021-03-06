import { unflatten } from 'flat'
import { delay, getUploadFiles, getUploadFilesWithRaw } from './utils'
import {
  Locale,
  Provider,
  PushArguments,
  PullArguments,
  StatusArguments,
  ImportArguments,
  ExportArguments,
  RawLocaleMessage,
  LocaleMessage,
  LocaleMessages,
  TranslationStatus
} from 'vue-i18n-locale-message'
import {
  upload,
  getLocales,
  getTranslationStatus,
  exportRawLocaleMessage,
  exportLocaleMessage
} from './api'

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

    if (normalize && normalize !== 'flat') {
      return Promise.reject(new Error(`support nomalization format 'flat' only`))
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

    return Promise.resolve()
  }

  /**
   *  pull
   */
  const pull = async (args: PullArguments): Promise<LocaleMessages> => {
    const { locales, dryRun, normalize, format } = args

    dryRun && console.log(`----- POEditorServiceProvider pull dryRun mode -----`)
    const messages = {} as LocaleMessages

    if (normalize && normalize !== 'hierarchy') {
      return Promise.reject(new Error(`support nomalization format 'hierarchy' only`))
    }

    const fetchLocales = async (locales: Locale[]) => {
      if (locales.length === 0) {
        console.log('fetch locales')
        return await getLocales({ token, id })
      } else {
        return Promise.resolve(locales)
      }
    }

    const targetLocales = await fetchLocales(locales)
    for (const locale of targetLocales) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let message = {} as any // TODO: should be refactored LocaleMessage type definition
      console.log(`fetch '${locale}' locale messages`)
      const poeditorLocaleMessages = await exportLocaleMessage({ token, id }, locale, format)
      message = poeditorLocaleMessages.reduce((mesasge, m) => {
        message[m.term] = m.definition || ''
        return mesasge
      }, message)
      messages[locale] = (!normalize ? message : unflatten(message, { object: true })) as LocaleMessage
    }
    debug('fetch locale messages', messages)

    return Promise.resolve(messages)
  }

  /**
   *  status
   */
  const status = async (args: StatusArguments): Promise<TranslationStatus[]> => {
    const { locales } = args
    const translationStatus = await getTranslationStatus({ token, id })
    return Promise.resolve(
      locales.length === 0
        ? translationStatus
        : translationStatus.filter(st => locales.includes(st.locale))
    )
  }

  /**
   *  import
   */
  const _import = async (args: ImportArguments): Promise<void> => {
    const { messages, dryRun } = args

    dryRun && console.log(`----- POEditorServiceProvider import dryRun mode -----`)
    const results = []
    const files = await getUploadFilesWithRaw(messages, dryRun)

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

    return Promise.resolve()
  }

  /**
   *  export
   */
  const _export = async (args: ExportArguments): Promise<RawLocaleMessage[]> => {
    const { locales, dryRun, format } = args

    dryRun && console.log(`----- POEditorServiceProvider export dryRun mode -----`)
    const messages = [] as RawLocaleMessage[]

    const fetchLocales = async (locales: Locale[]) => {
      if (locales.length === 0) {
        console.log('fetch locales')
        return await getLocales({ token, id })
      } else {
        return Promise.resolve(locales)
      }
    }

    const targetLocales = await fetchLocales(locales)
    for (const locale of targetLocales) {
      console.log(`fetch '${locale}' raw locale messages`)
      const message = await exportRawLocaleMessage({ token, id }, locale, format)
      messages.push(message)
    }
    debug('raw locale messages', messages)

    return Promise.resolve(messages)
  }

  return { push, pull, status, import: _import, export: _export } as Provider
}
