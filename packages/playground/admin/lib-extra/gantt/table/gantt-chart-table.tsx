import { GanttChartContext } from '@app/lib-extra/gantt/gantt-chart-provider'
import { CreateActivityModal, EditActivityModal } from '@app/lib-extra/gantt/table/activity-modal'
import { CurrentTimeIndicator } from '@app/lib-extra/gantt/table/current-time-indicator'
import { DraggableActivity } from '@app/lib-extra/gantt/table/drag-activity'
import { DroppableTimeSlot } from '@app/lib-extra/gantt/table/drop-time-slot'
import { getNumberOfTimeSlots, getTimeSlots } from '@app/lib-extra/gantt/utils/functions'
import { BlockSizeType, HoursMinString, SlotsLengthType } from '@app/lib-extra/gantt/utils/types'
import { usePersistWithFeedback } from '@app/lib/binding'
import { Component, Entity, EntityAccessor, EntityListSubTree, Field, HasOne, useEntityListSubTree } from '@contember/interface'
import { DataViewEachRow, useDataViewEntityListAccessor } from '@contember/react-dataview'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers'
import React, { ReactNode, useContext, useState } from 'react'

export type GanttChartTableProps = {
	discriminationEntity: string
	discriminationField: string
	discriminationLabel: ReactNode
	activityLabel: ReactNode
	startTimeField: string
	endTimeField: string
	startTime?: HoursMinString
	endTime?: HoursMinString
	blockSize?: BlockSizeType
	slotsLength?: SlotsLengthType
	showCurrentTime?: boolean
	createActivityForm?: ReactNode
	editActivityForm?: ReactNode
}

export const GanttChartTable = Component<GanttChartTableProps>(
	({
		startTime = '09:00',
		endTime = '22:00',
		blockSize = {
			width: 60,
			height: 40,
		},
		slotsLength = 15,
		showCurrentTime = true,
		createActivityForm,
		editActivityForm,
		...props
	}) => {
		const activities = useDataViewEntityListAccessor()
		const activitiesArray = activities ? Array.from(activities) : []
		const discriminatorsArray = Array.from(useEntityListSubTree('discriminators'))
		const persist = usePersistWithFeedback()

		const { isEditAllowed = true } = useContext(GanttChartContext)
		const [activeId, setActiveId] = useState<string | null>(null)
		const [newActivity, setNewActivity] = useState<{ time: string; discriminator: EntityAccessor } | null>(null)
		const [editedActivity, setEditedActivity] = useState<EntityAccessor | null>(null)

		const numberOfTimeSlots = getNumberOfTimeSlots(startTime, endTime, slotsLength)
		const timeSlots = getTimeSlots(startTime, numberOfTimeSlots, slotsLength)

		const sensors = useSensors(
			useSensor(PointerSensor, {
				activationConstraint: {
					distance: 20,
				},
			}),
			useSensor(TouchSensor, {
				activationConstraint: {
					distance: 20,
				},
			}),
		)

		const handleDragStart = (event: DragStartEvent) => {
			setActiveId(event.active.id as string)
		}

		const handleDragEnd = (event: DragEndEvent) => {
			const { active, delta } = event
			const id = active.id.toString().split('#')[0]
			const activity = activitiesArray.find(activity => activity.id === id)

			const dragType = (active.data.current as any)?.type
			const edge = (active.data.current as any)?.edge

			const timeChange = Math.round(delta.x / blockSize.width) * slotsLength
			const discriminatorChange = Math.round(delta.y / blockSize.height)

			if (activity) {
				const currentDiscriminator = activity.getEntity(props.discriminationField)
				const newDiscriminatorIndex =
					discriminatorsArray.findIndex(discriminator => discriminator.id === currentDiscriminator.id) + discriminatorChange
				const newDiscriminator = discriminatorsArray[newDiscriminatorIndex]
				// current times
				const startTime = new Date(activity.getField<string>(props.startTimeField).value ?? '')
				const endTime = new Date(activity.getField<string>(props.endTimeField).value ?? '')
				// new times
				const newStartTime = new Date(startTime.getTime() + timeChange * 60000)
				const newEndTime = new Date(endTime.getTime() + timeChange * 60000)

				// check if new discriminator is in bounds
				if (newDiscriminatorIndex < 0 || newDiscriminatorIndex >= discriminatorsArray.length) {
					setActiveId(null)
					return
				}

				// check for overlapping activities
				const isOverlapping = activitiesArray.some(otherActivity => {
					if (otherActivity.id === id) return false
					const otherDiscriminatorId = otherActivity.getEntity(props.discriminationField).id
					if (otherDiscriminatorId !== newDiscriminator.id) return false
					const otherStartTime = new Date(otherActivity.getField<string>(props.startTimeField).value ?? '')
					const otherEndTime = new Date(otherActivity.getField<string>(props.endTimeField).value ?? '')
					return newStartTime < otherEndTime && newEndTime > otherStartTime
				})

				if (isOverlapping) {
					setActiveId(null)
					return
				}

				if (dragType === 'move') {
					activity.getField(props.startTimeField).updateValue(newStartTime.toISOString())
					activity.getField(props.endTimeField).updateValue(newEndTime.toISOString())
					activity.connectEntityAtField(props.discriminationField, newDiscriminator)
				}
				if (dragType === 'resize') {
					if (edge === 'start') {
						const newDuration = (endTime.getTime() - newStartTime.getTime()) / 60000
						if (newDuration >= slotsLength) {
							activity.getField(props.startTimeField).updateValue(newStartTime.toISOString())
						}
					} else {
						const newDuration = (newEndTime.getTime() - startTime.getTime()) / 60000
						if (newDuration >= slotsLength) {
							activity.getField(props.endTimeField).updateValue(newEndTime.toISOString())
						}
					}
				}
				persist()
			}
			setActiveId(null)
		}

		const handleNewActivity = (time: string, discriminator: EntityAccessor) => {
			setNewActivity({ time, discriminator })
		}

		const handleEditActivity = (activityId: EntityAccessor) => {
			setEditedActivity(activityId)
		}

		return (
			<div className="flex">
				{/* Sidebar with discriminators */}
				<DiscriminatorSideBar discriminators={discriminatorsArray} blockSize={blockSize} discriminationLabel={props.discriminationLabel} />

				{/* Gantt chart grid */}
				<div className="w-full overflow-x-scroll">
					<div style={{ minWidth: `${numberOfTimeSlots * blockSize.width}px` }}>
						{/* Time slots header */}
						<TimeSlotsHeader timeSlots={timeSlots} blockSize={blockSize} />

						{/* Main grid */}
						<DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} modifiers={[restrictToFirstScrollableAncestor]} sensors={sensors}>
							<div className={`relative ${!isEditAllowed && 'pointer-events-none'}`}>
								{discriminatorsArray.map(discriminator => (
									<div key={discriminator.id} className="border-b flex" style={{ height: `${blockSize.height}px` }}>
										{timeSlots.map(time => (
											<DroppableTimeSlot
												key={`${discriminator.id}-${time}`}
												time={time}
												discriminator={discriminator}
												blockSize={blockSize}
												onFreeSlotClick={createActivityForm ? handleNewActivity : undefined}
											/>
										))}

										{activitiesArray
											.filter(activity => activity.getEntity(props.discriminationField).id === discriminator.id)
											.map(activity => (
												<DraggableActivity
													key={activity.id}
													activity={activity}
													discriminators={discriminatorsArray}
													slotsLength={slotsLength}
													blockSize={blockSize}
													startTime={startTime}
													onEditClick={editActivityForm && isEditAllowed ? handleEditActivity : undefined}
													{...props}
												>
													<Entity accessor={activity}>{props.activityLabel}</Entity>
												</DraggableActivity>
											))}

										{showCurrentTime && <CurrentTimeIndicator blockSize={blockSize} slotLength={slotsLength} startTime={startTime} />}
									</div>
								))}
							</div>

							<DragOverlay>
								{activeId && (
									<div className="bg-gray-200 opacity-50 rounded-md items-center flex w-10" style={{ height: `${blockSize.height * 0.75}px` }} />
								)}
							</DragOverlay>
						</DndContext>
					</div>
				</div>

				{/* Activity modals */}
				<CreateActivityModal
					newActivity={newActivity}
					setNewActivity={setNewActivity}
					timeSlots={timeSlots}
					slotsLength={slotsLength}
					form={createActivityForm}
					{...props}
				/>

				<EditActivityModal
					editedActivity={editedActivity}
					setEditedActivity={setEditedActivity}
					timeSlots={timeSlots}
					slotsLength={slotsLength}
					form={editActivityForm}
					{...props}
				/>
			</div>
		)
	},
	({ discriminationEntity, discriminationField, discriminationLabel, startTimeField, endTimeField, activityLabel }) => {
		return (
			<>
				<EntityListSubTree entities={discriminationEntity} alias="discriminators">
					{discriminationLabel}
				</EntityListSubTree>
				<DataViewEachRow>
					<Field field={startTimeField} />
					<Field field={endTimeField} />
					<HasOne field={discriminationField} />
					{activityLabel}
				</DataViewEachRow>
			</>
		)
	},
)

export type DiscriminatorSideBarProps = {
	discriminators: EntityAccessor[]
	blockSize: BlockSizeType
	discriminationLabel: ReactNode
}

const DiscriminatorSideBar = Component<DiscriminatorSideBarProps>(({ discriminators, discriminationLabel, blockSize }) => (
	<div className="mt-5 border-r">
		{discriminators.map(place => (
			<div key={place.id} className="border-b flex items-center px-2 text-sm font-medium w-40" style={{ height: `${blockSize.height}px` }}>
				<Entity accessor={place}>{discriminationLabel}</Entity>
			</div>
		))}
	</div>
))

export type TimeSlotsHeaderProps = {
	timeSlots: string[]
	blockSize: BlockSizeType
}

const TimeSlotsHeader = Component<TimeSlotsHeaderProps>(({ timeSlots, blockSize }) => (
	<div className="flex border-b h-5">
		{timeSlots.map(time => (
			<div key={time} className="text-xs text-center" style={{ width: `${blockSize.width}px` }}>
				{time}
			</div>
		))}
	</div>
))
