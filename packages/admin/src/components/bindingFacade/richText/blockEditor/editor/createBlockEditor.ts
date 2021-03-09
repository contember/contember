import { BindingError } from '@contember/binding'
import { noop } from '@contember/react-utils'
import * as Slate from 'slate'
import { Element as SlateElement } from 'slate'
import { createEditor, CreateEditorPublicOptions } from '../../editorFactory'
import { paragraphElementType } from '../../plugins'
import { isContemberContentPlaceholderElement, isContemberFieldElement, isReferenceElement } from '../elements'
import { BlockSlateEditor } from './BlockSlateEditor'
import { overrideApply, OverrideApplyOptions } from './overrideApply'
import { overrideCreateElementReference, OverrideCreateElementReferenceOptions } from './overrideCreateElementReference'
import { overrideGetReferencedEntity, OverrideGetReferencedEntityOptions } from './overrideGetReferencedEntity'
import { overrideInsertBreak } from './overrideInsertBreak'
import { overrideInsertData, OverrideInsertDataOptions } from './overrideInsertData'
import {
	overrideInsertElementWithReference,
	OverrideInsertElementWithReferenceOptions,
} from './overrideInsertElementWithReference'
import { overrideInsertNode } from './overrideInsertNode'
import { overrideIsVoid, OverrideIsVoidOptions } from './overrideIsVoid'
import { overrideNormalizeNode, OverrideNormalizeNodeOptions } from './overrideNormalizeNode'
import { overrideOnKeyDown } from './overrideOnKeyDown'
import { overridePrepareElementForInsertion } from './overridePrepareElementForInsertion'
import { overrideRenderElement, OverrideRenderElementOptions } from './overrideRenderElement'
import { OverrideOnChangeOptions, overrideSlateOnChange } from './overrideSlateOnChange'

export interface CreateEditorOptions
	extends OverrideOnChangeOptions,
		OverrideCreateElementReferenceOptions,
		OverrideGetReferencedEntityOptions,
		OverrideApplyOptions,
		OverrideRenderElementOptions,
		OverrideNormalizeNodeOptions,
		OverrideInsertDataOptions,
		OverrideInsertElementWithReferenceOptions,
		OverrideIsVoidOptions,
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
			e.isReferenceElement = isReferenceElement
			e.isContemberContentPlaceholderElement = isContemberContentPlaceholderElement
			e.isContemberFieldElement = isContemberFieldElement
			e.prepareElementForInsertion = () => {
				throw new BindingError()
			}
			e.insertElementWithReference = () => {
				throw new BindingError(
					`BlockEditor: trying to insert a referenced element but referencing has not been correctly set up. ` +
						`Check the BlockEditor props.`,
				)
			}
			e.createReferencedEntity = () => {
				throw new BindingError(
					`BlockEditor: trying to create a referenced entity but referencing has not been correctly set up. ` +
						`Check the BlockEditor props.`,
				)
			}
			e.getReferencedEntity = () => {
				throw new BindingError(
					`BlockEditor: trying to access a referenced entity but referencing has not been correctly set up. ` +
						`Check the BlockEditor props.`,
				)
			}

			const { upgradeFormatBySingleVersion } = e
			e.upgradeFormatBySingleVersion = (node, oldVersion) => {
				if (oldVersion !== 0 || !SlateElement.isElement(node)) {
					return upgradeFormatBySingleVersion(node, oldVersion)
				}
				if (node.type === 'embed' || node.type === 'blockReference' || node.type === 'blockVoidReference') {
					return {
						...node,
						type: 'reference',
						children: node.children.map((child: any) => editor.upgradeFormatBySingleVersion(child, oldVersion)),
					}
				}
				return upgradeFormatBySingleVersion(node, oldVersion)
			}
			e.slateOnChange = noop
			e.slate = Slate

			overrideApply(e, options)
			overrideCreateElementReference(e, options)
			overrideGetReferencedEntity(e, options)
			overrideInsertBreak(e, options)
			overrideInsertData(e, options)
			overrideInsertElementWithReference(e, options)
			overrideInsertNode(e)
			overrideIsVoid(e, options)
			overrideNormalizeNode(e, options)
			overrideOnKeyDown(e, options)
			overridePrepareElementForInsertion(e)
			overrideRenderElement(e, options)
			overrideSlateOnChange(e, options)

			return e
		},
		defaultElementType: paragraphElementType,
	}) as BlockSlateEditor
}
