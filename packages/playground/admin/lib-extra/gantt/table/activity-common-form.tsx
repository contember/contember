import { addTimeSlotToTime } from '@app/lib-extra/gantt/utils/functions'
import { SlotsLengthType } from '@app/lib-extra/gantt/utils/types'
import { SelectField } from '@app/lib/form'
import { Label } from '@app/lib/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@app/lib/ui/select'
import { Component, EntityAccessor, EntitySubTree, Field, HasOne, useEntity, useEntitySubTree, useField } from '@contember/interface'
import { DateRangeFilterArtifacts, useDataViewFilter } from '@contember/react-dataview'
import React, { ReactNode, useEffect, useState } from 'react'

export type ActivityCommonFormProps = {
	discriminator?: EntityAccessor
	discriminationField: string
	discriminationLabel: ReactNode
	time?: string
	startTimeField: string
	endTimeField: string
	slotsLength: SlotsLengthType
	form?: ReactNode
	timeSlots: string[]
}

export const ActivityCommonForm = Component<ActivityCommonFormProps>(
	({ discriminator, time, startTimeField, endTimeField, slotsLength, discriminationField, discriminationLabel, form, timeSlots }) => {
		const [filter] = useDataViewFilter<DateRangeFilterArtifacts>('startTime')
		const filteredDay = filter?.start
		const entity = useEntity()
		const startTimeFieldAccessor = entity.getField<string>(startTimeField)
		const endTimeFieldAccessor = entity.getField<string>(endTimeField)
		const discriminatorToConnect = discriminator && useEntitySubTree('discriminatorToConnect')


		useEffect(() => {
			if (time && filteredDay) {
				const startTime = new Date(`${filteredDay}T${time}:00`)
				const timePlusOneSlot = addTimeSlotToTime(time, slotsLength)
				const endTime = new Date(`${filteredDay}T${timePlusOneSlot}:00`)

				startTimeFieldAccessor.updateValue(startTime.toISOString())
				endTimeFieldAccessor.updateValue(endTime.toISOString())
			}

			if (discriminatorToConnect) {
				entity.connectEntityAtField(discriminationField, discriminatorToConnect)
			}
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [])

		return (
			<>
				{filteredDay && (
					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-2">
							<Label>Date</Label>
							<div className="text-sm border rounded-lg p-2 text-gray-500">{filteredDay}</div>
						</div>
						<div className="flex w-full gap-4">
							<TimeSelectInput field={startTimeField} timeSlots={timeSlots} filteredDay={filteredDay} label={'From'} />
							<TimeSelectInput field={endTimeField} timeSlots={timeSlots} filteredDay={filteredDay} label={'To'} />
						</div>
					</div>
				)}
				<SelectField field={discriminationField} label="Discriminatior">
					{discriminationLabel}
				</SelectField>
				{form}
			</>
		)
	},
	({ startTimeField, endTimeField, discriminationField, discriminator, discriminationLabel, form }) => (
		<>
			<Field field={startTimeField} />
			<Field field={endTimeField} />
			<HasOne field={discriminationField}>{discriminationLabel}</HasOne>
			{discriminator && (
				<EntitySubTree entity={`${discriminator.name}(id='${discriminator.id}')`} alias="discriminatorToConnect">
					{discriminationLabel}
				</EntitySubTree>
			)}
			{form}
		</>
	),
)

export type TimeSelectInputProps = {
	field: string
	timeSlots: string[]
	filteredDay: string
	label?: string
}

export const TimeSelectInput = Component<TimeSelectInputProps>(({ label, field, timeSlots, filteredDay }) => {
	const fieldAccessor = useField<string>(field)
	const fieldValue = fieldAccessor.value
	const initialTimeValue = fieldValue ? new Date(fieldValue).toTimeString().slice(0, 5) : undefined
	const [timeValue, setTimeValue] = useState<string | undefined>(initialTimeValue)

	const handleTimeChange = (time: string) => {
		setTimeValue(time)
		const newValue = new Date(`${filteredDay}T${time}:00`)
		fieldAccessor.updateValue(newValue.toISOString())
	}

	useEffect(() => {
		if (initialTimeValue) {
			setTimeValue(initialTimeValue)
		}
	}, [initialTimeValue])

	return (
		<div className="flex flex-col w-full gap-2">
			{label && <Label>{label}</Label>}
			<Select value={timeValue} onValueChange={handleTimeChange}>
				<SelectTrigger>
					<SelectValue placeholder="--:--">{timeValue}</SelectValue>
				</SelectTrigger>
				<SelectContent className="overflow-y-auto h-80">
					{timeSlots.map(time => (
						<SelectItem key={time} value={time}>
							{time}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	)
})
