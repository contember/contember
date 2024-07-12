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
import { AnchorRenderer } from './elements/AnchorRenderer'
import { ParagraphRenderer } from './elements/ParagraphRenderer'
import { HeadingRenderer } from './elements/HeadingRenderer'
import { ListItemRenderer } from './elements/ListItemRenderer'
import { OrderedListRenderer } from './elements/OrderedListRenderer'
import { UnorderedListRenderer } from './elements/UnorderedListRenderer'
import { HorizontalRuleRenderer } from './elements/HorizontalRuleRenderer'
import { ScrollTargetRenderer } from './elements/ScrollTargetRenderer'
import { TableElementRenderer } from './elements/TableElementRenderer'
import { TableCellElementRenderer } from './elements/TableCellElementRenderer'
import { TableRowElementRenderer } from './elements/TableRowElementRenderer'

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


