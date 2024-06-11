import { DropIndicator } from '../ui/sortable'
import * as React from 'react'
import { RepeaterSortableDropIndicator } from '@contember/react-repeater-dnd-kit'


export const UploaderRepeaterDropIndicator = ({ position }: { position: 'before' | 'after' }) => (
	<div className={'relative'}>
		<RepeaterSortableDropIndicator position={position}>
			<DropIndicator placement={position === 'before' ? 'left' : 'right'} />
		</RepeaterSortableDropIndicator>
	</div>
)
