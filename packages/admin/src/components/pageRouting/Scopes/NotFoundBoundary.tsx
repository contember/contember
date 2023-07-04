import { Component, useEntity } from '@contember/binding'
import { EmptyStateContainer, Message } from '@contember/ui'
import { SearchX } from 'lucide-react'
import { ReactNode } from 'react'

export const NotFoundBoundary = Component<{ children: ReactNode }>(
	({ children }) => {
		const accessor = useEntity()
		const node = accessor.environment.getSubTree()

		if (node.expectedCardinality === 'one' && !accessor.existsOnServer) {
			return (
				<EmptyStateContainer intent="danger" header={<SearchX /> }>
					<Message intent="danger">Requested entity of type {accessor.name} was not found</Message>
				</EmptyStateContainer>
			)
		} else {
			return <>{children}</>
		}
	},
	({ children }) => <>{children}</>,
)
