import { BindingError } from '@contember/binding'
import { noop } from '@contember/react-utils'
import { createEditor, CreateEditorPublicOptions } from '../../editorFactory'
import { paragraphElementType } from '../../plugins'
import {
	isBlockReferenceElement,
	isBlockVoidReferenceElement,
	isContemberContentPlaceholderElement,
	isContemberFieldElement,
	isEmbedElement,
} from '../elements'
import { BlockSlateEditor } from './BlockSlateEditor'
import { overrideApply, OverrideApplyOptions } from './overrideApply'
import { overrideInsertBreak } from './overrideInsertBreak'
import { overrideInsertData, OverrideInsertDataOptions } from './overrideInsertData'
import {
	overrideInsertElementWithReference,
	OverrideInsertElementWithReferenceOptions,
} from './overrideInsertElementWithReference'
import { overrideInsertNode } from './overrideInsertNode'
import { overrideIsVoid } from './overrideIsVoid'
import { overrideNormalizeNode, OverrideNormalizeNodeOptions } from './overrideNormalizeNode'
import { overrideOnKeyDown } from './overrideOnKeyDown'
import { overrideRenderElement, OverrideRenderElementOptions } from './overrideRenderElement'
import { OverrideOnChangeOptions, overrideSlateOnChange } from './overrideSlateOnChange'
import * as Slate from 'slate'

export interface CreateEditorOptions
	extends OverrideOnChangeOptions,
		OverrideApplyOptions,
		OverrideRenderElementOptions,
		OverrideNormalizeNodeOptions,
		OverrideInsertDataOptions,
		OverrideInsertElementWithReferenceOptions,
		CreateEditorPublicOptions {}

export const createBlockEditor = (options: CreateEditorOptions) => {
	if (options.plugins && options.plugins.indexOf(paragraphElementType) === -1) {
		// TODO make this configurable and remove this?
		throw new BindingError(`The block editor plugin set must include the paragraph plugin!`)
	}

	return createEditor({
		plugins: options.plugins,
		augmentEditor: options.augmentEditor,
		augmentEditorBuiltins: options.augmentEditorBuiltins,

		addEditorBuiltins: editor => {
			const e = editor as BlockSlateEditor
			e.isBlockReferenceElement = isBlockReferenceElement
			e.isBlockVoidReferenceElement = isBlockVoidReferenceElement
			e.isContemberContentPlaceholderElement = isContemberContentPlaceholderElement
			e.isEmbedElement = isEmbedElement
			e.isContemberFieldElement = isContemberFieldElement
			e.insertElementWithReference = () => {
				throw new BindingError(
					`BlockEditor: trying to insert a referenced element but referencing has not been correctly set up. ` +
						`Check the BlockEditor props.`,
				)
			}
			e.slateOnChange = noop
			e.slate = Slate

			overrideApply(e, options)
			overrideInsertBreak(e, options)
			overrideInsertData(e, options)
			overrideInsertElementWithReference(e, options)
			overrideInsertNode(e)
			overrideIsVoid(e)
			overrideNormalizeNode(e, options)
			overrideOnKeyDown(e, options)
			overrideRenderElement(e, options)
			overrideSlateOnChange(e, options)

			return e
		},
		defaultElementType: paragraphElementType,
	}) as BlockSlateEditor
}
