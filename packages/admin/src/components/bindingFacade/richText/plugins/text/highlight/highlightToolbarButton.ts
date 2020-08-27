import { ToolbarButton } from '../../../toolbars'
import { highlightMark } from './withHighlight'

export const highlightToolbarButton: ToolbarButton = {
	marks: { [highlightMark]: true },
	label: 'Highlight',
	title: 'Highlight',
	blueprintIcon: 'highlight',
}
