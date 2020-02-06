import {
	addNewEntityAtIndex,
	BindingError,
	EntityAccessor,
	EntityListAccessor,
	FieldValue,
	RelativeSingleField,
	RemovalType,
	sortEntities,
} from '@contember/binding'
import * as React from 'react'
import { Element, Operation, Text, Transforms } from 'slate'
import { RenderElementProps } from 'slate-react'
import { NormalizedBlock } from '../../blocks'
import { createEditorWithEssentials, withAnchors, withBasicFormatting, withParagraphs } from '../plugins'
import { ContemberBlockElement, contemberBlockElementType, isContemberBlockElement } from './ContemberBlockElement'
import { BlockEditorElementRenderer } from './renderers'

export interface CreateEditorOptions {
	entityListRef: React.MutableRefObject<EntityListAccessor>
	isMutatingRef: React.MutableRefObject<boolean>
	sortedEntitiesRef: React.MutableRefObject<EntityAccessor[]>
	normalizedBlocksRef: React.MutableRefObject<NormalizedBlock[]>
	textBlockDiscriminant: FieldValue
	discriminationField: RelativeSingleField
	sortableByField: RelativeSingleField
	textBlockField: RelativeSingleField
	textElementCache: WeakMap<EntityAccessor, Element>
	removalType: RemovalType
}

export const createEditor = (options: CreateEditorOptions) => {
	// TODO configurable plugin set
	const editor = withParagraphs(withAnchors(withBasicFormatting(createEditorWithEssentials())))

	const { isVoid, apply, renderElement, onFocus, onBlur } = editor

	const {
		discriminationField,
		textElementCache,
		removalType,
		sortableByField,
		textBlockDiscriminant,
		textBlockField,
	} = options

	editor.isVoid = element => {
		if (element.type === contemberBlockElementType) {
			return true
		}
		return isVoid(element)
	}
	editor.renderElement = props => {
		return (
			<BlockEditorElementRenderer
				normalizedBlocks={options.normalizedBlocksRef.current}
				fallbackRenderer={renderElement}
				removalType={removalType}
				element={props.element}
				attributes={props.attributes}
				children={props.children}
				discriminationField={discriminationField}
				getEntityByKey={key => {
					const entity = options.entityListRef.current.entities.find(entity => entity?.getKey() === key)
					if (!(entity instanceof EntityAccessor)) {
						throw new BindingError(`Corrupted data.`)
					}
					return entity
				}}
			/>
		)
	}
	editor.onFocus = e => {
		if (editor.children.length === 0) {
			Transforms.insertNodes(
				editor,
				{
					type: 'paragraph',
					children: [{ text: '' }],
				},
				{
					at: [0],
				},
			)
		}
		// TODO also handle the non-empty case. Find and set_selection to the nearest node.
		onFocus(e)
	}

	editor.onBlur = e => {
		if (editor.children.length === 1) {
			const soleElement = editor.children[0] as Element
			if (editor.isParagraph(soleElement) && soleElement.children.length === 1) {
				const soleText = soleElement.children[0]

				if (Text.isText(soleText) && soleText.text === '') {
					Transforms.removeNodes(editor, {
						at: [0],
					})
				}
			}
		}
		onBlur(e)
	}

	editor.apply = (operation: Operation) => {
		if (options.isMutatingRef.current) {
			return
		}

		const entityList = options.entityListRef.current
		let sortedEntities = options.sortedEntitiesRef.current

		entityList.batchUpdates?.(getAccessor => {
			const getFreshEntity = (sortedIndex: number): EntityAccessor => {
				const oldEntityKey = sortedEntities[sortedIndex].getKey()
				const newEntity = getAccessor().entities.find(entity => entity?.getKey() === oldEntityKey)
				if (!(newEntity instanceof EntityAccessor)) {
					throw new BindingError(`Corrupted data`)
				}
				return newEntity
			}
			const saveTextElementAt = (index: number, entity: EntityAccessor = getFreshEntity(index)) => {
				const targetElement = editor.children[index]
				if (!Element.isElement(targetElement)) {
					throw new BindingError(`Corrupted data`)
				}
				entity.getRelativeSingleField(textBlockField).updateValue?.(JSON.stringify(targetElement))
				const updatedEntity = getFreshEntity(index)
				textElementCache.set(updatedEntity, targetElement)
				sortedEntities[index] = updatedEntity
			}
			const removeElementAt = (index: number) => {
				sortedEntities[index].remove?.(removalType)
				sortedEntities.splice(index, 1)
			}
			const addNewDiscriminatedEntityAt = (index: number, blockDiscriminant: FieldValue): EntityAccessor => {
				addNewEntityAtIndex(getAccessor(), sortableByField, index, (getInnerAccessor, newEntityIndex) => {
					const newEntity = getInnerAccessor().entities[newEntityIndex] as EntityAccessor
					newEntity.getRelativeSingleField(discriminationField).updateValue?.(blockDiscriminant)
					sortedEntities[index] = getInnerAccessor().entities[newEntityIndex] as EntityAccessor
				})
				return sortedEntities[index]
			}
			const addNewTextElementAt = (index: number) => {
				const newEntity = addNewDiscriminatedEntityAt(index, textBlockDiscriminant)
				saveTextElementAt(index, newEntity)
			}

			if (operation.type === 'set_selection') {
				return apply(operation) // Nothing to do here
			}

			const { path } = operation
			const [topLevelIndex] = path

			if (path.length === 0) {
				// Technically, the path could also be [], indicating that we're operating on the editor itself.
				// This is branch is entirely speculative. I *THINK* it could feasibly happen but I don't know when or how.
				return apply(operation) // ?!?!!???
			} else if (path.length > 1) {
				apply(operation)
				saveTextElementAt(topLevelIndex)
				return // We only care about top-level operations from here.
			}

			switch (operation.type) {
				case 'set_node':
					apply(operation)
					saveTextElementAt(topLevelIndex)
					break
				case 'merge_node': {
					apply(operation)
					removeElementAt(topLevelIndex)
					saveTextElementAt(topLevelIndex - 1)
					return
				}
				case 'split_node': {
					if (isContemberBlockElement(editor.children[topLevelIndex])) {
						throw new BindingError(`Cannot perform the '${operation.type}' operation on a contember block.`)
					}
					apply(operation)
					saveTextElementAt(topLevelIndex)
					addNewTextElementAt(topLevelIndex + 1)
					return
				}
				case 'insert_text':
				case 'remove_text': {
					const {
						path: [topLevelIndex],
					} = operation
					if (isContemberBlockElement(editor.children[topLevelIndex])) {
						throw new BindingError(`Cannot perform the '${operation.type}' operation on a contember block.`)
					}
					apply(operation)
					saveTextElementAt(topLevelIndex)
					return
				}

				case 'insert_node': {
					let { node } = operation
					if (!Element.isElement(node)) {
						throw new BindingError()
					}
					let blockType: FieldValue

					if (isContemberBlockElement(node)) {
						blockType = node.blockType
						const entity = addNewDiscriminatedEntityAt(topLevelIndex, blockType)
						apply(operation)
						// TODO cache?
						sortedEntities[topLevelIndex] = entity
					} else {
						apply(operation)
						addNewTextElementAt(topLevelIndex)
					}
					break
				}
				case 'remove_node': {
					apply(operation)
					removeElementAt(topLevelIndex)
					return
				}
				case 'move_node':
					// TODO Not even slate-react supports this at the moment
					apply(operation)
					break
			}
		})
	}

	return editor
}
