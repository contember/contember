import { Fragment, ReactNode } from 'react'
import type { SelectedDimensionRenderer } from './types'

export const renderByJoining: SelectedDimensionRenderer = dimensionData => {
	const output: ReactNode[] = []

	for (const [i, dimension] of dimensionData.entries()) {
		output.push(<Fragment key={dimension.slug}>{dimension.label}</Fragment>)

		if (i + 1 < dimensionData.length) {
			output.push(<Fragment key={`${dimension.slug}_separator`}>{', '}</Fragment>)
		}
	}

	return output
}
