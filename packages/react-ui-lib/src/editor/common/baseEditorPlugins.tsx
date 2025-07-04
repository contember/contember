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

/**
 * baseEditorPlugins - Core plugin configuration for Slate.js editor components
 *
 * ### Plugin Structure
 * Contains renderer configurations and basic formatting capabilities for:
 *
 * #### Structural Elements
 * - **anchor**: Link handling with `AnchorRenderer`
 * - **paragraph**: Text blocks with `ParagraphRenderer`
 * - **heading**: Headings with `HeadingRenderer`
 * - **list**: List structures with:
 *   - `ListItemRenderer`
 *   - `OrderedListRenderer`
 *   - `UnorderedListRenderer`
 * - **horizontalRule**: Dividers with `HorizontalRuleRenderer`
 * - **scrollTarget**: Navigation anchors with `ScrollTargetRenderer`
 * - **table**: Tabular data with:
 *   - `TableElementRenderer`
 *   - `TableCellElementRenderer`
 *   - `TableRowElementRenderer`
 *
 * #### Text Formatting
 * - **bold**: Bold text formatting
 * - **code**: Inline code styling
 * - **highlight**: Text highlighting
 * - **italic**: Italic text
 * - **newline**: Manual line breaks
 * - **strikeThrough**: Strikethrough text
 * - **underline**: Underlined text
 *
 * ### Usage
 * ```tsx
 * // Create editor with base configuration
 * <RichTextEditor
 *   plugins={[
 *     baseEditorPlugins.paragraph,
 *     baseEditorPlugins.heading,
 *     baseEditorPlugins.bold,
 *     baseEditorPlugins.italic
 *   ]}
 * />
 * ```
 */
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


