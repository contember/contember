import * as React from 'react'

export interface DimensionDatum {
	slug: string
	label: React.ReactNode
}
export interface StatefulDimensionDatum<IsSelected extends boolean = boolean> extends DimensionDatum {
	isSelected: IsSelected
}

export type SelectedDimensionRenderer = (dimensionData: StatefulDimensionDatum<true>[]) => React.ReactNode
