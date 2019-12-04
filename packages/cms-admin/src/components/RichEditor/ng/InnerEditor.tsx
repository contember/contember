import { GraphQlBuilder } from '@contember/client'
import { default as Immutable, List } from 'immutable'
import * as React from 'react'
import { MutableRefObject, useCallback, useMemo, useRef, useState } from 'react'
import { Block, Data, Document, Inline, Rules, Selection, Text, Value } from 'slate'
import { Editor, EditorProps, OnChangeFn, Plugin } from 'slate-react'
import {
	EntityAccessor,
	EntityListAccessor,
	FieldAccessor,
	getRelativeSingleField,
	HasManyProps,
	SugaredRelativeSingleField,
	useDesugaredRelativeSingleField,
} from '../../../binding'
import { generateUuid } from '../utils'
import { HoverMenuManager } from './HoverMenuManager'
import JsonBlockSerializer from './JsonBlockSerializer'
import { createPastePlugin } from './onPastePlugin'
import OperationProcessor from './OperationProcessor'
import { createRenderBlockPlugin } from './renderBlock'
import { createRenderInlinePlugin } from './renderInline'
import { createPluginsFromMarks } from './renderMark'
import { BlocksDefinitions, InlinesDefinitions, MarksDefinitions } from './types'

export interface RTEProps extends HasManyProps {
	sortBy: SugaredRelativeSingleField['name']
	name: SugaredRelativeSingleField['name']
	blocks: BlocksDefinitions
	defaultBlock: string
	marks: MarksDefinitions
	inlines?: InlinesDefinitions
}

interface RTEInnerProps extends RTEProps {
	accessor: EntityListAccessor
}

export const InnerEditor: React.FC<RTEInnerProps> = props => {
	const { sortBy, accessor, name, blocks, defaultBlock, marks, inlines } = props
	const [docId] = useState(generateUuid())
	const [valueData, setValueData] = useState<Data | undefined>()
	const [selection, setSelection] = useState<Selection>()
	const nameField = useDesugaredRelativeSingleField(name)
	const sortByField = useDesugaredRelativeSingleField(sortBy)
	const entityAccessors = useMemo(
		() =>
			accessor.entities
				.filter((t): t is EntityAccessor => t instanceof EntityAccessor)
				.sort((a, b) => {
					const [aField, bField] = [getRelativeSingleField(a, sortByField), getRelativeSingleField(b, sortByField)]

					if (
						aField instanceof FieldAccessor &&
						bField instanceof FieldAccessor &&
						typeof aField.currentValue === 'number' &&
						typeof bField.currentValue === 'number'
					) {
						return aField.currentValue - bField.currentValue
					}
					return 0
				}),
		[accessor.entities, sortByField],
	)
	const [blockCache] = useState(() => new WeakMap<EntityAccessor, Block>())
	const document = useMemo(() => {
		const blockNodesSerializer = new JsonBlockSerializer()
		return Document.create({
			key: docId,
			nodes: entityAccessors.map(entityAccessor => {
				if (blockCache.has(entityAccessor)) {
					return blockCache.get(entityAccessor)!
				}

				let type = getRelativeSingleField(entityAccessor, nameField).currentValue
				if (type === null) {
					type = props.defaultBlock
				}
				if (type instanceof GraphQlBuilder.Literal) {
					type = type.value
				}
				if (typeof type !== 'string') {
					throw new Error('')
				}
				const definition = blocks[type]
				if (definition === undefined) throw new Error(`Unknown type ${type}.`)

				let nodes: Immutable.List<Block | Text | Inline>
				if (definition.renderBlock !== undefined) {
					const fieldAccessor = entityAccessor.data.getField(definition.valueField)
					if (!(fieldAccessor instanceof FieldAccessor)) {
						throw new Error('')
					}
					const currentValue = fieldAccessor.currentValue || ''
					if (typeof currentValue !== 'string') {
						throw new Error('')
					}
					nodes = blockNodesSerializer.deserialize(currentValue)
				} else {
					nodes = List([
						Text.create({
							key: entityAccessor.getKey() + '-text',
						}),
					])
				}

				const slateBlock = Block.create({
					key: entityAccessor.getKey(),
					type: type,
					data: {
						accessor: entityAccessor,
					},
					nodes: nodes,
				})
				blockCache.set(entityAccessor, slateBlock)
				return slateBlock
			}),
		})
	}, [docId, entityAccessors, blockCache, nameField, blocks, props.defaultBlock])

	const onChange: OnChangeFn = useCallback(
		({ value }) => {
			const processor = new OperationProcessor(accessor, sortByField, nameField, blocks, defaultBlock)

			processor.processValue(value)

			const selection = value.selection
			const isInCustomBlock = value.blocks.some(
				node => node !== undefined && blocks[node.type].renderBlock === undefined,
			)

			setValueData(value.data)

			if (!isInCustomBlock) {
				setSelection(selection)
			} else {
				setSelection(undefined)
			}
		},
		[accessor, sortByField, nameField, blocks, defaultBlock],
	)

	const [schemaCache] = useState(() => new WeakMap<BlocksDefinitions, EditorProps['schema']>())
	const schema = useMemo(() => {
		if (schemaCache.has(blocks)) {
			return schemaCache.get(blocks)
		}

		const voidBlockTypes: string[] = Object.entries(blocks)
			.filter(([key, value]) => value.renderBlock === undefined)
			.map(([name]) => name)
		const result = {
			blocks: Object.fromEntries<Rules>(voidBlockTypes.map(name => [name, { isVoid: true }])),
		}

		schemaCache.set(blocks, result)
		return result
	}, [blocks, schemaCache])

	const plugins = useMemo(() => {
		return [
			createPluginsFromMarks(marks, blocks),
			createRenderBlockPlugin(blocks),
			createPastePlugin([blocks, marks, inlines || { htmlSerializer: {} }]),
			inlines !== undefined ? createRenderInlinePlugin(inlines, blocks) : [],
		]
	}, [marks, blocks, inlines])

	const renderEditor: Plugin['renderEditor'] = useCallback(
		(editorProps, editor, next) => {
			return (
				<>
					{next()}
					<HoverMenuManager editor={editor} blocks={blocks} marks={marks} inlines={inlines} />
				</>
			)
		},
		[blocks, marks, inlines],
	)

	const editorRef = useRef<Editor | null>()

	return (
		<Editor
			ref={editorRef as MutableRefObject<Editor | null>}
			schema={schema}
			plugins={plugins}
			value={Value.create({
				selection: selection,
				document: document,
				data: valueData,
			})}
			onChange={onChange}
			renderEditor={renderEditor}
		/>
	)
}
