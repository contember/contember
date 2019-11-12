import { BlocksDefinitions, MarksDefinitions } from './types'
import { Plugins } from 'slate-react'
import isKeyHotkey from 'is-hotkey'

export function createPluginsFromMarks(marks: MarksDefinitions, blocks: BlocksDefinitions): Plugins {
	return Object.entries(marks).map(([markType, definition]) => {
		const isHotkey = isKeyHotkey(definition.keyboardShortcut || [])

		return {
			renderMark: (props, editor, next) => {
				if (props.mark.type === markType) {
					return definition.renderMark(props)
				}
				return next()
			},
			onKeyDown: (event_, editor, next) => {
				const event = event_.nativeEvent
				if (isHotkey(event)) {
					const currentBlockTypes = editor.value.blocks.toArray().map(block => block.type)
					const currentBlockDefinitions = currentBlockTypes.map(currentBlock =>
						Object.entries(blocks).find(([blockName]) => blockName === currentBlock),
					)
					if (
						currentBlockDefinitions.every(
							b => typeof b !== 'undefined' && 'marks' in b[1] && (b[1].marks || []).includes(markType),
						)
					) {
						event.preventDefault()
						editor.toggleMark(markType)
					} else {
						console.warn(`Mark "${markType}" is not available in at least some of selected blocks.`)
					}
				} else {
					next()
				}
			},
		}
	})
}
