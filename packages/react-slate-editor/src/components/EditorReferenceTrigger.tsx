import * as React from 'react'
import { ReactElement, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useEditorReferenceMethods } from '../contexts'

export interface EditorReferenceTriggerProps {
	referenceType: string
	children: ReactElement
}
export const EditorReferenceTrigger = ({ referenceType, ... props }: EditorReferenceTriggerProps) => {

	const { insertElementWithReference } = useEditorReferenceMethods()
	const onClick = useCallback(() => {

		insertElementWithReference({
			type: referenceType,
		}, referenceType)
	}, [insertElementWithReference, referenceType])

	return <Slot onClick={onClick} {...props} />
}
