import { BindingError, OptionallyVariableFieldValue, VariableInputTransformer } from '@contember/binding'
import { ReactElement, useCallback } from 'react'
import { useEnvironment } from '@contember/react-binding'
import { useSlate } from 'slate-react'
import { Slot } from '@radix-ui/react-slot'
import * as React from 'react'
import { EditorWithBlocks, ReferenceElement, referenceElementType } from '../blockEditor'
import { useEditorReferenceBlocks } from '../contexts'
import { getDiscriminatedDatum } from '../discrimination'

export interface EditorReferenceTriggerProps {
	referenceType: OptionallyVariableFieldValue
	children: ReactElement
}
export const EditorReferenceTrigger = ({ referenceType, ... props }: EditorReferenceTriggerProps) => {

	const editor = useSlate() as EditorWithBlocks
	const editorReferenceBlocks = useEditorReferenceBlocks()
	const environment = useEnvironment()

	const onClick = useCallback(() => {
		const discriminateBy = VariableInputTransformer.transformValue(referenceType, environment)
		const targetBlock = getDiscriminatedDatum(editorReferenceBlocks, discriminateBy)

		if (targetBlock === undefined) {
			throw new BindingError(
				`BlockEditor: Trying to insert a block discriminated by '${discriminateBy}' but no such block has been found!`,
			)
		}
		let insertedElement: Omit<ReferenceElement, 'referenceId'>

		if (targetBlock.datum.template === undefined) {
			insertedElement = {
				type: referenceElementType,
				children: [{ text: '' }],
			}
		} else {
			insertedElement = {
				type: referenceElementType,
				children: [editor.createDefaultElement([{ text: '' }])],
			}
		}

		editor.insertElementWithReference(insertedElement, discriminateBy)
	}, [editor, editorReferenceBlocks, environment, referenceType])

	return <Slot onClick={onClick} {...props} />
}
