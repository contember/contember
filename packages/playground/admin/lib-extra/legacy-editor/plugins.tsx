import {
	withAnchors,
	withBold,
	withCode,
	withHeadings,
	withHighlight,
	withHorizontalRules,
	withItalic,
	withLists,
	withNewline,
	withParagraphs,
	withScrollTargets,
	withStrikeThrough,
	withTables,
	withUnderline,
} from '@contember/react-legacy-editor'
import { AnchorRenderer } from './elements/AnchorRenderer'
import { ParagraphRenderer } from './elements/ParagraphRenderer'
import { HeadingRenderer } from './elements/HeadingRenderer'
import { ListItemRenderer } from './elements/ListItemRenderer'
import { OrderedListRenderer } from './elements/OrderedListRenderer'
import { UnorderedListRenderer } from './elements/UnorderedListRenderer'
import { HorizontalRuleRenderer } from './elements/HorizontalRuleRenderer'
import { Editor } from 'slate'
import { ScrollTargetRenderer } from './elements/ScrollTargetRenderer'
import { TableElementRenderer } from './elements/TableElementRenderer'
import { TableCellElementRenderer } from './elements/TableCellElementRenderer'
import { TableRowElementRenderer } from './elements/TableRowElementRenderer'

const plugins = {
	anchor: withAnchors({
		render: AnchorRenderer,
	}),
	paragraph: withParagraphs({
		render: ParagraphRenderer,
	}),
	heading: withHeadings({
		render: HeadingRenderer,
	}),
	list: withLists({
		renderListItem: ListItemRenderer,
		renderOrderedList: OrderedListRenderer,
		renderUnorderedList: UnorderedListRenderer,
	}),
	horizontalRule: withHorizontalRules({
		render: HorizontalRuleRenderer,
	}),
	scrollTarget: withScrollTargets({
		render: ScrollTargetRenderer,
	}),
	table: withTables({
		renderTable: TableElementRenderer,
		renderTableCell: TableCellElementRenderer,
		renderTableRow: TableRowElementRenderer,
	}),

	bold: withBold,
	code: withCode,
	highlight: withHighlight,
	italic: withItalic,
	newline: withNewline,
	strikeThrough: withStrikeThrough,
	underline: withUnderline,
} satisfies Record<string, (editor: Editor) => Editor>


export const richTextFieldPlugins = [
	plugins.anchor,
	plugins.bold,
	plugins.code,
	plugins.highlight,
	plugins.italic,
	plugins.newline,
	plugins.strikeThrough,
	plugins.underline,
]

export const blockEditorPlugins = [
	plugins.anchor,
	plugins.paragraph,
	plugins.heading,
	plugins.list,
	plugins.horizontalRule,
	plugins.scrollTarget,
	plugins.table,
	plugins.bold,
	plugins.code,
	plugins.highlight,
	plugins.italic,
	plugins.newline,
	plugins.strikeThrough,
	plugins.underline,

]
