import {
	addNewEntityAtIndex,
	BindingError,
	EntityAccessor,
	EntityListAccessor,
	FieldValue,
	RelativeEntityList,
	RelativeSingleField,
	RemovalType,
} from '@contember/binding'
import * as React from 'react'
import { Element, Node as SlateNode, Operation, Range as SlateRange, Transforms } from 'slate'
import { assertNever } from '../../../../utils'
import { NormalizedBlock } from '../../blocks'
import { createEditorWithEssentials, withAnchors, withBasicFormatting, withParagraphs } from '../plugins'
import { isContemberBlockElement } from './elements'
import { NormalizedFieldBackedElement } from './FieldBackedElement'
import { BlockEditorElementRenderer } from './renderers'

export interface CreateEditorOptions {
	batchUpdates: EntityAccessor['batchUpdates']
	desugaredEntityList: RelativeEntityList
	discriminationField: RelativeSingleField
	entityListAccessorRef: React.MutableRefObject<EntityListAccessor>
	isMutatingRef: React.MutableRefObject<boolean>
	normalizedBlocksRef: React.MutableRefObject<NormalizedBlock[]>
	normalizedLeadingFieldsRef: React.MutableRefObject<NormalizedFieldBackedElement[]>
	normalizedTrailingFieldsRef: React.MutableRefObject<NormalizedFieldBackedElement[]>
	removalType: RemovalType
	sortableByField: RelativeSingleField
	sortedEntitiesRef: React.MutableRefObject<EntityAccessor[]>
	textBlockDiscriminant: FieldValue
	textBlockField: RelativeSingleField
	textElementCache: WeakMap<EntityAccessor, Element>
}

export const createEditor = (options: CreateEditorOptions) => {
	// TODO configurable plugin set
	const editor = withParagraphs(withAnchors(withBasicFormatting(createEditorWithEssentials())))

	const { isVoid, apply, renderElement, onFocus, onBlur, insertNode } = editor

	const {
		batchUpdates,
		desugaredEntityList,
		discriminationField,
		entityListAccessorRef,
		isMutatingRef,
		normalizedBlocksRef,
		normalizedLeadingFieldsRef,
		normalizedTrailingFieldsRef,
		removalType,
		sortableByField,
		sortedEntitiesRef,
		textBlockDiscriminant,
		textBlockField,
		textElementCache,
	} = options

	const getFirstContentIndex = () => normalizedLeadingFieldsRef.current.length

	editor.isVoid = element => isContemberBlockElement(element) || isVoid(element)

	editor.renderElement = props => {
		return (
			<BlockEditorElementRenderer
				normalizedBlocks={normalizedBlocksRef.current}
				fallbackRenderer={renderElement}
				removalType={removalType}
				element={props.element}
				attributes={props.attributes}
				children={props.children}
				discriminationField={discriminationField}
				getEntityByKey={key => {
					const entity = entityListAccessorRef.current.getByKey(key)
					if (!(entity instanceof EntityAccessor)) {
						throw new BindingError(`Corrupted data.`)
					}
					return entity
				}}
				getNormalizedFieldBackedElement={element => {
					let normalizedElements: NormalizedFieldBackedElement[]
					if (element.position === 'leading') {
						normalizedElements = normalizedLeadingFieldsRef.current
					} else if (element.position === 'trailing') {
						normalizedElements = normalizedTrailingFieldsRef.current
					} else {
						return assertNever(element.position)
					}
					return normalizedElements[element.index]
				}}
			/>
		)
	}
	editor.onFocus = e => {
		if (
			editor.children.length -
				normalizedLeadingFieldsRef.current.length -
				normalizedTrailingFieldsRef.current.length ===
			0
		) {
			Transforms.insertNodes(
				editor,
				{
					type: 'paragraph',
					children: [{ text: '' }],
				},
				{
					at: [getFirstContentIndex()],
				},
			)
		}
		// TODO also handle the non-empty case. Find and set_selection to the nearest node.
		onFocus(e)
	}

	editor.onBlur = e => {
		if (
			editor.children.length -
				normalizedLeadingFieldsRef.current.length -
				normalizedTrailingFieldsRef.current.length ===
			1
		) {
			const firstContentIndex = getFirstContentIndex()
			const soleElement = editor.children[firstContentIndex] as Element
			if (editor.isParagraph(soleElement) && soleElement.children.length === 1) {
				if (SlateNode.string(soleElement) === '') {
					Transforms.removeNodes(editor, {
						at: [firstContentIndex],
					})
				}
			}
		}
		onBlur(e)
	}

	editor.insertNode = node => {
		if (!isContemberBlockElement(node)) {
			return insertNode(node)
		}

		const selection = editor.selection

		if (!selection || SlateRange.isExpanded(selection)) {
			return
		}
		const [topLevelIndex] = selection.focus.path
		Transforms.insertNodes(editor, node, {
			at: [topLevelIndex + 1],
		})
	}

	editor.apply = (operation: Operation) => {
		if (isMutatingRef.current) {
			return
		}

		const entityList = entityListAccessorRef.current
		let sortedEntities = sortedEntitiesRef.current

		entityList.batchUpdates(getAccessor => {
			const getFreshEntity = (sortedIndex: number): EntityAccessor => {
				const oldEntityKey = sortedEntities[sortedIndex].getKey()
				const newEntity = getAccessor().getByKey(oldEntityKey)
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
