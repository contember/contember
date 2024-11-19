import { timeToMinutes } from '@app/lib-extra/gantt/utils/functions'
import { BlockSizeType, HoursMinString, SlotsLengthType } from '@app/lib-extra/gantt/utils/types'
import { DateRangeFilterArtifacts, useDataViewFilter } from '@contember/react-dataview'
import React, { useEffect, useState } from 'react'

export type CurrentTimeIndicatorProps = {
	slotLength: SlotsLengthType
	startTime: HoursMinString
	blockSize: BlockSizeType
}

export const CurrentTimeIndicator = ({ slotLength, blockSize, startTime }: CurrentTimeIndicatorProps) => {
	const [filter] = useDataViewFilter<DateRangeFilterArtifacts>('startTime')
	const [currentTimePosition, setCurrentTimePosition] = useState<number | null>(null)

	if (!filter?.start) {
		return
	}

	useEffect(() => {
		const updateCurrentTimePosition = () => {
			const currentDate = new Date()
			const filteredDate = new Date(filter?.start ?? '')
			const isToday = currentDate.toDateString() === filteredDate.toDateString()

			if (!isToday) {
				setCurrentTimePosition(null)
				return
			}

			const position = ((currentDate.getHours() * 60 + currentDate.getMinutes() - timeToMinutes(startTime)) / slotLength) * blockSize.width
			setCurrentTimePosition(position)
		}

		updateCurrentTimePosition()
		const interval = setInterval(updateCurrentTimePosition, 60000)
		return () => clearInterval(interval)
	}, [filter, slotLength, blockSize.width, startTime])

	if (currentTimePosition === null) {
		return null
	}

	return <div className="absolute bg-red-500" style={{ left: `${currentTimePosition}px`, height: `${blockSize.height}px`, width: '2px' }} />
}
