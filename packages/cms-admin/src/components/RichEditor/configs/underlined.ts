import { simpleMarkConfig } from './utils'
import { createSpanWithStyleRule } from './html'

export const UNDERLINED = simpleMarkConfig(
	'underlined',
	['u'],
	createSpanWithStyleRule('underlined', style => ['underline'].includes(style.textDecoration || ''))
)
