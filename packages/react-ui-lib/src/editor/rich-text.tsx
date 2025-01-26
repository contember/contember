import { Editable, useSlateStatic } from 'slate-react'
import { EditorCanvas } from './common'
import { RichTextEditor } from '@contember/react-slate-editor'
import { Component, SugaredRelativeSingleField, useMutationState } from '@contember/interface'
import { ReactNode } from 'react'
import { FormContainer, FormContainerProps } from '../form'
import { FormFieldScope } from '@contember/react-form'
import { richTextFieldPlugins } from './plugins'

export type RichTextFieldProps = {
	/** Form field name for storing content */
	field: SugaredRelativeSingleField['field']
	children: ReactNode
}
& Omit<FormContainerProps, 'children'>

/**
 * RichTextField component - Form-integrated rich text editor with basic formatting
 *
 * #### Purpose
 * Provides a rich text editing experience within Contember forms with common formatting tools
 *
 * #### Features
 * - Integrated with Contember form field management
 * - Basic text formatting (bold, italic, code, etc.)
 * - Read-only state during mutations
 * - Custom placeholder support
 * - Plugin-based architecture
 *
 * #### Example: Basic usage
 * ```tsx
 * <RichTextField field="content" />
 * ```
 *
 * #### Example: With custom placeholder
 * ```tsx
 * <RichTextField
 *   field="content"
 *   label="Article body"
 *   placeholder="Enter your text here"
 * />
 * ```
 */
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

const RichTextAreaInner = ({ placeholder, children }: { placeholder?: string; children: ReactNode }) => {
	const editor = useSlateStatic()
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
