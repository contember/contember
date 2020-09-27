import { ElementToolbarButton } from '../../../toolbars'
import { HorizontalRuleElement, horizontalRuleElementType } from './HorizontalRuleElement'

export const horizontalRuleToolbarButton: ElementToolbarButton<HorizontalRuleElement> = {
	elementType: horizontalRuleElementType,
	label: 'Horizontal line',
	title: 'Horizontal line',
	contemberIcon: 'horizontalRule',
}
