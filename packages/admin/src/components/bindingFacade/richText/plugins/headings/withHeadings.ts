import * as React from 'react'
import { Editor as SlateEditor, Range as SlateRange, Node as SlateNode, Path as SlatePath, Transforms } from 'slate'
import { ContemberEditor } from '../../ContemberEditor'
import { BaseEditor, ElementNode, WithAnotherNodeType } from '../essentials'
import { EditorWithHeadings, WithHeadings } from './EditorWithHeadings'
import { HeadingElement, headingElementType } from './HeadingElement'
import { HeadingRenderer, HeadingRendererProps } from './HeadingRenderer'

export const withHeadings = <E extends BaseEditor>(editor: E): EditorWithHeadings<E> => {
	const e: E & Partial<WithHeadings<WithAnotherNodeType<E, HeadingElement>>> = editor
	const { renderElement, insertBreak } = editor

	const isHeading = (element: SlateNode | ElementNode, level?: HeadingElement['level']): element is HeadingElement =>
		element.type === headingElementType && (level === undefined || (element as HeadingElement).level === level)
	const ejectHeading = (elementPath: SlatePath) => {
		ContemberEditor.ejectElement(e, elementPath)
		Transforms.setNodes(
			e,
			{
				type: e.defaultElementType,
			},
			{
				at: elementPath,
			},
		)
	}

	e.isHeading = isHeading

	// TODO in the following two functions, we need to conditionally trim the selection so that it doesn't potentially
	// include empty strings at the edges of top-level elements.
	e.isWithinHeading = level => Array.from(ContemberEditor.topLevelNodes(e)).every(([node]) => isHeading(node, level))
	e.toggleHeading = level => {
		SlateEditor.withoutNormalizing(e, () => {
			const topLevelNodes = Array.from(ContemberEditor.topLevelNodes(e))

			if (topLevelNodes.every(([node]) => isHeading(node, level))) {
				for (const [, path] of topLevelNodes) {
					ejectHeading(path)
				}
			} else {
				for (const [node, path] of topLevelNodes) {
					if (isHeading(node, level)) {
						continue
					}
					ContemberEditor.ejectElement(e, path)
					const newProps: Partial<HeadingElement> = {
						level,
						type: headingElementType,
					}
					Transforms.setNodes(e, newProps, {
						at: path,
					})
				}
			}
		})
	}

	e.renderElement = props => {
		if (isHeading(props.element)) {
			return React.createElement(HeadingRenderer, props as HeadingRendererProps)
		}
		return renderElement(props)
	}

	e.insertBreak = () => {
		SlateEditor.withoutNormalizing(e, () => {
			insertBreak()

			const { selection } = e

			if (selection === null || SlateRange.isExpanded(selection)) {
				return
			}
			const [topLevelElement, path] = SlateEditor.node(e, selection, {
				depth: 1,
			})
			// TODO this is too naive. If the next sibling already was a heading, this will ruin it.
			if (isHeading(topLevelElement)) {
				ejectHeading(path)
			}
		})
	}

	return (e as unknown) as EditorWithHeadings<E>
}
