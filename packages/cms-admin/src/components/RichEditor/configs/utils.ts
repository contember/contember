import * as React from 'react'
import { Editor, Mark } from 'slate'
import { Rule } from 'slate-html-serializer'
import { Plugin } from 'slate-react'

type NodeType = 'mark' | 'block'

export interface RichEditorPluginConfig {
	node: NodeType
	type: string
	plugin: Plugin
	htmlSerializer: Rule
	onToggle: (editor: Editor) => void
}

export function simpleMarkPlugin(markType: string, htmlTag: string, attrs: string[] = []): Plugin {
	return {
		renderMark: ({ mark, children, attributes }, editor, next) => {
			if (mark.type === markType) {
				return React.createElement(
					htmlTag,
					{ ...attributes, ...attrs.reduce((acc, attr) => ({ ...acc, [attr]: mark.data.get(attr) }), {}) },
					children
				)
			}
			return next()
		}
	}
}

export function simpleHtmlSerializerRule(
	nodeType: NodeType,
	type: string,
	htmlTag: string | string[],
	attrs: string[] = []
): Rule {
	const tags = Array.isArray(htmlTag) ? htmlTag : [htmlTag]
	return {
		deserialize: (el, next) => {
			if (tags.includes(el.tagName.toLowerCase())) {
				return {
					object: nodeType,
					type: type,
					data: attrs.reduce((acc, attr) => ({ ...acc, [attr]: el.getAttribute(attr) }), {}),
					nodes: next(el.childNodes)
				}
			}
		},
		serialize: (obj, children) => {
			if (obj.object === nodeType && obj.type === type) {
				return React.createElement(
					htmlTag[0],
					attrs.reduce((acc, attr) => ({ ...acc, [attr]: obj.data.get(attr) }), {}),
					children
				)
			}
		}
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

export function simpleMarkConfig(markType: string, htmlTags: string | [string, ...string[]]): RichEditorPluginConfig {
	const tags = Array.isArray(htmlTags) ? htmlTags : [htmlTags]
	return {
		node: 'mark',
		type: markType,
		plugin: simpleMarkPlugin(markType, tags[0]),
		htmlSerializer: simpleHtmlSerializerRule('mark', markType, tags),
		onToggle: simpleMarkToggle(markType)
	}
}

export function createBlockPluginConfig(name: string, tag: string, attrs: string[] = []): RichEditorPluginConfig {
	const defaultBlock = 'paragraph'
	return {
		node: 'block',
		type: name,
		onToggle(editor) {
			const isCurrent = editor.value.blocks.toArray().every(block => block.type == name)
			editor.setBlocks({
				type: isCurrent ? defaultBlock : name
			})
		},
		plugin: {
			renderNode({ node, children, attributes }, editor, next) {
				if (node.type === name) {
					return React.createElement(
						tag,
						{ ...attributes, ...attrs.reduce((acc, attr) => ({ ...acc, [attr]: node.data.get(attr) }), {}) },
						children
					)
				}
				return next()
			}
		},
		htmlSerializer: simpleHtmlSerializerRule('block', name, tag)
	}
}
