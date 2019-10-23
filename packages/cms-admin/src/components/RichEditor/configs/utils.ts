import * as React from 'react'
import { Editor, Mark } from 'slate'
import { Rule } from 'slate-html-serializer'
import { Plugin } from 'slate-react'
import isKeyHotkey from 'is-hotkey'

type NodeType = 'mark' | 'block'

export interface RichEditorPluginConfig {
	node: NodeType
	type: string
	plugin: Plugin
	htmlSerializer: Rule
	onToggle: (editor: Editor) => void
}

export function simpleMarkPlugin(
	markType: string,
	htmlTag: string,
	attrs: string[] = [],
	hotkey: string | string[] = [],
): Plugin {
	const isHotkey = isKeyHotkey(hotkey)
	return {
		renderMark: ({ mark, children, attributes }, editor, next) => {
			if (mark.type === markType) {
				return React.createElement(
					htmlTag,
					{ ...attributes, ...attrs.reduce((acc, attr) => ({ ...acc, [attr]: mark.data.get(attr) }), {}) },
					children,
				)
			}
			return next()
		},
		onKeyDown: (event_, editor, next) => {
			const event = event_ as KeyboardEvent
			if (isHotkey(event)) {
				// const currentBlockTypes = editor.value.blocks.toArray().map(block => block.type)
				// const blockDefinitions = currentBlockTypes.map(currentBlock =>
				// 	this.props.blocks.find(block => block.block === currentBlock)
				// )
				// if (blockDefinitions.every(b => typeof b !== 'undefined' && (b.marks || []).includes(markType))) {
				// TODO: Handle marks available only in some blocks
				event.preventDefault()
				editor.toggleMark(markType)
				// } else {
				// 	console.warn(
				// 		`Mark "${markType}" is not available in at least some of following blocks: ${blockDefinitions
				// 			.map(block => block && block.block)
				// 			.join(', ')}.`
				// 	)
				// }
			} else {
				next()
			}
		},
	}
}

export function simpleHtmlSerializerRule(
	nodeType: NodeType,
	type: string,
	htmlTag: string | string[],
	attrs: string[] = [],
): Rule {
	const tags = Array.isArray(htmlTag) ? htmlTag : [htmlTag]
	return {
		deserialize: (el, next) => {
			if (tags.includes(el.tagName.toLowerCase())) {
				return {
					object: nodeType,
					type: type,
					data: attrs.reduce((acc, attr) => ({ ...acc, [attr]: el.getAttribute(attr) }), {}),
					nodes: next(el.childNodes),
				}
			}
		},
		serialize: (obj, children) => {
			if (obj.object === nodeType && obj.type === type) {
				return React.createElement(
					htmlTag[0],
					attrs.reduce((acc, attr) => ({ ...acc, [attr]: obj.data.get(attr) }), {}),
					children,
				)
			}
		},
	}
}

export const simpleMarkToggle = (markType: string): RichEditorPluginConfig['onToggle'] => editor => {
	const mark = Mark.create(markType)
	if (editor.value.activeMarks.has(mark)) {
		editor.removeMark(mark)
	} else {
		editor.addMark(mark)
	}
}

function composeHtmlSerializerRules(a: Rule, b: Rule): Rule {
	return {
		serialize: (...args) => (a.serialize && a.serialize(...args)) || (b.serialize && b.serialize(...args)),
		deserialize: (...args) => (a.deserialize && a.deserialize(...args)) || (b.deserialize && b.deserialize(...args)),
	}
}

export function simpleMarkConfig(
	markType: string,
	htmlTags: string | [string, ...string[]],
	alternativeHtmlSerializer: Rule = {},
	hotkey: string | string[] = [],
): RichEditorPluginConfig {
	const tags = Array.isArray(htmlTags) ? htmlTags : [htmlTags]
	return {
		node: 'mark',
		type: markType,
		plugin: simpleMarkPlugin(markType, tags[0], [], hotkey),
		htmlSerializer: composeHtmlSerializerRules(
			simpleHtmlSerializerRule('mark', markType, tags),
			alternativeHtmlSerializer,
		),
		onToggle: simpleMarkToggle(markType),
	}
}

export function createBlockPluginConfig(name: string, tag: string, attrs: string[] = []): RichEditorPluginConfig {
	const defaultBlock = 'paragraph'
	return {
		node: 'block',
		type: name,
		onToggle(editor) {
			const isCurrent = editor.value.blocks.toArray().every(block => block.type === name)
			editor.setBlocks({
				type: isCurrent ? defaultBlock : name,
			})
		},
		plugin: {
			renderBlock({ node, children, attributes }, editor, next) {
				if (node.type === name) {
					return React.createElement(
						tag,
						{ ...attributes, ...attrs.reduce((acc, attr) => ({ ...acc, [attr]: node.data.get(attr) }), {}) },
						children,
					)
				}
				return next()
			},
		},
		htmlSerializer: simpleHtmlSerializerRule('block', name, tag),
	}
}
