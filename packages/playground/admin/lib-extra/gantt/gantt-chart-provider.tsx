import { createRequiredContext } from '@contember/react-utils'
import * as React from 'react'
import { Dispatch, ReactNode, SetStateAction, useState } from 'react'

export type GanttChartContextProps = {
	isEditAllowed: boolean
	setIsEditAllowed: Dispatch<SetStateAction<boolean>>
}

export const [GanttChartContext] = createRequiredContext<GanttChartContextProps>('GanttChartContext')

export const GanttChartProvider = ({ children }: { children: ReactNode }) => {
	const [isEditAllowed, setIsEditAllowed] = useState(false)

	return <GanttChartContext.Provider value={{ isEditAllowed, setIsEditAllowed }}>{children}</GanttChartContext.Provider>
}
