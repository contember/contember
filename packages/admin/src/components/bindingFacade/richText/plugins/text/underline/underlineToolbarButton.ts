import { ToolbarButton } from '../../../toolbars'
import { underlineMark } from './withUnderline'

export const underlineToolbarButton: ToolbarButton = {
	marks: { [underlineMark]: true },
	blueprintIcon: 'underline',
}
