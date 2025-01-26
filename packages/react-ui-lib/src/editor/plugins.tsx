import { withSortable } from '@contember/react-slate-editor'
import { SortableBlock } from './sortable-block'
import { baseEditorPlugins } from './common'

const plugins = baseEditorPlugins

/**
 * richTextFieldPlugins - Basic text formatting plugins for Slate editor
 *
 * #### Purpose
 * Provides essential inline formatting tools for rich text fields
 *
 * #### Included Features:
 * - Anchor/links
 * - Bold/italic/underline
 * - Code blocks
 * - Text highlighting
 * - Strikethrough
 * - Manual newlines
 *
 * #### Example Usage
 * ```tsx
 * <RichTextEditor plugins={richTextFieldPlugins} />
 * ```
 */
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

/**
 * blockEditorPlugins - Advanced content editing plugins with structural elements
 *
 * #### Purpose
 * Enables complex document structures and block management in Slate editor
 *
 * #### Additional Features beyond richTextFieldPlugins:
 * - Paragraph/heading formatting
 * - Lists (ordered/unordered)
 * - Horizontal rules
 * - Tables
 * - Scroll targets
 * - Drag-and-drop block sorting
 *
 * #### Key Integration
 * - `withSortable` enables block reordering
 * - Requires `SortableBlock` component for drag handles
 *
 * #### Example Usage
 * ```tsx
 * <BlockEditor plugins={blockEditorPlugins}>
 *   <SortableBlock name="section" />
 * </BlockEditor>
 * ```
 */
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
	withSortable({
		render: SortableBlock,
	}),
]
