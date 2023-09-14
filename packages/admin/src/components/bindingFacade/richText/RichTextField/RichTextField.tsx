import {
	Component,
	Field,
	FieldAccessor,
	FieldBasicProps,
	QueryLanguage,
	useEntity,
	useMutationState,
} from '@contember/react-binding'
import { EditorCanvas, EditorCanvasDistinction, FieldContainer, FieldContainerProps } from '@contember/ui'
import { FunctionComponent, useCallback, useMemo, useState } from 'react'
import { Descendant, Editor, Element as SlateElement, Node as SlateNode, NodeEntry, Transforms } from 'slate'
import { Editable, Slate } from 'slate-react'
import { useAccessorErrors } from '../../errors'
import { createEditor, CreateEditorPublicOptions } from '../editorFactory'
import { paragraphElementType } from '../plugins'
import { RichEditor } from '../RichEditor'
import { HoveringToolbars, HoveringToolbarsProps } from '../toolbars'
import { useRichTextFieldNodes } from './useRichTextFieldNodes'

export interface RichTextFieldProps
	extends FieldBasicProps,
		Omit<FieldContainerProps, 'children' | 'errors'>,
		CreateEditorPublicOptions,
		HoveringToolbarsProps {
	placeholder?: string
	distinction?: EditorCanvasDistinction
}

/**
 * Rich text field supports more advanced formatting capabilities. Output of this field is a JSON.
 *
 * @group Form Fields
 */
export const RichTextField: FunctionComponent<RichTextFieldProps> = Component(
	props => {
		const entity = useEntity()
		const environment = entity.environment
		const getParent = entity.getAccessor

		const desugaredField = useMemo(
			() => QueryLanguage.desugarRelativeSingleField(props, environment),
			[environment, props],
		)
		const fieldAccessor = useMemo(() => entity.getRelativeSingleField<string>(desugaredField), [entity, desugaredField])

		// The cache is questionable, really.
		const [contemberFieldElementCache] = useState(() => new WeakMap<FieldAccessor<string>, SlateElement[]>())
		const isMutating = useMutationState()

		const [editor] = useState(() => {
			const editor = createEditor({
				plugins: props.plugins ?? [
					'code',
					'strikeThrough',
					'highlight',
					'underline',
					'italic',
					'bold',
					'scrollTarget',
					'anchor',
					'paragraph',
				],
				augmentEditor: props.augmentEditor,
				augmentEditorBuiltins: props.augmentEditorBuiltins,
				defaultElementType: paragraphElementType,
				addEditorBuiltins: editor => editor,
			})

			const { normalizeNode } = editor
			Object.assign(editor, {
				insertBreak: () => {
					Transforms.insertText(editor, '\n')
				},
				normalizeNode: (nodeEntry: NodeEntry) => {
					const [node, path] = nodeEntry
					if (path.length === 0 && SlateElement.isAncestor(node)) {
						// Enforce that there's exactly one child and that it's
						if (node.children.length > 1) {
							return Editor.withoutNormalizing(editor, () => {
								const targetPath = [0, (editor.children[0] as SlateElement).children.length]
								Transforms.moveNodes(editor, {
									at: [1],
									to: targetPath,
								})
								Transforms.unwrapNodes(editor, { at: targetPath })
							})
						}
						if (SlateElement.isElement(node.children[0]) && !editor.isDefaultElement(node.children[0])) {
							return Editor.withoutNormalizing(editor, () => {
								Transforms.wrapNodes(editor, editor.createDefaultElement([{ text: '' }]), {
									at: path,
								})
								Transforms.unwrapNodes(editor, { at: [0, 0] })
							})
						}
					}
					if (Editor.isBlock(editor, node) && path.length > 1) {
						return Transforms.unwrapNodes(editor, { at: path })
					}
					normalizeNode(nodeEntry)
				},
			})

			return editor
		})

		const valueNodes = useRichTextFieldNodes({
			editor,
			fieldAccessor,
			contemberFieldElementCache,
		})

		const serialize = editor.serializeNodes
		const onChange = useCallback(
			(value: Descendant[]) => {
				getParent().batchUpdates(getAccessor => {
					const fieldAccessor = getAccessor().getRelativeSingleField(desugaredField)

					if (SlateNode.string({ type: 'dummy', children: value }) === '' && fieldAccessor.valueOnServer === null) {
						fieldAccessor.updateValue(null)
						return
					}

					if (SlateElement.isElement(value[0])) {
						fieldAccessor.updateValue(serialize(value[0].children))
						contemberFieldElementCache.set(getAccessor().getRelativeSingleField(desugaredField), value as SlateElement[])
					}
				})
			},
			[getParent, contemberFieldElementCache, desugaredField, serialize],
		)

		return (
			<FieldContainer
				label={props.label}
				size={props.size}
				labelDescription={props.labelDescription}
				labelPosition={props.labelPosition}
				description={props.description}
				useLabelElement={props.useLabelElement}
				errors={useAccessorErrors(fieldAccessor)}
			>
				<Slate editor={editor} value={valueNodes} onChange={onChange}>
					<EditorCanvas
						underlyingComponent={Editable}
						distinction={props.distinction}
						componentProps={{
							readOnly: isMutating,
							renderElement: editor.renderElement,
							renderLeaf: editor.renderLeaf,
							onKeyDown: editor.onKeyDown,
							onFocusCapture: editor.onFocus,
							onBlurCapture: editor.onBlur,
							onDOMBeforeInput: editor.onDOMBeforeInput,
							placeholder: props.placeholder,
						}}
					>
						<HoveringToolbars
							blockButtons={props.blockButtons}
							inlineButtons={props.inlineButtons ?? defaultInlineButtons}
						/>
					</EditorCanvas>
				</Slate>
			</FieldContainer>
		)
	},
	props => (
		<>
			<Field defaultValue={props.defaultValue} field={props.field} isNonbearing={props.isNonbearing} />
			{props.label}
			{props.labelDescription}
			{props.description}
		</>
	),
	'RichTextField',
)

const RB = RichEditor.buttons
const defaultInlineButtons: HoveringToolbarsProps['inlineButtons'] = [
	[RB.bold, RB.italic, RB.underline, RB.anchor],
	[RB.strikeThrough, RB.code],
]
