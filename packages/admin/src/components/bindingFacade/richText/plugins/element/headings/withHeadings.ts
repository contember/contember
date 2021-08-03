import { createElement } from 'react'
import {
	Editor,
	Editor as SlateEditor,
	Element as SlateElement,
	Node as SlateNode,
	Path as SlatePath,
	Point,
	Range as SlateRange,
	Transforms,
} from 'slate'
import type { BaseEditor, ElementNode, ElementSpecifics, WithAnotherNodeType } from '../../../baseEditor'
import { ContemberEditor } from '../../../ContemberEditor'
import type { EditorWithHeadings, WithHeadings } from './EditorWithHeadings'
import { HeadingElement, headingElementType } from './HeadingElement'
import { HeadingRenderer, HeadingRendererProps } from './HeadingRenderer'

export const withHeadings = <E extends BaseEditor>(editor: E): EditorWithHeadings<E> => {
	const e: E & Partial<WithHeadings<WithAnotherNodeType<E, HeadingElement>>> = editor
	const {
		canToggleElement,
		canContainAnyBlocks,
		renderElement,
		insertBreak,
		toggleElement,
		deleteBackward,
		processBlockPaste,
	} = editor

	const isHeading = (
		element: SlateNode | ElementNode,
		suchThat?: Partial<ElementSpecifics<HeadingElement>>,
	): element is HeadingElement => ContemberEditor.isElementType(element, headingElementType, suchThat)
	const ejectHeading = (elementPath: SlatePath) => {
		ContemberEditor.ejectElement(e, elementPath)
		Transforms.setNodes(e, { type: e.defaultElementType }, { at: elementPath })
	}

	e.isHeading = isHeading

	// T O D O cache this
	// e.getNumberedHeadingSection = function recurse(element): number[] {
	// 	const [topLevelIndex] = ReactEditor.findPath(e, element)
	// 	let previousNumberedHeadingIndex: number = topLevelIndex - 1
	//
	// 	let previousNumberedHeading: SlateNode
	// 	do {
	// 		previousNumberedHeading = e.children[previousNumberedHeadingIndex--]
	// 	} while (
	// 		previousNumberedHeadingIndex >= 0 &&
	// 		!(isHeading(previousNumberedHeading) && previousNumberedHeading.isNumbered)
	// 	)
	//
	// 	if (previousNumberedHeadingIndex < 0) {
	// 		return Array(element.level).fill(1)
	// 	}
	// 	const previousHeadingSection = recurse(previousNumberedHeading as HeadingElement)
	//
	// 	// Ensures the correct length - this is essentially padRight with zeros
	// 	const normalizedPrevious = previousHeadingSection.concat(Array(element.level).fill(0)).slice(0, element.level)
	//
	// 	normalizedPrevious[normalizedPrevious.length - 1]++
	//
	// 	// The map isn't really necessary for now but would be if we introduced deeper levels
	// 	return normalizedPrevious.map(level => Math.max(level, 1))
	// }

	e.canToggleElement = (elementType, suchThat) => {
		if (elementType !== headingElementType) {
			return canToggleElement(elementType, suchThat)
		}
		if (!editor.selection) {
			return false
		}
		const closestBlockEntry = ContemberEditor.closestBlockEntry(editor)
		if (closestBlockEntry === undefined) {
			return true
		}
		const [closestBlockElement, closestBlockPath] = closestBlockEntry

		return (
			closestBlockPath.length === 1 && (e.isDefaultElement(closestBlockElement) || e.isHeading!(closestBlockElement))
		)
	}

	// TODO in the following function, we need to conditionally trim the selection so that it doesn't potentially
	// 	include empty strings at the edges of top-level elements.
	e.toggleElement = (elementType, suchThat) => {
		if (elementType === headingElementType) {
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
		return toggleElement(elementType, suchThat)
	}

	e.canContainAnyBlocks = element => (element.type === headingElementType ? false : canContainAnyBlocks(element))

	e.renderElement = props => {
		if (isHeading(props.element)) {
			return createElement(HeadingRenderer, props as HeadingRendererProps)
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

	e.deleteBackward = unit => {
		const selection = e.selection
		if (unit !== 'character' || !selection || !SlateRange.isCollapsed(selection) || selection.focus.offset !== 0) {
			return deleteBackward(unit)
		}
		// The offset being zero doesn't necessarily imply that selection refers to the start of a heading.
		// It's just a way to early-exit.

		const closestNumberedEntry = Editor.above<HeadingElement>(e, {
			match: node => SlateElement.isElement(node) && isHeading(node, { isNumbered: true }),
		})
		if (closestNumberedEntry === undefined) {
			return deleteBackward(unit)
		}
		const [, headingPath] = closestNumberedEntry
		const headingStartPoint = Editor.start(editor, headingPath)

		if (!Point.equals(headingStartPoint, selection.focus)) {
			return deleteBackward(unit)
		}
		Transforms.setNodes(
			editor,
			{ isNumbered: null }, // null removes the key altogether
			{ at: headingPath },
		)
	}

	e.processBlockPaste = (element, next, cumulativeTextAttrs) => {
		const match = element.nodeName.match(/^H(?<level>[1-6])$/)
		if (match !== null) {
			const isNumbered = (element.getAttribute('style')?.match(/mso-list:\w+ level\d+ \w+/) ?? null) !== null
			const children = isNumbered ? editor.wordPasteListItemContent(element.childNodes) : element.childNodes
			return {
				type: headingElementType,
				level: parseInt(match.groups!.level),
				children: next(children, cumulativeTextAttrs),
				isNumbered,
			}
		}
		return processBlockPaste(element, next, cumulativeTextAttrs)
	}

	return e as unknown as EditorWithHeadings<E>
}
