import * as React from 'react'
import { PluginOrPlugins } from 'slate-react'
import { BlocksDefinitions, InlinesDefinitions } from './types'
import { isKeyHotkey } from 'is-hotkey'

export function createRenderInlinePlugin(inlines: InlinesDefinitions, blocks: BlocksDefinitions): PluginOrPlugins {
	return {
		renderInline: (props, editor, next) => {
			const node = props.node
			const definition = inlines[node.type]
			if (definition) {
				return definition.renderInline({
					children: props.children,
					attributes: props.attributes,
					data: props.node.data.toJS(),
					setData: (newData: any) => {
						editor.setNodeByKey(node.key, { data: newData } as any)
					}
				})
			}
			return next()
		},
		onKeyDown: (event_, editor, next) => {
			const event = event_ as KeyboardEvent
			const entry = Object.entries(inlines).find(([name, definition]) =>
				isKeyHotkey(definition.keyboardShortcut || [])(event)
			)
			if (entry) {
				const [inlineName, definition] = entry
				const currentBlockTypes = editor.value.blocks.toArray().map(block => block.type)
				const currentBlockDefinitions = currentBlockTypes.map(currentBlock =>
					Object.entries(blocks).find(([blockName]) => blockName === currentBlock)
				)
				if (
					currentBlockDefinitions.every(
						b => typeof b !== 'undefined' && 'inlines' in b[1] && (b[1].inlines || []).includes(inlineName)
					)
				) {
					event.preventDefault()
					editor.wrapInline(inlineName)
				} else {
					console.warn(`Inline "${inlineName}" is not available in at least some of selected blocks.`)
				}
			} else {
				next()
			}
		}
	}
}
