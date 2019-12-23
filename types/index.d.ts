/**
 *  Provider configuration for vue-i18n-locale-message CLI --conf option
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
  id: string
  token?: string
  interval?: number
}

export type POEditorLocaleMessage = {
  term: string
  definition: string
  context: string
  term_plural: string
  reference: string
  comment: string
}
