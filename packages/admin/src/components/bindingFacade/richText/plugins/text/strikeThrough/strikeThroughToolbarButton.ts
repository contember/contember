import { ToolbarButton } from '../../../toolbars'
import { strikeThroughMark } from './withStrikeThrough'

export const strikeThroughToolbarButton: ToolbarButton = {
	marks: { [strikeThroughMark]: true },
	blueprintIcon: 'strikethrough',
}
