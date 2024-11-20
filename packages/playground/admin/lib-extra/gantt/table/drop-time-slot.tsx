import { BlockSizeType } from '@app/lib-extra/gantt/utils/types'
import { EntityAccessor } from '@contember/interface'
import { useDroppable } from '@dnd-kit/core'
import React from 'react'

export type DroppableTimeSlotProps = {
	time: string
	discriminator: EntityAccessor
	onFreeSlotClick?: (time: string, discriminator: EntityAccessor) => void
	blockSize: BlockSizeType
}

export const DroppableTimeSlot = ({ time, discriminator, onFreeSlotClick, blockSize }: DroppableTimeSlotProps) => {
	const { setNodeRef } = useDroppable({
		id: `${discriminator.id}-${time}`,
		data: { time, place: discriminator.id },
	})

	return (
		<div
			ref={setNodeRef}
			className="border-r h-full"
			style={{ width: `${blockSize.width}px` }}
			onClick={onFreeSlotClick ? () => onFreeSlotClick(time, discriminator) : undefined}
		/>
	)
}
