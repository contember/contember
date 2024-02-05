import { ReactNode } from 'react'
import { TextFilterArtifacts, TextFilterArtifactsMatchMode } from '../../../filterTypes'
import { useDataViewFilter } from '../../../hooks'

export type DataViewTextFilterMatchModeLabelProps = {
	name: string
	render:
		| ((mode: TextFilterArtifactsMatchMode) => ReactNode)
		| Record<TextFilterArtifactsMatchMode, ReactNode>
}

export const DataViewTextFilterMatchModeLabel = ({ name, render }: DataViewTextFilterMatchModeLabelProps) => {
	const [state] = useDataViewFilter<TextFilterArtifacts>(name)

	if (typeof render === 'function') {
		return render(state?.mode ?? 'matches')
	}
	return render[state?.mode ?? 'matches']
}
