import type { ElementToolbarButton } from '../../../toolbars'
import { AnchorElement, anchorElementType } from './AnchorElement'

export const anchorToolbarButton: ElementToolbarButton<AnchorElement> = {
	elementType: anchorElementType,
	label: 'Link',
	title: 'Link',
	blueprintIcon: 'link',
}
