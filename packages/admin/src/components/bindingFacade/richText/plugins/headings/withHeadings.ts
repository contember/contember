import * as React from 'react'
import { Editor as SlateEditor, Element as SlateElement, Node as SlateNode, NodeEntry, Transforms } from 'slate'
import { ContemberEditor } from '../../ContemberEditor'
import { BaseEditor, ElementNode, WithAnotherNodeType } from '../essentials'
import { EditorWithHeadings, WithHeadings } from './EditorWithHeadings'
import { HeadingElement, headingElementType } from './HeadingElement'
import { HeadingRenderer, HeadingRendererProps } from './HeadingRenderer'

export const withHeadings = <E extends BaseEditor>(editor: E): EditorWithHeadings<E> => {
	const e: E & Partial<WithHeadings<WithAnotherNodeType<E, HeadingElement>>> = editor
	const { renderElement, insertBreak } = editor

	const isHeading = (element: SlateNode | ElementNode): element is HeadingElement => element.type === headingElementType
	const getClosestHeading = (level?: HeadingElement['level']) =>
		SlateEditor.above(e, {
			match: node => isHeading(node) && (level === undefined || node.level === level),
		})
	const ejectHeading = (heading: NodeEntry) => {
		const [, path] = heading
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

	e.isHeading = isHeading
	e.isWithinHeading = level => getClosestHeading(level) !== undefined
	e.toggleHeading = level => {
		SlateEditor.withoutNormalizing(e, () => {
			const closestHeading = getClosestHeading(level)
			if (closestHeading === undefined) {
				// We manually filter out void nodes because it appears that Slate doesn't respect the voids setting from here.
				// The combination of isElement and mode: 'highest' is really just a roundabout way of excluding the Editor.
				const match = (node: SlateNode) => SlateElement.isElement(node) && !e.isVoid(node)
				const nodes = SlateEditor.nodes(e, {
					match,
					mode: 'highest',
					voids: false,
				})
				for (const [, path] of nodes) {
					ContemberEditor.ejectElement(e, path)
					const newProps: Partial<HeadingElement> = {
						level,
						type: headingElementType,
					}
					Transforms.setNodes(e, newProps, {
						at: path,
					})
				}
			} else {
				ejectHeading(closestHeading)
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
		insertBreak()

		const closestHeading = getClosestHeading()
		if (closestHeading === undefined) {
			return
		}
		// TODO this is too naive. If the next sibling already was a heading, this will ruin it.
		ejectHeading(closestHeading)
	}

	return (e as unknown) as EditorWithHeadings<E>
}
