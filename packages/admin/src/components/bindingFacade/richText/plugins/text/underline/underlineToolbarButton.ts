import type { ToolbarButtonSpec } from '../../../toolbars'
import { underlineMark } from './withUnderline'

export const underlineToolbarButton: ToolbarButtonSpec = {
	marks: { [underlineMark]: true },
	label: 'Underline',
	title: 'Underline',
	blueprintIcon: 'underline',
}
