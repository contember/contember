import { DataViewSelectionMethods, DataViewSelectionProps, DataViewSelectionState } from '../../types'
import { useCallback, useMemo } from 'react'
import { useStoredState } from '@contember/react-utils'
import { DataViewSelectionStoredState, getDataViewSelectionStorageArgs } from '../stateStorage'

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

export const useDataViewSelection = ({ dataViewKey, initialSelection, selectionStateStorage, resetPage, layouts }: UseDataViewSelectionArgs): UseDataViewSelectionResult => {
	const [values, setValues] = useStoredState<DataViewSelectionStoredState>(
		selectionStateStorage ?? 'null',
		...getDataViewSelectionStorageArgs({
			dataViewKey,
			initialSelection,
			defaultLayout: layouts?.[0]?.name,
		}),
	)

	const setLayout = useCallback<DataViewSelectionMethods['setLayout']>(value => {
		let didBailOut = false

		setValues(current => {
			const existingValue = current.layout
			const resolvedValue = typeof value === 'function' ? value(existingValue) : value

			if (existingValue === resolvedValue) {
				didBailOut = true
				return current
			}
			return { ...current, layout: resolvedValue }
		})
		if (!didBailOut) {
			resetPage()
		}
	}, [resetPage, setValues])

	const setVisibility = useCallback<DataViewSelectionMethods['setVisibility']>((key, visible) => {
		let didBailOut = false
		setValues(current => {
			const existingValue = current.visibility?.[key]
			const resolvedValue = typeof visible === 'function' ? visible(existingValue) : visible

			if (existingValue === resolvedValue) {
				didBailOut = true
				return current
			}
			return {
				...current,
				visibility: {
					...current.visibility,
					[key]: resolvedValue,
				},
			}
		})
		if (!didBailOut) {
			resetPage()
		}
	}, [resetPage, setValues])

	return {
		state: useMemo(() => {
			return {
				values,
				layouts: layouts ?? [],
			}
		}, [layouts, values]),
		methods: useMemo((): DataViewSelectionMethods => {
			return {
				setLayout,
				setVisibility,
			}
		}, [setLayout, setVisibility]),
	}
}
