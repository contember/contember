import { Component, EntityAccessor, useEntity } from '@contember/interface'
import { ReactNode } from 'react'

export const UseEntity = Component<{ render: (accessor?: EntityAccessor) => ReactNode }>(({ render }) => {
	const entity = useEntity()

	return <>{render(entity)}</>
}, ({ render }) => <>{render()}</>)
