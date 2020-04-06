import { ElementToolbarButton } from '../../../toolbars'
import { AnchorElement, anchorElementType } from './AnchorElement'

export const anchorToolbarButton: ElementToolbarButton<AnchorElement> = {
	elementType: anchorElementType,
	blueprintIcon: 'link',
}
