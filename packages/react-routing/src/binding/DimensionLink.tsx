import { ReactElement, useCallback, useMemo } from 'react'
import { Link } from './Link'
import { RequestChange } from '../types'
import { dataAttribute } from '@contember/utilities'
import { Component } from '@contember/react-binding'
import { useCurrentRequest } from '../RequestContext'

export interface DimensionLinkProps {
	dimension: string
	value: string
	children: ReactElement
	action?: DimensionLinkAction
}

export type DimensionLinkAction =
	| 'add'
	| 'toggle'
	| 'set'
	| 'unset'

const emptyDim = [] as string[]

export const DimensionLink = Component<DimensionLinkProps>(({ dimension, value, action = 'toggle', ...props }) => {
	const currentDimensionValue = useCurrentRequest()?.dimensions[dimension] ?? emptyDim
	const isActive = useMemo(() => currentDimensionValue.includes(value), [currentDimensionValue, value])

	const changeRequest = useCallback< RequestChange>(it => {
		if (!it) {
			return null
		}
		const current = it?.dimensions[dimension] ?? []
		const newValue = (() => {
			switch (action) {
				case 'toggle':
					return current.includes(value) ? current.filter(it => it !== value) : [...current, value]
				case 'set':
					return [value]
				case 'unset':
					return current.filter(it => it !== value)
				case 'add':
					return [...current.filter(it => it !== value), value]
			}
		})()

		return {
			...it,
			dimensions: {
				...it.dimensions,
				[dimension]: newValue,
			},
		}
	}, [dimension, value, action])

	return (
		<Link
			to={changeRequest}
			data-active={dataAttribute(isActive)}
			{...props}
		/>
	)
}, ({ children }) => {
	return <>{children}</>
})
