import * as React from 'react'
import { ReactElement, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useEditorReferenceMethods } from '../contexts'
import { EntityAccessor } from '@contember/react-binding'

export interface EditorReferenceTriggerProps {
	referenceType: string
	initialize?: EntityAccessor.BatchUpdatesHandler
	children: ReactElement
}
export const EditorReferenceTrigger = ({ referenceType, initialize, ... props }: EditorReferenceTriggerProps) => {

	const { insertElementWithReference } = useEditorReferenceMethods()
	const onClick = useCallback(() => {

		insertElementWithReference({
			type: referenceType,
		}, referenceType, initialize)
	}, [initialize, insertElementWithReference, referenceType])

	return <Slot onClick={onClick} {...props} />
}
