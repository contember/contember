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
import { ElementNode, SerializableEditorNode } from '../baseEditor'
import { createEditor, CreateEditorPublicOptions } from '../editorFactory'
import { paragraphElementType } from '../plugins/element/paragraphs'
import { RichEditor } from '../RichEditor'
import { HoveringToolbars, HoveringToolbarsProps } from '../toolbars'
import { useRichTextFieldNodes } from './useRichTextFieldNodes'

export interface RichTextFieldInnerPublicProps
	extends Omit<FormGroupProps, 'children' | 'errors'>,
		CreateEditorPublicOptions,
		HoveringToolbarsProps {}

export interface RichTextFieldInnerInternalProps {
	batchUpdates: EntityAccessor['batchUpdates']
	desugaredField: DesugaredRelativeSingleField
	fieldAccessor: FieldAccessor<string>
	environment: Environment
}

export interface RichTextFieldInnerProps extends RichTextFieldInnerPublicProps, RichTextFieldInnerInternalProps {}

const RB = RichEditor.buttons
const defaultInlineButtons: HoveringToolbarsProps['inlineButtons'] = [
	[RB.bold, RB.italic, RB.underline, RB.anchor],
	[RB.strikeThrough, RB.code],
]

export const RichTextFieldInner = React.memo(
	({
		augmentEditor,
		augmentEditorBuiltins,
		plugins,

		batchUpdates,
		desugaredField,
		fieldAccessor,
		environment,

		blockButtons,
		inlineButtons = defaultInlineButtons,

		description,
		label,
		labelDescription,
		labelPosition,
		size,
		useLabelElement,
	}: RichTextFieldInnerProps) => {
		// The cache is questionable, really.
		const [contemberFieldElementCache] = React.useState(() => new WeakMap<FieldAccessor<string>, ElementNode[]>())
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

		const valueNodes = useRichTextFieldNodes({
			editor,
			fieldAccessor,
			contemberFieldElementCache,
		})

		const serialize = editor.serializeElements
		const onChange = React.useCallback(
			(value: SlateNode[]) => {
				contemberFieldElementCache.set(fieldAccessorRef.current, value as ElementNode[])
				fieldAccessorRef.current.updateValue?.(serialize(value as ElementNode[]))
			},
			[contemberFieldElementCache, serialize],
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
				<Slate editor={editor} value={valueNodes} onChange={onChange}>
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
						<HoveringToolbars blockButtons={blockButtons} inlineButtons={inlineButtons} />
					</EditorCanvas>
				</Slate>
			</FormGroup>
		)
	},
)
