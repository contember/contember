import { Component, EntityAccessor, useEntity } from '@contember/interface'
import React from 'react'

export const UseEntity = Component<{ render: (accessor?: EntityAccessor) => React.ReactNode }>(({ render }) => {
	const entity = useEntity()
	return <>{render(entity)}</>
},
({ render }) => {
	return <>
		{render()}
	</>
})
