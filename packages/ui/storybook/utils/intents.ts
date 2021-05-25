import type { Intent } from '../../src/types'

export const intents: Intent[] = ['primary', 'secondary', 'tertiary', 'success', 'warn', 'danger', 'dark']

export const allIntents = Array<undefined | Intent>(undefined).concat(intents)
