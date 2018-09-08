import { simpleMarkConfig } from './utils'

export { Config } from './utils'
export const BOLD = simpleMarkConfig('bold', ['strong', 'b'])
export const ITALIC = simpleMarkConfig('italic', ['em', 'i'])
export const UNDERLINED = simpleMarkConfig('underlined', ['u'])
export { LINK } from './link'
