import type { ToolbarButtonSpec } from '../../../toolbars'
import { codeMark } from './codeMark'

export const codeToolbarButton: ToolbarButtonSpec = {
	marks: { [codeMark]: true },
	label: 'Code',
	title: 'Code',
	blueprintIcon: 'code',
}
