import { getToken } from './utils'
import provider from './provider'

import {
  Provider,
  ProviderConfiguration
} from 'vue-i18n-locale-message'
import { POEditorProviderConfiguration } from '../types'

const factory = (configration: ProviderConfiguration<POEditorProviderConfiguration>): Provider => {
  const id = configration.provider.id
  const token = getToken(configration.provider.token)
  const interval = configration.provider.interval || 30
  const indent = configration.provider.indent || 2

  if (!token) {
    throw new Error('not specified token!')
  }

  return provider(id, token, interval, indent)
}

export default factory
