import { ReactNode } from 'react'
import { TextFilterArtifacts, TextFilterArtifactsMatchMode } from '../../../filterTypes'
import { useDataViewFilter } from '../../../hooks'
import { useDataViewFilterName } from '../../../contexts'

export interface DataViewTextFilterMatchModeLabelProps {
	/**
	 * The name of the filter. If not provided, the component will attempt to infer it from the context.
	 */
	name?: string
	/**
	 * The content or UI controls to render inside the label.
	 * - If a function, it receives the current match mode and should return a React node.
	 * - If an object, it should be a mapping of match modes to React nodes.
	 */
	render:
		| ((mode: TextFilterArtifactsMatchMode) => ReactNode)
		| Record<TextFilterArtifactsMatchMode, ReactNode>
}

/**
 * A label component for displaying the current match mode of a text filter in a data view.
 *
 * ## Props
 * - name, render
 *
 * See {@link DataViewTextFilterMatchModeLabelProps} for details.
 *
 * ## Example
 * ```tsx
 * <DataViewTextFilterMatchModeLabel render={mode => <span>{mode}</span>} />
 * ```
 */
export const DataViewTextFilterMatchModeLabel = ({ name, render }: DataViewTextFilterMatchModeLabelProps) => {
	// eslint-disable-next-line react-hooks/rules-of-hooks
	name ??= useDataViewFilterName()
	const [state] = useDataViewFilter<TextFilterArtifacts>(name)

	if (typeof render === 'function') {
		return <>{render(state?.mode ?? 'matches')}</>
	}
	return <>{render[state?.mode ?? 'matches']}</>
}
