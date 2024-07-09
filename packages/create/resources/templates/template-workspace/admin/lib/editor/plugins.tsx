import { withSortable } from '@contember/react-slate-editor'
import { SortableBlock } from './sortable-block'
import { baseEditorPlugins } from './common/baseEditorPlugins'

const plugins = baseEditorPlugins

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
	withSortable({
		render: SortableBlock,
	}),
]
