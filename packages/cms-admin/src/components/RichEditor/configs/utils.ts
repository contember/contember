import * as React from 'react'
import { Change, Value } from 'slate'
import { Rule } from 'slate-html-serializer'
import { Plugin } from 'slate-react'

export interface RichEditorPluginConfig {
	node: 'mark' | 'block'
	type: string
	plugin: Plugin
	htmlSerializer: Rule
	onToggle: (value: Value) => Change
}

export function simpleMarkPlugin(markType: string, htmlTag: string, attrs: string[] = []): Plugin {
	return {
		renderMark: ({ mark, children, attributes }) => {
			if (mark.type === markType) {
				return React.createElement(
					htmlTag,
					{ ...attributes, ...attrs.reduce((acc, attr) => ({ ...acc, [attr]: mark.data.get(attr) }), {}) },
					children
				)
			}
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

export const simpleMarkToggle = (markType: string): RichEditorPluginConfig['onToggle'] => (value: Value): Change =>
	value.change().toggleMark(markType)

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
