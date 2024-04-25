import type { ToolbarButtonSpec } from '../../../toolbars'
import { boldMark } from './boldMark'

export const boldToolbarButton: ToolbarButtonSpec = {
	marks: { [boldMark]: true },
	label: 'Bold',
	title: 'Bold',
	blueprintIcon: 'bold',
}
