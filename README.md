# poeditor-service-provider

[![npm](https://img.shields.io/npm/v/poeditor-service-provider.svg)](https://www.npmjs.com/package/poeditor-service-provider)
[![CircleCI](https://circleci.com/gh/kazupon/poeditor-service-provider.svg?style=svg)](https://circleci.com/gh/kazupon/poeditor-service-provider)

POEditor service provider for [vue-i18n-locale-message](https://github.com/kazupon/vue-i18n-locale-message)

## Usage :rocket:

### Push locale messages to POEditor

configuration:
```json5
{
  "provider": {
    "id": "12345", // your POEditor project id
    "token": "xxx..." // your POEditor API token
  },
  "pushMode": "file-path" // you must set 'file-path'!
}
```

```bash
$ npm install -g vue-i18n-locale-message
$ npm install -g poeditor-service-provider # or npm install --save-dev poeditor-service-provider
$ vue-i18n-locale-message push --provider=poeditor-service-provider \
    --conf ./poeditor-service-provider-conf.json \
    --target-paths=./src/locales/*.json \
    --filename-match=^([\\w]*)\\.json
```

## :copyright: License

[MIT](http://opensource.org/licenses/MIT)
