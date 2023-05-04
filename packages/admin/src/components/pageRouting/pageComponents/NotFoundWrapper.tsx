import { Component, useEntity } from '@contember/binding'
import { LayoutPage, Message } from '@contember/ui'
import { ReactNode } from 'react'

export const NotFoundWrapper = Component<{ children: ReactNode, title?: ReactNode }>(
	({ children, title }) => {
		const accessor = useEntity()
		const node = accessor.environment.getSubTree()
		if (node.expectedCardinality === 'one' && !accessor.existsOnServer) {
			return (
				<LayoutPage title={title}>
					<Message intent="danger">Requested entity of type {accessor.name} was not found</Message>
				</LayoutPage>
			)
		}
		return <>{children}</>
	},
	({ children }) => <>{children}</>,
)
