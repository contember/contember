import { Component, useEntity } from '@contember/binding'
import { Message } from '@contember/ui'
import { ReactNode } from 'react'

export const NotFoundBoundary = Component<{ children: ReactNode }>(
	({ children }) => {
		const accessor = useEntity()
		const node = accessor.environment.getSubTree()

		if (node.expectedCardinality === 'one' && !accessor.existsOnServer) {
			return (
				<Message intent="danger">Requested entity of type {accessor.name} was not found</Message>
			)
		} else {
			return <>{children}</>
		}
	},
	({ children }) => <>{children}</>,
)
