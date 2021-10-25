import { FunctionComponent } from 'react'
import { RenderLeafProps } from 'slate-react'
import { HtmlDeserializerPlugin } from './html'

export interface CustomMarkPlugin {
	type: string
	isHotKey: (e: KeyboardEvent) => boolean
	render: FunctionComponent<RenderLeafProps>
}

export const createMarkHtmlDeserializer = (markType: string, tagMatcher: (el: HTMLElement) => boolean, attributeMatcher: (el: HTMLElement) => boolean): HtmlDeserializerPlugin => ({
	processAttributesPaste: ({ element, cumulativeTextAttrs: cta }) => {
		return attributeMatcher(element) ? { ...cta, [markType]: true } : cta
	},
	processInlinePaste: ({ element, next, cumulativeTextAttrs }) => {
		if (tagMatcher(element)) {
			return next(element.childNodes, { ...cumulativeTextAttrs, [markType]: true })
		}
		return null
	},
})
