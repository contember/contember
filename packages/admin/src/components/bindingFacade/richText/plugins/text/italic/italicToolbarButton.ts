import type { ToolbarButtonSpec } from '../../../toolbars'
import { italicMark } from './italicMark'

export const italicToolbarButton: ToolbarButtonSpec = {
	marks: { [italicMark]: true },
	label: 'Italic',
	title: 'Italic',
	blueprintIcon: 'italic',
}
