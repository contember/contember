import { Component, Field, SugaredRelativeSingleField, useEntity, useEnvironment, useField } from '@contember/react-binding'
import { useReferentiallyStableCallback } from '@contember/react-utils'
import { Fragment, ReactNode, useEffect, useState } from 'react'
import { Slate, useSlate } from 'slate-react'
import { createEditor, EditorPlugin, paragraphElementType } from '@contember/react-slate-editor-base'
import { Descendant, insertNodes, Node, removeNodes, withoutNormalizing } from 'slate'

export interface BlockEditorProps {
	field: SugaredRelativeSingleField['field']
	plugins?: EditorPlugin[]
	children?: ReactNode
}

export const BlockEditor = Component<BlockEditorProps>(
	props => {

		const {
			children,
			plugins,
			field,
		} = props
		const contentField = useField(field)
		const entity = useEntity()
		const environment = useEnvironment()

		const [{ editor, OuterWrapper, InnerWrapper }] = useState(() => {
			return createEditor({ defaultElementType: paragraphElementType, plugins, entity, environment, children })
		})

		const handleEditorOnChange = useReferentiallyStableCallback((value: any) => {
			const contentJson = typeof value === 'object' && value !== null ? { formatVersion: 2, children: value } : null

			if (contentJson && contentField.value && typeof contentField.value === 'object' && 'children' in contentField.value && contentField.value.children === value) {
				return
			}

			contentField.updateValue(contentJson)
		})

		const [emptyValue] = useState(() => [editor.createDefaultElement([{ text: '' }])])

		const nodes = contentField.value && typeof contentField.value === 'object' && 'children' in contentField.value
			? (contentField.value.children as Descendant[])
			: emptyValue

		return (
			<OuterWrapper>
				<Slate editor={editor} initialValue={nodes} onChange={handleEditorOnChange}>
					<SyncValue nodes={nodes} />
					<InnerWrapper>
						{children}
					</InnerWrapper>
				</Slate>
			</OuterWrapper>
		)
	},
	(props, environment) => {
		const pluginsStatic = props.plugins?.map((plugin, index) => {
			if (typeof plugin === 'function') {
				return
			}
			if (!plugin.staticRender) {
				return
			}
			return (
				<Fragment key={index}>
					{plugin.staticRender({ children: props.children }, environment)}
				</Fragment>
			)
		})
		return (
			<>
				<Field field={props.field} />
				{pluginsStatic}
			</>
		)
	},
	'BlockEditor',
)

const SyncValue = ({ nodes }: { nodes: Descendant[] }) => {
	const editor = useSlate()
	useEffect(() => {
		if (editor.children !== nodes && JSON.stringify(editor.children) !== JSON.stringify(nodes)) {
			withoutNormalizing(editor, () => {
				for (const [, childPath] of Node.children(editor, [], {
					reverse: true,
				})) {
					removeNodes(editor, { at: childPath })
				}
				insertNodes(editor, nodes)
			})
		}

	}, [editor, nodes])
	return null
}
