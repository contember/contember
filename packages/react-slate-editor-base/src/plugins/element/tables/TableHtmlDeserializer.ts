import { HtmlDeserializerPlugin } from '../../../types/index.js'
import { tableCellElementType } from './TableCellElement.js'
import { tableElementType } from './TableElement.js'
import { tableRowElementType } from './TableRowElement.js'

export const tableHTMLDeserializer: HtmlDeserializerPlugin = {
	processBlockPaste: ({ element, next, cumulativeTextAttrs }) => {
		if (element.tagName === 'TABLE') {
			return [
				{
					type: tableElementType,
					children: next(element.childNodes, cumulativeTextAttrs),
				},
			]
		}

		if (element.tagName === 'TR') {
			return [
				{
					type: tableRowElementType,
					children: next(element.childNodes, cumulativeTextAttrs),
				},
			]
		}

		if (element.tagName === 'TD' || element.tagName === 'TH') {
			return [
				{
					type: tableCellElementType,
					children: next(element.childNodes, cumulativeTextAttrs),
				},
			]
		}

		return null
	},
}
