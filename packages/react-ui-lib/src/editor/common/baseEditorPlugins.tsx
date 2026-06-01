import {
	EditorPlugin,
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
} from '@contember/react-slate-editor-base'
import { AnchorRenderer } from './elements/AnchorRenderer.js'
import { ParagraphRenderer } from './elements/ParagraphRenderer.js'
import { HeadingRenderer } from './elements/HeadingRenderer.js'
import { ListItemRenderer } from './elements/ListItemRenderer.js'
import { OrderedListRenderer } from './elements/OrderedListRenderer.js'
import { UnorderedListRenderer } from './elements/UnorderedListRenderer.js'
import { HorizontalRuleRenderer } from './elements/HorizontalRuleRenderer.js'
import { ScrollTargetRenderer } from './elements/ScrollTargetRenderer.js'
import { TableElementRenderer } from './elements/TableElementRenderer.js'
import { TableCellElementRenderer } from './elements/TableCellElementRenderer.js'
import { TableRowElementRenderer } from './elements/TableRowElementRenderer.js'

export const baseEditorPlugins = {
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

	bold: withBold(),
	code: withCode(),
	highlight: withHighlight(),
	italic: withItalic(),
	newline: withNewline(),
	strikeThrough: withStrikeThrough(),
	underline: withUnderline(),
} satisfies Record<string, EditorPlugin>
