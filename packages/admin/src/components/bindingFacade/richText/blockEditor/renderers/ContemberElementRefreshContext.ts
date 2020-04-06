import { BindingError, EntityAccessor } from '@contember/binding'
import * as React from 'react'
import { ContemberFieldElement } from '../elements'
import { NormalizedFieldBackedElement } from '../FieldBackedElement'

/*
 * This is a hack. If we change referential identity of contember blocks between updates, Slate will generate new keys
 * for each node, causing React to unmount and re-mount our components, which completely ruins them. If we do the
 * opposite though, that is preserve the reference, Slate bails out of re-rendering our blocks. To circumvent
 * the latter, we introduce this context in order to notify all contember blocks about the update. That way they can
 * stay referentially equal but still re-render. The value itself does not matter ‒ it is just something we can easily
 * change between renders.
 */
export const BlockEditorGetEntityByKeyContext = React.createContext<(key: string) => EntityAccessor>(() => {
	throw new BindingError(`Invalid state`)
})
export const BlockEditorGetNormalizedFieldBackedElementContext = React.createContext<
	(element: ContemberFieldElement) => NormalizedFieldBackedElement
>(() => {
	throw new BindingError(`Invalid state`)
})
