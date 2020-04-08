import { ToolbarButton } from '../../../toolbars'
import { underlineMark } from './withUnderline'

export const underlineToolbarButton: ToolbarButton = {
	marks: { [underlineMark]: true },
	label: 'Underline',
	title: 'Underline',
	blueprintIcon: 'underline',
}
