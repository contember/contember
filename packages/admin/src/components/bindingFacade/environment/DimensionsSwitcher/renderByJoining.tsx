import * as React from 'react'
import { SelectedDimensionRenderer } from './types'

export const renderByJoining: SelectedDimensionRenderer = dimensionData => {
	const output: React.ReactNode[] = []

	for (const [i, dimension] of dimensionData.entries()) {
		output.push(<React.Fragment key={dimension.slug}>{dimension.label}</React.Fragment>)

		if (i + 1 < dimensionData.length) {
			output.push(<React.Fragment key={`${dimension.slug}_separator`}>{', '}</React.Fragment>)
		}
	}

	return output
}
