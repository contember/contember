import * as React from 'react'
import { Rule } from 'slate-html-serializer'

export const PARAGRAPH_RULE: Rule = {
	deserialize: (el, next) => {
		switch (el.tagName.toLowerCase()) {
			case 'p': {
				return {
					object: 'block',
					type: 'paragraph',
					nodes: next(el.childNodes)
				}
			}
		}
	},
	serialize: (obj, children) => {
		switch (obj.object) {
			case 'block':
				switch (obj.type) {
					case 'paragraph':
						return <>{children}</>
				}
				break
		}
	}
}
