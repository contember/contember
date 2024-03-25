import { DataViewSelectionMethods, DataViewSelectionProps, DataViewSelectionState } from '../../types'
import { useCallback, useMemo } from 'react'
import { useStoredState } from '@contember/react-utils'

export type UseDataViewSelectionArgs =
	& {
		dataViewKey?: string
		resetPage: () => void
	}
	& DataViewSelectionProps

export type UseDataViewSelectionResult = {
	state: DataViewSelectionState
	methods: DataViewSelectionMethods
}

export const useDataViewSelection = ({ dataViewKey, initialSelection, selectionStateStorage, selectionFallback, resetPage }: UseDataViewSelectionArgs): UseDataViewSelectionResult => {
	const [values, setValues] = useStoredState<DataViewSelectionState['values']>(
		selectionStateStorage ?? 'local',
		[dataViewKey ?? 'dataview', 'selection'],
		val => {
			return typeof initialSelection === 'function' ? initialSelection(val ?? {}) : val ?? initialSelection ?? {}
		},
	)

	const setSelection = useCallback<DataViewSelectionMethods['setSelection']>((key, value) => {
		let didBailOut = false

		setValues(current => {
			const existingValue = current[key]
			const resolvedValue = typeof value === 'function' ? value(existingValue) : value

			if (existingValue === resolvedValue) {
				didBailOut = true
				return current
			}
			const { [key]: _, ...rest } = current
			return resolvedValue === undefined ? rest : { ...rest, [key]: resolvedValue }
		})
		if (!didBailOut) {
			resetPage()
		}
	}, [resetPage, setValues])

	return {
		state: useMemo((): DataViewSelectionState => {
			return {
				values,
				fallback: selectionFallback === undefined ? true : selectionFallback,
			}
		}, [selectionFallback, values]),
		methods: useMemo((): DataViewSelectionMethods => {
			return {
				setSelection,
			}
		}, [setSelection]),
	}
}
