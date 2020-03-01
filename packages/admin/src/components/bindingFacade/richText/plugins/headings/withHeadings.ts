import * as React from 'react'
import { Editor as SlateEditor, Node as SlateNode, Path as SlatePath, Transforms } from 'slate'
import { ReactEditor } from 'slate-react'
import { ContemberEditor } from '../../ContemberEditor'
import { BaseEditor, ElementNode, WithAnotherNodeType } from '../essentials'
import { EditorWithHeadings, WithHeadings } from './EditorWithHeadings'
import { HeadingElement, headingElementType } from './HeadingElement'
import { HeadingRenderer, HeadingRendererProps } from './HeadingRenderer'

export const withHeadings = <E extends BaseEditor>(editor: E): EditorWithHeadings<E> => {
	const e: E & Partial<WithHeadings<WithAnotherNodeType<E, HeadingElement>>> = editor
	const { renderElement } = editor

	const isHeading = (element: SlateNode | ElementNode): element is HeadingElement => element.type === headingElementType
	const getClosestHeading = (level: HeadingElement['level']) =>
		ContemberEditor.getClosestParent(e, {
			match: node => isHeading(node) && node.level === level,
		})

	e.isHeading = isHeading
	e.isWithinHeading = level => getClosestHeading(level) !== undefined
	e.toggleHeading = (level, matchRoot) => {
		SlateEditor.withoutNormalizing(e, () => {
			const closestHeading = getClosestHeading(level)
			if (closestHeading === undefined) {
				const match = matchRoot ?? ((node: SlateNode) => ReactEditor.findPath(e, node).length === 1)
				const root = ContemberEditor.getClosestParent(e, {
					match,
				})
				if (root === undefined) {
					return
				}
				const [, path] = root
				ContemberEditor.ejectElement(e, path)
				const newProps: Partial<HeadingElement> = {
					level,
					type: headingElementType,
				}
				Transforms.setNodes(e, newProps, {
					at: path,
				})
			} else {
				const [, path] = closestHeading
				ContemberEditor.ejectElement(e, path)
				Transforms.setNodes(
					e,
					{
						type: e.defaultElementType,
					},
					{
						at: path,
					},
				)
			}
		})
	}

	e.renderElement = props => {
		if (isHeading(props.element)) {
			return React.createElement(HeadingRenderer, props as HeadingRendererProps)
		}
		return renderElement(props)
	}

	return (e as unknown) as EditorWithHeadings<E>
}
