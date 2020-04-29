import { createEditor, CreateEditorPublicOptions } from '../../editorFactory'
import { paragraphElementType } from '../../plugins'
import {
	isContemberBlockElement,
	isContemberContentPlaceholderElement,
	isContemberEmbedElement,
	isContemberFieldElement,
} from '../elements'
import { BlockSlateEditor } from './BlockSlateEditor'
import { overrideApply, OverrideApplyOptions } from './overrideApply'
import { overrideInsertNode } from './overrideInsertNode'
import { overrideInsertData, OverrideInsertDataOptions } from './overrideInsertData'
import { overrideIsVoid } from './overrideIsVoid'
import { overrideRenderElement, OverrideRenderElementOptions } from './overrideRenderElement'

export interface CreateEditorOptions
	extends OverrideApplyOptions,
		OverrideRenderElementOptions,
		OverrideInsertDataOptions,
		CreateEditorPublicOptions {}

export const createBlockEditor = (options: CreateEditorOptions) => {
	if (options.plugins && options.plugins.indexOf(paragraphElementType) === -1) {
		// TODO make this configurable and remove this?
		throw new Error(`The block editor plugin set must include the paragraph plugin!`)
	}

	return createEditor({
		plugins: options.plugins,
		augmentEditor: options.augmentEditor,
		augmentEditorBuiltins: options.augmentEditorBuiltins,

		addEditorBuiltins: editor => {
			const e = editor as BlockSlateEditor
			e.isContemberBlockElement = isContemberBlockElement
			e.isContemberContentPlaceholderElement = isContemberContentPlaceholderElement
			e.isContemberEmbedElement = isContemberEmbedElement
			e.isContemberFieldElement = isContemberFieldElement

			overrideIsVoid(e)

			overrideApply(e, options)
			overrideRenderElement(e, options)
			overrideInsertNode(e)
			overrideInsertData(e, options)

			return e
		},
		defaultElementType: paragraphElementType,
		batchUpdatesRef: options.batchUpdatesRef,
	}) as BlockSlateEditor
}
