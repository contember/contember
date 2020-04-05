import {
	DesugaredRelativeSingleField,
	EntityAccessor,
	Environment,
	FieldAccessor,
	useMutationState,
} from '@contember/binding'
import { EditorCanvas, FormGroup, FormGroupProps } from '@contember/ui'
import * as React from 'react'
import { Node as SlateNode } from 'slate'
import { Editable, Slate } from 'slate-react'
import { SerializableEditorNode } from '../baseEditor'
import { HoveringToolbar } from '../blockEditor/toolbars'
import { createEditor, CreateEditorPublicOptions } from '../editorFactory'
import { paragraphElementType } from '../plugins/element/paragraphs'
import { useRichTextFieldEditorNode } from './useRichTextFieldEditorNode'

export interface RichTextFieldInnerPublicProps
	extends Omit<FormGroupProps, 'children' | 'errors'>,
		CreateEditorPublicOptions {
	// TODO configurable toolbars
}

export interface RichTextFieldInnerInternalProps {
	batchUpdates: EntityAccessor['batchUpdates']
	desugaredField: DesugaredRelativeSingleField
	fieldAccessor: FieldAccessor<string>
	environment: Environment
}

export interface RichTextFieldInnerProps extends RichTextFieldInnerPublicProps, RichTextFieldInnerInternalProps {}

export const RichTextFieldInner = React.memo(
	({
		augmentEditor,
		augmentEditorBuiltins,
		plugins,

		batchUpdates,
		desugaredField,
		fieldAccessor,
		environment,

		description,
		label,
		labelDescription,
		labelPosition,
		size,
		useLabelElement,
	}: RichTextFieldInnerProps) => {
		// The cache is questionable, really.
		const [contemberFieldElementCache] = React.useState(
			() => new WeakMap<FieldAccessor<string>, SerializableEditorNode>(),
		)
		const isMutating = useMutationState()

		const batchUpdatesRef = React.useRef(batchUpdates)
		const fieldAccessorRef = React.useRef(fieldAccessor)

		React.useLayoutEffect(() => {
			batchUpdatesRef.current = batchUpdates
			fieldAccessorRef.current = fieldAccessor
		}) // Deliberately no deps array

		const [editor] = React.useState(() => {
			return createEditor({
				plugins,
				augmentEditor,
				augmentEditorBuiltins,
				batchUpdatesRef,
				defaultElementType: paragraphElementType,
				addEditorBuiltins: editor => editor,
			})
		})

		const editorNode = useRichTextFieldEditorNode({
			editor,
			fieldAccessor,
			contemberFieldElementCache,
		})

		const onChange = React.useCallback(
			(value: SlateNode[]) => {
				// TODO this runs unnecessarily even for selection changes
				const serializableEditor: SerializableEditorNode = {
					formatVersion: editor.formatVersion,
					children: value,
				}
				contemberFieldElementCache.set(fieldAccessorRef.current, serializableEditor)
				fieldAccessorRef.current.updateValue?.(JSON.stringify(serializableEditor))
			},
			[contemberFieldElementCache, editor.formatVersion],
		)

		return (
			<FormGroup
				label={label}
				size={size}
				labelDescription={labelDescription}
				labelPosition={labelPosition}
				description={description}
				useLabelElement={useLabelElement}
				errors={fieldAccessor.errors}
			>
				<Slate editor={editor} value={editorNode.children} onChange={onChange}>
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
						}}
					>
						<HoveringToolbar />
					</EditorCanvas>
				</Slate>
			</FormGroup>
		)
	},
)
