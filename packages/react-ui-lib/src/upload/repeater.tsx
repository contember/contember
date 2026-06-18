import { DropIndicator } from '@contember/react-ui-lib-base'
import * as React from 'react'
import { RepeaterSortableDropIndicator } from '@contember/react-repeater-dnd-kit'

/**
 * UploaderRepeaterDropIndicator is a component that renders a drop indicator for a repeater.
 * It is used to indicate where an item can be dropped in a repeater.
 */
export const UploaderRepeaterDropIndicator = ({ position }: { position: 'before' | 'after' }) => (
	<div className={'relative'}>
		<RepeaterSortableDropIndicator position={position}>
			<DropIndicator placement={position === 'before' ? 'left' : 'right'} />
		</RepeaterSortableDropIndicator>
	</div>
)
