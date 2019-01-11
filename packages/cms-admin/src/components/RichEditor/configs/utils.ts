import * as React from 'react'
import { Editor, Mark } from 'slate'
import { Rule } from 'slate-html-serializer'
import { Plugin } from 'slate-react'

export interface RichEditorPluginConfig {
	node: 'mark' | 'block'
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

export function simpleMarkRule(markType: string, htmlTag: string | string[], attrs: string[] = []): Rule {
	const tags = Array.isArray(htmlTag) ? htmlTag : [htmlTag]
	return {
		deserialize: (el, next) => {
			if (tags.includes(el.tagName.toLowerCase())) {
				return {
					object: 'mark',
					type: markType,
					data: attrs.reduce((acc, attr) => ({ ...acc, [attr]: el.getAttribute(attr) }), {}),
					nodes: next(el.childNodes)
				}
			}
		},
		serialize: (obj, children) => {
			if (obj.object === 'mark' && obj.type === markType) {
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
		htmlSerializer: simpleMarkRule(markType, tags),
		onToggle: simpleMarkToggle(markType)
	}
}
