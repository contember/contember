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
import { Editor, Editor as SlateEditor } from 'slate'

const pluginAugmenters: {
	[pluginName in BuiltinEditorPlugins]: <E extends Editor>(editor: E) => E
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

export interface CreateEditorPublicOptions<E extends Editor = Editor> {
	plugins?: BuiltinEditorPlugins[]
	augmentEditor?: (baseEditor: Editor) => Editor | void
	augmentEditorBuiltins?: (editor: E) => E | void
}

export interface CreateEditorOptions<E extends Editor = Editor> extends CreateEditorPublicOptions<E> {
	defaultElementType: string
	addEditorBuiltins: (augmentedBaseEditor: SlateEditor) => E | void
}

export const createEditor = ({
	plugins = defaultEditorPluginPreset,
	defaultElementType,
	augmentEditorBuiltins = identityFunction,
	addEditorBuiltins,
	augmentEditor = identityFunction,
}: CreateEditorOptions) => {
	const editor = createEditorWithEssentials(defaultElementType)
	return initializeEditor({ editor, plugins, augmentEditor, addEditorBuiltins, augmentEditorBuiltins })
}


export const initializeEditor = <E extends Editor>({
	editor,
	plugins = defaultEditorPluginPreset,
	augmentEditorBuiltins = identityFunction,
	addEditorBuiltins,
	augmentEditor = identityFunction,
}: Omit<CreateEditorOptions<E>, 'defaultElementType'> & {editor: Editor}): E => {
	for (const plugin of new Set(plugins)) {
		editor = pluginAugmenters[plugin](editor)
	}

	const withAugmentedBase = augmentEditor(editor) ?? editor
	const withBuiltins = addEditorBuiltins(withAugmentedBase) ?? (withAugmentedBase as E)

	return augmentEditorBuiltins(withBuiltins) ?? withBuiltins
}
