import type { ToolbarButtonSpec } from '../../../toolbars'
import { highlightMark } from './withHighlight'

export const highlightToolbarButton: ToolbarButtonSpec = {
	marks: { [highlightMark]: true },
	label: 'Highlight',
	title: 'Highlight',
	blueprintIcon: 'highlight',
}
