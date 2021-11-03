import { identityFunction } from '@contember/react-utils'
import { createEditorWithEssentials } from '../baseEditor'
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
} from '../plugins'
import type { BuiltinEditorPlugins } from './BuiltinEditorPlugins'
import { defaultEditorPluginPreset } from './presets'
import { Editor as SlateEditor } from 'slate'

const pluginAugmenters: {
	[pluginName in BuiltinEditorPlugins]: (editor: SlateEditor) => SlateEditor
} = {
	anchor: withAnchors,
	paragraph: withParagraphs,
	heading: withHeadings,
	list: withLists,
	horizontalRule: withHorizontalRules,
	scrollTarget: withScrollTargets,
	table: withTables,

	bold: withBold,
	code: withCode,
	highlight: withHighlight,
	italic: withItalic,
	newline: withNewline,
	strikeThrough: withStrikeThrough,
	underline: withUnderline,
}

export interface CreateEditorPublicOptions {
	plugins?: BuiltinEditorPlugins[]
	augmentEditor?: (baseEditor: SlateEditor) => SlateEditor
	augmentEditorBuiltins?: (editor: SlateEditor) => SlateEditor
}

export interface CreateEditorOptions extends CreateEditorPublicOptions {
	defaultElementType: string
	addEditorBuiltins: (augmentedBaseEditor: SlateEditor) => SlateEditor
}

export const createEditor = ({
	plugins = defaultEditorPluginPreset,
	defaultElementType,
	augmentEditorBuiltins = identityFunction,
	addEditorBuiltins,
	augmentEditor = identityFunction,
}: CreateEditorOptions) => {
	let baseEditor: SlateEditor = createEditorWithEssentials(defaultElementType)

	for (const plugin of new Set(plugins)) {
		baseEditor = pluginAugmenters[plugin](baseEditor)
	}

	const withAugmentedBase = augmentEditor(baseEditor)
	const withBuiltins = addEditorBuiltins(withAugmentedBase)

	return augmentEditorBuiltins(withBuiltins)
}
