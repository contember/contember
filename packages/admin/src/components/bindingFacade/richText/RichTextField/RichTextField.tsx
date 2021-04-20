import {
	Component,
	Field,
	FieldAccessor,
	FieldBasicProps,
	QueryLanguage,
	useEntity,
	useMutationState,
} from '@contember/binding'
import { EditorCanvas, FormGroup, FormGroupProps } from '@contember/ui'
import { FunctionComponent, useCallback, useMemo, useState } from 'react'
import { Editor, Node as SlateNode, NodeEntry, Transforms } from 'slate'
import { Editable, Slate } from 'slate-react'
import { ElementNode } from '../baseEditor'
import { createEditor, CreateEditorPublicOptions } from '../editorFactory'
import { paragraphElementType } from '../plugins'
import { RichEditor } from '../RichEditor'
import { HoveringToolbars, HoveringToolbarsProps } from '../toolbars'
import { useRichTextFieldNodes } from './useRichTextFieldNodes'

export interface RichTextFieldProps
	extends FieldBasicProps,
		Omit<FormGroupProps, 'children' | 'errors'>,
		CreateEditorPublicOptions,
		HoveringToolbarsProps {}

export const RichTextField: FunctionComponent<RichTextFieldProps> = Component(
	props => {
		const entity = useEntity()
		const environment = entity.environment
		const getParent = entity.getAccessor

		const desugaredField = useMemo(() => QueryLanguage.desugarRelativeSingleField(props, environment), [
			environment,
			props,
		])
		const fieldAccessor = useMemo(() => entity.getRelativeSingleField<string>(desugaredField), [entity, desugaredField])

		// The cache is questionable, really.
		const [contemberFieldElementCache] = useState(() => new WeakMap<FieldAccessor<string>, ElementNode[]>())
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

					if (path.length === 0) {
						// Enforce that there's exactly one child and that it's
						if (node.children.length > 1) {
							return Editor.withoutNormalizing(editor, () => {
								const targetPath = [0, (editor.children[0] as ElementNode).children.length]
								Transforms.moveNodes(editor, {
									at: [1],
									to: targetPath,
								})
								Transforms.unwrapNodes(editor, { at: targetPath })
							})
						}
						if (!editor.isDefaultElement(node.children[0])) {
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
			(value: SlateNode[]) => {
				getParent().batchUpdates(getAccessor => {
					const fieldAccessor = getAccessor().getRelativeSingleField(desugaredField)

					if (SlateNode.string({ children: value }) === '') {
						fieldAccessor.updateValue(fieldAccessor.valueOnServer === null ? null : '')
						return
					}

					fieldAccessor.updateValue(serialize(value[0].children))
					contemberFieldElementCache.set(getAccessor().getRelativeSingleField(desugaredField), value as ElementNode[])
				})
			},
			[getParent, contemberFieldElementCache, desugaredField, serialize],
		)

		return (
			<FormGroup
				label={props.label}
				size={props.size}
				labelDescription={props.labelDescription}
				labelPosition={props.labelPosition}
				description={props.description}
				useLabelElement={props.useLabelElement}
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
						<HoveringToolbars
							blockButtons={props.blockButtons}
							inlineButtons={props.inlineButtons ?? defaultInlineButtons}
						/>
					</EditorCanvas>
				</Slate>
			</FormGroup>
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
