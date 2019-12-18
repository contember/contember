import { simpleMarkConfig } from './utils'
import { createSpanWithStyleRule } from './html'

export const ITALIC = simpleMarkConfig(
	'italic',
	['em', 'i'],
	createSpanWithStyleRule('italic', style => ['italic', 'oblique'].includes(style.fontStyle || '')),
)
