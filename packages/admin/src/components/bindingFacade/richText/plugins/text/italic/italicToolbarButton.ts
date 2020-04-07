import { ToolbarButton } from '../../../toolbars'
import { italicMark } from './withItalic'

export const italicToolbarButton: ToolbarButton = {
	marks: { [italicMark]: true },
	label: 'Italic',
	title: 'Italic',
	blueprintIcon: 'italic',
}
