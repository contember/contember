import { FC, ReactNode } from 'react'
import { EntityKeyProvider, EnvironmentContext } from '@contember/react-binding'
import { useReferencedEntity } from './useReferencedEntity.js'
import { ReactEditor, useSlateStatic } from 'slate-react'
import { ElementWithReference } from './elements/index.js'

export type ReferenceElementWrapperProps = {
	element: ElementWithReference
	children?: ReactNode
}

export const ReferenceElementWrapper: FC<ReferenceElementWrapperProps> = ({ children, element }) => {
	const editor = useSlateStatic()
	const path = ReactEditor.findPath(editor, element)
	const ref = useReferencedEntity(path, element.referenceId)
	// The entity is provided through its stable accessor getter rather than the realm key.
	// Realm keys change when a successful persist assigns server identities (`changeRealmId`),
	// but Slate does not re-render its cached element trees, so consumers below would keep
	// resolving the captured stale key and crash with "Trying to retrieve a non-existent entity".
	// The getter keeps resolving correctly because the realm state is re-keyed in place.
	return (
		<EntityKeyProvider entityKey={ref.getAccessor}>
			<EnvironmentContext.Provider value={ref.environment}>{children}</EnvironmentContext.Provider>
		</EntityKeyProvider>
	)
}
