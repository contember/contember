import { FC } from 'react'
import { ElementWithReference } from '../elements'
import { Path } from 'slate'
import { AccessorProvider } from '@contember/binding'
import { useReferencedEntity } from './useReferencedEntity'

export const ReferenceElementWrapper: FC<{element: ElementWithReference, path: Path}> = ({ children, element, path }) => {
	const ref = useReferencedEntity(path, element.referenceId)
	return <AccessorProvider accessor={ref}>{children}</AccessorProvider>
}
