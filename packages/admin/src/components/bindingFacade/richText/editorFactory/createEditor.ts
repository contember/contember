import { identityFunction } from '@contember/react-utils'
import { BaseEditor, createEditorWithEssentials } from '../baseEditor'
import {
	withAnchors,
	withBold,
	withCode,
	withHeadings,
	withHighlight,
	withHorizontalRules,
	withItalic,
	withLists,
	withParagraphs,
	withScrollTargets,
	withStrikeThrough,
	withTables,
	withUnderline,
} from '../plugins'
import { BuiltinEditorPlugins } from './BuiltinEditorPlugins'
import { defaultEditorPluginPreset } from './presets'

const pluginAugmenters: {
	[pluginName in BuiltinEditorPlugins]: (editor: BaseEditor) => BaseEditor
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
	strikeThrough: withStrikeThrough,
	underline: withUnderline,
}

export interface CreateEditorPublicOptions {
	plugins?: BuiltinEditorPlugins[]
	augmentEditor?: (baseEditor: BaseEditor) => BaseEditor
	augmentEditorBuiltins?: (editor: BaseEditor) => BaseEditor
}

export interface CreateEditorOptions extends CreateEditorPublicOptions {
	defaultElementType: string
	addEditorBuiltins: (augmentedBaseEditor: BaseEditor) => BaseEditor
}

export const createEditor = ({
	plugins = defaultEditorPluginPreset,
	defaultElementType,
	augmentEditorBuiltins = identityFunction,
	addEditorBuiltins,
	augmentEditor = identityFunction,
}: CreateEditorOptions) => {
	let baseEditor: BaseEditor = createEditorWithEssentials(defaultElementType)

	for (const plugin of new Set(plugins)) {
		baseEditor = pluginAugmenters[plugin](baseEditor)
	}

	const withAugmentedBase = augmentEditor(baseEditor)
	const withBuiltins = addEditorBuiltins(withAugmentedBase)

	return augmentEditorBuiltins(withBuiltins)
}
