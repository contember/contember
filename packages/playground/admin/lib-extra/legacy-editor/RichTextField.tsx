import { Editable } from 'slate-react'
import { EditorCanvas } from './EditorCanvas'
import { RichTextEditor, useEditor } from '@contember/react-legacy-editor'
import { Component, SugaredRelativeSingleField, useMutationState } from '@contember/interface'
import * as React from 'react'
import { ReactNode } from 'react'
import { FormContainer, FormContainerProps } from '../../lib/components/form'
import { FormFieldScope } from '@contember/react-form'
import { richTextFieldPlugins } from './plugins'

export type RichTextFieldProps = {
		field: SugaredRelativeSingleField['field']
		children: ReactNode
	}
	& Omit<FormContainerProps, 'children'>

export const RichTextField = Component<RichTextFieldProps>(({ field, description, label, children }) => {
	return (
		<FormFieldScope field={field}>
			<FormContainer description={description} label={label}>
				<RichTextEditor field={field} plugins={richTextFieldPlugins}>
					<RichTextAreaInner>
						{children}
					</RichTextAreaInner>
				</RichTextEditor>
			</FormContainer>
		</FormFieldScope>
	)
})

const RichTextAreaInner = ({ placeholder, children }: { placeholder?: string, children: ReactNode }) => {
	const editor = useEditor()
	const isMutating = useMutationState()

	return (
		<EditorCanvas
			underlyingComponent={Editable}
			componentProps={{
				readOnly: isMutating,
				renderElement: editor.renderElement,
				renderLeaf: editor.renderLeaf,
				onKeyDown: editor.onKeyDown,
				onFocusCapture: editor.onFocus,
				onBlurCapture: editor.onBlur,
				onDOMBeforeInput: editor.onDOMBeforeInput,
				placeholder,
			}}
		>
			{children}
		</EditorCanvas>
	)
}


