import { DropIndicator } from '../ui/sortable'
import { RepeaterSortableDropIndicator } from '@contember/react-repeater-dnd-kit'

/**
* Props from {@link UploaderRepeaterDropIndicator}.
*/
export type UploaderRepeaterDropIndicatorProps = {
	position: 'before' | 'after'
}

/**
 * Props {@link UploaderRepeaterDropIndicatorProps}.
 *
 * UploaderRepeaterDropIndicator is a component that renders a drop indicator for a repeater.
 * It is used to indicate where an item can be dropped in a repeater.
 */
export const UploaderRepeaterDropIndicator = ({ position }: UploaderRepeaterDropIndicatorProps) => (
	<div className="relative">
		<RepeaterSortableDropIndicator position={position}>
			<DropIndicator placement={position === 'before' ? 'left' : 'right'} />
		</RepeaterSortableDropIndicator>
	</div>
)
