import { identityFunction } from '@contember/react-utils'
import { BaseEditor, createEditorWithEssentials } from '../baseEditor'
import {
	withAnchors,
	withBold,
	withCode,
	withHeadings,
	withItalic,
	withParagraphs,
	withStrikeThrough,
	withUnderline,
} from '../plugins'
import { BuiltinEditorPlugins } from './BuiltinEditorPlugins'
import { defaultEditorPluginPreset } from './presets'
import { BatchUpdatesRef, withBatching } from './withBatching'

const pluginAugmenters: {
	[pluginName in BuiltinEditorPlugins]: (editor: BaseEditor) => BaseEditor
} = {
	anchor: withAnchors,
	paragraph: withParagraphs,
	heading: withHeadings,

	bold: withBold,
	code: withCode,
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
	batchUpdatesRef: BatchUpdatesRef
	defaultElementType: string
	addEditorBuiltins: (augmentedBaseEditor: BaseEditor) => BaseEditor
}

export const createEditor = ({
	batchUpdatesRef,
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
	const withAugmentedBuiltins = augmentEditorBuiltins(withBuiltins)

	return withBatching(withAugmentedBuiltins, batchUpdatesRef)
}
