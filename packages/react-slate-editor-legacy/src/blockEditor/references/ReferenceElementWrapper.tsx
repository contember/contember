import { FC, ReactNode } from 'react'
import { ElementWithReference } from '../elements'
import { AccessorProvider } from '@contember/react-binding'
import { useReferencedEntity } from './useReferencedEntity'
import { ReactEditor, useSlateStatic } from 'slate-react'

export type ReferenceElementWrapperProps = {
	element: ElementWithReference
	children?: ReactNode
}

export const ReferenceElementWrapper: FC<ReferenceElementWrapperProps> = ({ children, element }) => {
	const editor = useSlateStatic()
	const path = ReactEditor.findPath(editor, element)
	const ref = useReferencedEntity(path, element.referenceId)
	return <AccessorProvider accessor={ref}>{children}</AccessorProvider>
}
