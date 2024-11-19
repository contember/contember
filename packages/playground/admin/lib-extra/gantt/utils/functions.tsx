import { HoursMinString, SlotsLengthType } from '@app/lib-extra/gantt/utils/types'


export const isoStringDateToMinutes = (isoString: string) => {
	const date = new Date(isoString)
	const hours = date.getUTCHours()
	const minutes = date.getUTCMinutes()
	const timezoneOffset = date.getTimezoneOffset()
	return hours * 60 + minutes - timezoneOffset
}

export const timeToMinutes = (time: string) => {
	const [hours, minutes] = time.split(':').map(Number)
	return hours * 60 + minutes
}

export const getNumberOfTimeSlots = (startTime: HoursMinString, endTime: HoursMinString, slotsLength: number) => {
	const [startHours, startMinutes] = startTime.split(':').map(Number)
	const [endHours, endMinutes] = endTime.split(':').map(Number)
	return ((endHours - startHours) * 60 + endMinutes - startMinutes) / slotsLength
}

export const getTimeSlots = (startTime: HoursMinString, numberOfTimeSlots: number, slotsLength: number) => {
	return Array.from({ length: numberOfTimeSlots }, (_, i) => {
		const [startHours, startMinutes] = startTime.split(':').map(Number)
		const totalMinutes = startHours * 60 + startMinutes + i * slotsLength
		const hour = Math.floor(totalMinutes / 60)
		const minute = totalMinutes % 60
		return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
	})
}

export const addTimeSlotToTime = (time: string, slotLength: SlotsLengthType): string => {
	const [hours, minutes] = time.split(':').map(Number)
	const totalMinutes = hours * 60 + minutes + slotLength
	const newHours = Math.floor(totalMinutes / 60) % 24
	const newMinutes = totalMinutes % 60
	return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`
}
