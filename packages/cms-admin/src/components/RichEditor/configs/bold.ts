import { simpleMarkConfig } from './utils'
import { createSpanWithStyleRule } from './html'

export const BOLD = simpleMarkConfig(
	'bold',
	['strong', 'b'],
	createSpanWithStyleRule('bold', style => ['bold', '700', '800', '900'].includes(style.fontWeight || '')),
	'mod+b',
)
