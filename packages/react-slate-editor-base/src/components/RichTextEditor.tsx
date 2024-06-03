import { Component, Field, FieldAccessor, FieldBasicProps, QueryLanguage, useEntity } from '@contember/react-binding'
import { FunctionComponent, useCallback, useMemo, useState } from 'react'
import { Descendant, Editor, Element as SlateElement, Node as SlateNode, NodeEntry, Transforms } from 'slate'
import { Slate } from 'slate-react'
import { createEditor, CreateEditorPublicOptions } from '../editor'
import { paragraphElementType } from '../plugins'
import { useRichTextFieldNodes } from '../internal/hooks/useRichTextFieldNodes'

export type RichTextEditorProps =
	& FieldBasicProps
	& CreateEditorPublicOptions
	& {
		children: React.ReactNode
	}

/**
 * Rich text field supports more advanced formatting capabilities. Output of this field is a JSON.
 *
 * @group Form Fields
 */
export const RichTextEditor: FunctionComponent<RichTextEditorProps> = Component(
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


		const [editor] = useState(() => {
			const { editor } = createEditor({
				plugins: props.plugins,
				defaultElementType: paragraphElementType,
				entity,
				environment,
				children: props.children,
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
					if (SlateElement.isElement(node) && Editor.isBlock(editor, node) && path.length > 1) {
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
				<Slate editor={editor} initialValue={valueNodes} onChange={onChange}>
					{props.children}
				</Slate>
		)
	},
	props => (
		<>
			<Field defaultValue={props.defaultValue} field={props.field} isNonbearing={props.isNonbearing} />
		</>
	),
	'RichTextEditor',
)

