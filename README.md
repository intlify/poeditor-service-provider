# poeditor-service-provider

[![npm](https://img.shields.io/npm/v/poeditor-service-provider.svg)](https://www.npmjs.com/package/poeditor-service-provider)
[![CircleCI](https://circleci.com/gh/kazupon/poeditor-service-provider.svg?style=svg)](https://circleci.com/gh/kazupon/poeditor-service-provider)

POEditor service provider for [vue-i18n-locale-message](https://github.com/kazupon/vue-i18n-locale-message)


## :cd: Installation

```bash
$ npm install -g poeditor-service-provider # or npm install --save-dev poeditor-service-provider
```

due to use this provider, you need to install vue-i18n-locale-message beforehand.

```bash
$ npm install -g vue-i18n-locale-message
```


## :rocket: Usages

### Configurations

Before you use this provider, you need to configure the following:

```json5
{
  "provider": {
    "id": "12345", // your POEditor project id
    "token": "xxx..." // your POEditor API token
  }
}
```

About details, See the [`POEditorProviderConfiguration`](https://github.com/kazupon/poeditor-service-provider/blob/master/types/index.d.ts).

### Push the locale messages to POEditor

```bash
$ vue-i18n-locale-message push --provider=poeditor-service-provider \
    --conf ./poeditor-service-provider-conf.json \
    --target-paths=./src/locales/*.json \
    --filename-match=^([\\w]*)\\.json
```

### Pull the locale messages from POEditor

```bash
$ vue-i18n-locale-message pull --provider=poeditor-service-provider \
    --conf ./poeditor-service-provider-conf.json \
    --output=./src/locales
```

## :warning: Do you have a hierarchical locale message?

POEditor will process locale messages with hierarchical structure as `context`.

Therefore, we need to normalize with flat structure , and push it to POEditor.

```bash
$ vue-i18n-locale-message push --provider=poeditor-service-provider \
    --conf ./poeditor-service-provider-conf.json \
    --target-paths=./src/locales/*.json \
    --nomalize=flat \
    --filename-match=^([\\w]*)\\.json
```

And also, when pulling data from POEditor, it need to normalize from flat structure to hierarchical structure.

```bash
$ vue-i18n-locale-message pull --provider=poeditor-service-provider \
    --conf ./poeditor-service-provider-conf.json \
    --nomalize=hierarchy \
    --output=./src/locales
```

## :copyright: License

[MIT](http://opensource.org/licenses/MIT)
