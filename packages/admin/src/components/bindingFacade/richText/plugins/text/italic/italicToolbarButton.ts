import { ToolbarButtonSpec } from '../../../toolbars'
import { italicMark } from './withItalic'

export const italicToolbarButton: ToolbarButtonSpec = {
	marks: { [italicMark]: true },
	label: 'Italic',
	title: 'Italic',
	blueprintIcon: 'italic',
}
