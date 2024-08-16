import { ReactNode } from 'react'
import { TextFilterArtifacts, TextFilterArtifactsMatchMode } from '../../../filterTypes'
import { useDataViewFilter } from '../../../hooks'
import { useDataViewFilterName } from '../../../contexts'

export type DataViewTextFilterMatchModeLabelProps = {
	name?: string
	render:
		| ((mode: TextFilterArtifactsMatchMode) => ReactNode)
		| Record<TextFilterArtifactsMatchMode, ReactNode>
}

export const DataViewTextFilterMatchModeLabel = ({ name, render }: DataViewTextFilterMatchModeLabelProps) => {
	// eslint-disable-next-line react-hooks/rules-of-hooks
	name ??= useDataViewFilterName()
	const [state] = useDataViewFilter<TextFilterArtifacts>(name)

	if (typeof render === 'function') {
		return <>{render(state?.mode ?? 'matches')}</>
	}
	return <>{render[state?.mode ?? 'matches']}</>
}
