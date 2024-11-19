import { isoStringDateToMinutes, timeToMinutes } from '@app/lib-extra/gantt/utils/functions'
import { BlockSizeType, HoursMinString, SlotsLengthType } from '@app/lib-extra/gantt/utils/types'
import { cn } from '@app/lib/utils'
import { EntityAccessor } from '@contember/interface'
import { useDraggable } from '@dnd-kit/core'
import { Edit2 } from 'lucide-react'
import React, { ReactNode } from 'react'

export type DraggableActivityProps = {
	activity: EntityAccessor
	discriminators: EntityAccessor[]
	discriminationField: string
	startTimeField: string
	endTimeField: string
	startTime: HoursMinString
	blockSize: BlockSizeType
	slotsLength: SlotsLengthType
	onEditClick?: (activity: EntityAccessor) => void
	children?: ReactNode
}

export const DraggableActivity = ({
	activity,
	discriminators,
	discriminationField,
	startTime,
	blockSize,
	slotsLength,
	endTimeField,
	startTimeField,
	onEditClick,
	children,
}: DraggableActivityProps) => {
	const activityStartTime = activity.getField<string>(startTimeField).value ?? ''
	const activityEndTime = activity.getField<string>(endTimeField).value ?? ''
	const activityDiscriminator = activity.getEntity(discriminationField).id
	const indexOfPlace = discriminators.findIndex(discriminator => discriminator.id === activityDiscriminator)
	const durationInMinutes = (new Date(activityEndTime).getTime() - new Date(activityStartTime).getTime()) / 60000

	// move ref
	const { attributes, listeners, setNodeRef, transform } = useDraggable({
		id: activity.id,
		data: { type: 'move', activity },
	})

	// start drag ref
	const {
		setNodeRef: setStartRef,
		attributes: startAttributes,
		listeners: startListeners,
	} = useDraggable({
		id: `${activity.id}#start`,
		data: { type: 'resize', edge: 'start', activity },
	})

	// end drag ref
	const {
		setNodeRef: setEndRef,
		attributes: endAttributes,
		listeners: endListeners,
	} = useDraggable({
		id: `${activity.id}#end`,
		data: { type: 'resize', edge: 'end', activity },
	})

	return (
		<div
			ref={setNodeRef}
			{...attributes}
			{...listeners}
			className={cn('absolute rounded-md cursor-move', 'flex items-center justify-between text-sm text-white font-medium touch-none bg-emerald-400')}
			style={{
				transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
				height: `${blockSize.height * 0.75}px`,
				width: `${(durationInMinutes / slotsLength) * blockSize.width}px`,
				left: `${((isoStringDateToMinutes(activityStartTime) - timeToMinutes(startTime)) / slotsLength) * blockSize.width}px`,
				top: `${indexOfPlace * blockSize.height + (blockSize.height * 0.25) / 2}px`,
			}}
		>
			<div
				ref={setStartRef}
				{...startAttributes}
				{...startListeners}
				className="w-2 h-full bg-white opacity-40  cursor-ew-resize absolute left-0 top-0"
			/>
			<span className="px-2 pointer-events-none truncate">{children}</span>
			{onEditClick && (
				<button
					onClick={e => {
						e.stopPropagation()
						onEditClick(activity)
					}}
					className="p-1 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors mr-3"
					aria-label={`Edit ${activity.name}`}
				>
					<Edit2 className="w-3 h-3" />
				</button>
			)}
			<div ref={setEndRef} {...endAttributes} {...endListeners} className="w-2 h-full bg-white opacity-40 cursor-ew-resize absolute right-0 top-0" />
		</div>
	)
}
