import * as React from 'react'
import { Fragment, ReactNode } from 'react'
import { Component, Entity } from '@contember/react-binding'
import { useDataViewInfiniteLoadAccessors } from '../../contexts'

export const DataViewInfiniteLoadEachRow = Component(({ children }: {
	children: ReactNode
}) => {
	const accessors = useDataViewInfiniteLoadAccessors()
	return <>
		{accessors.map((accessor, index) => {
			return (
				<Fragment key={Array.from(accessor.ids()).join('__')}>
					{Array.from(accessor, entity => {
						return (
							<Entity key={entity.key} accessor={entity}>
								{children}
							</Entity>
						)
					})}
				</Fragment>
			)
		})}
	</>
}, ({ children }) => <>
	{children}
</>)
