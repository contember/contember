import * as React from 'react'
import { Editor as SlateEditor, Range as SlateRange, Node as SlateNode, Path as SlatePath, Transforms } from 'slate'
import { ReactEditor } from 'slate-react'
import { ContemberEditor } from '../../ContemberEditor'
import { BaseEditor, ElementNode, ElementSpecifics, WithAnotherNodeType } from '../essentials'
import { EditorWithHeadings, WithHeadings } from './EditorWithHeadings'
import { HeadingElement, headingElementType } from './HeadingElement'
import { HeadingRenderer, HeadingRendererProps } from './HeadingRenderer'

export const withHeadings = <E extends BaseEditor>(editor: E): EditorWithHeadings<E> => {
	const e: E & Partial<WithHeadings<WithAnotherNodeType<E, HeadingElement>>> = editor
	const { renderElement, insertBreak } = editor

	const isHeading = (
		element: SlateNode | ElementNode,
		suchThat?: Partial<ElementSpecifics<HeadingElement>>,
	): element is HeadingElement => ContemberEditor.isElementType(element, headingElementType, suchThat)
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

	// TODO cache this
	e.getNumberedHeadingSection = function recurse(element): number[] {
		const [topLevelIndex] = ReactEditor.findPath(e, element)
		let previousNumberedHeadingIndex: number = topLevelIndex - 1

		let previousNumberedHeading: SlateNode
		do {
			previousNumberedHeading = e.children[previousNumberedHeadingIndex--]
		} while (
			previousNumberedHeadingIndex >= 0 &&
			!(isHeading(previousNumberedHeading) && previousNumberedHeading.isNumbered)
		)

		if (previousNumberedHeadingIndex < 0) {
			return Array(element.level).fill(1)
		}
		const previousHeadingSection = recurse(previousNumberedHeading as HeadingElement)

		// Ensures the correct length - this is essentially padRight with zeros
		const normalizedPrevious = previousHeadingSection.concat(Array(element.level).fill(0)).slice(0, element.level)

		normalizedPrevious[normalizedPrevious.length - 1]++

		// The map isn't really necessary for now but would be if we introduced deeper levels
		return normalizedPrevious.map(level => Math.max(level, 1))
	}

	// TODO in the following two functions, we need to conditionally trim the selection so that it doesn't potentially
	// include empty strings at the edges of top-level elements.
	e.isWithinHeading = suchThat =>
		Array.from(ContemberEditor.topLevelNodes(e)).every(([node]) => isHeading(node, suchThat))
	e.toggleHeading = suchThat => {
		SlateEditor.withoutNormalizing(e, () => {
			const topLevelNodes = Array.from(ContemberEditor.topLevelNodes(e))

			if (topLevelNodes.every(([node]) => isHeading(node, suchThat))) {
				for (const [, path] of topLevelNodes) {
					ejectHeading(path)
				}
			} else {
				for (const [node, path] of topLevelNodes) {
					if (isHeading(node, suchThat)) {
						continue
					}
					ContemberEditor.ejectElement(e, path)
					const newProps: Partial<HeadingElement> = {
						...suchThat,
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
