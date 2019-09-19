import * as React from 'react'
import { PluginOrPlugins } from 'slate-react'
import { Block, PathUtils } from 'slate'
import { AddBlockButton } from './AddBlockButton'
import { BlocksDefinitions } from './types'
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc'
import { DragHandle } from '../../ui'
import { AccessorContext } from '../../../binding/coreComponents'

const Handle = SortableHandle(() => (
	<div className="richEditor-handle" contentEditable={false}>
		<DragHandle />
	</div>
))

const Container = React.memo(
	SortableContainer<{ children: React.ReactNode }>(({ children }: { children: React.ReactNode }) => {
		return <>{children}</>
	}),
)

const Element = SortableElement<{ children: React.ReactNode }>(({ children }: { children: React.ReactNode }) => {
	return (
		<div className="richEditor-sortable">
			<Handle />
			<div>{children}</div>
		</div>
	)
})

export function createRenderBlockPlugin(blocks: BlocksDefinitions): PluginOrPlugins {
	return {
		renderEditor: (props, editor, next) => {
			return (
				<Container
					useDragHandle
					lockAxis="y"
					onSortEnd={(sort, event) => {
						editor.moveNodeByPath(PathUtils.create([sort.oldIndex]), PathUtils.create([]), sort.newIndex)
					}}
					shouldCancelStart={e => {
						return false
					}}
					useWindowAsScrollContainer={true}
				>
					{next()}
				</Container>
			)
		},
		renderBlock: (props, editor, next) => {
			const node = props.node
			const definition = blocks[node.type]

			if (props.parent.object !== 'document') {
				throw new Error('Only to top-level blocks are supported')
			}

			if (definition) {
				const index = props.parent.nodes.indexOf(node)
				const isLast = index === props.parent.nodes.size - 1
				const accessor = node.data.get('accessor')
				const addBlock = (blockName: string, after: boolean) => {
					const blockToAdd = Block.create(blockName)
					const insertionIndex = after ? index + 1 : index
					editor.insertNodeByKey(props.parent.key, insertionIndex, blockToAdd)
				}
				const content: React.ReactNode = (
					<div>
						{definition.renderBlock !== undefined ? (
							definition.renderBlock({ children: props.children })
						) : (
							<AccessorContext.Provider value={accessor}>{definition.render}</AccessorContext.Provider>
						)}
					</div>
				)
				return (
					<AddBlockButton attributes={props.attributes} availableBlocks={blocks} addBlock={addBlock} isLast={isLast}>
						<Element index={index}>{content}</Element>
					</AddBlockButton>
				)
			}
			return next()
		},
	}
}
