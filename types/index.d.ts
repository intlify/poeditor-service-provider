import { Locale } from 'vue-i18n-locale-message'

/**
 *  POEditor Provider configuration for vue-i18n-locale-message CLI --conf option
 *  e.g.
 *    {
 *      "provider": {
 *        "token": "xxx",
 *        "id": "12345"
 *      },
 *      "pushMode": "file-path"
 *    }
 */
export type POEditorProviderConfiguration = {
  /**
   *  project id
   */
  id: string
  /**
   *  API token.
   *  if it's ommitted, use the value of `POEDITOR_API_TOKEN` ENV.
   */
  token?: string
  /**
   *  API call interval (due to limit for API calling, see https://poeditor.com/docs/api_rates).
   *  if it's omitted, internally set 30 sec as default.
   */
  interval?: number
  /**
   *  Normalize locale messages file indend, default indent 2 space
   */
  indent?: number
}

export type POEditorLocaleMessage = {
  term: string
  definition: string
  context: string
  term_plural: string
  reference: string
  comment: string
}

export type UploadFileInfo = {
  locale: Locale
  path: string
}
