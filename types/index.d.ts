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
  token: string
  id: string
  interval?: number
}
