import { identityFunction } from '@contember/react-utils'
import { BaseEditor, createEditorWithEssentials } from '../baseEditor'
import { withAnchors } from '../plugins/element/anchors'
import { withHeadings } from '../plugins/element/headings'
import { withParagraphs } from '../plugins/element/paragraphs'
import { withBasicFormatting } from '../plugins/text/basicFormatting'
import { BatchUpdatesRef, withBatching } from './withBatching'

export type BuiltinPlugin = 'anchor' | 'heading' | 'paragraph' | 'basicFormatting'

const pluginAugmenters: {
	[pluginName in BuiltinPlugin]: (editor: BaseEditor) => BaseEditor
} = {
	anchor: withAnchors,
	paragraph: withParagraphs,
	heading: withHeadings,
	basicFormatting: withBasicFormatting,
}

export interface CreateEditorPublicOptions {
	plugins?: BuiltinPlugin[]
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
	plugins = ['basicFormatting', 'anchor', 'paragraph', 'heading'],
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
