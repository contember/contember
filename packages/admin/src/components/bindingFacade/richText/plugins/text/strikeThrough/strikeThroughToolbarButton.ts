import { ToolbarButton } from '../../../toolbars'
import { strikeThroughMark } from './withStrikeThrough'

export const strikeThroughToolbarButton: ToolbarButton = {
	marks: { [strikeThroughMark]: true },
	label: 'Strikethrough',
	title: 'Strikethrough',
	blueprintIcon: 'strikethrough',
}
