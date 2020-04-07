import { ToolbarButton } from '../../../toolbars'
import { codeMark } from './withCode'

export const codeToolbarButton: ToolbarButton = {
	marks: { [codeMark]: true },
	label: 'Code',
	title: 'Code',
	blueprintIcon: 'code',
}
