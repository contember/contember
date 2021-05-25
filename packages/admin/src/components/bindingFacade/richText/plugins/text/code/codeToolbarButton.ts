import type { ToolbarButtonSpec } from '../../../toolbars'
import { codeMark } from './withCode'

export const codeToolbarButton: ToolbarButtonSpec = {
	marks: { [codeMark]: true },
	label: 'Code',
	title: 'Code',
	blueprintIcon: 'code',
}
