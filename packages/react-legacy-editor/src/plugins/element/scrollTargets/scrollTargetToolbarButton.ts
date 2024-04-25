import type { ElementToolbarButton } from '../../../toolbars'
import { ScrollTargetElement, scrollTargetElementType } from './ScrollTargetElement'

export const scrollTargetToolbarButton: ElementToolbarButton<ScrollTargetElement> = {
	elementType: scrollTargetElementType,
	label: 'Scroll target',
	title: 'Scroll target',
	blueprintIcon: 'locate',
}
