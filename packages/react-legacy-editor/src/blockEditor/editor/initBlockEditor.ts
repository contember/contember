import { BindingError } from '@contember/react-binding'
import * as Slate from 'slate'
import { Descendant, Editor, Element as SlateElement, Node as SlateNode } from 'slate'
import { CreateEditorPublicOptions, initializeEditor } from '../../editorFactory'
import { createReferenceElementPlugin, ReferenceElementOptions } from '../elements'
import type { EditorWithBlocks } from './EditorWithBlocks'
import { overrideCreateElementReference, OverrideCreateElementReferenceOptions } from './overrideCreateElementReference'
import { overrideInsertBreak } from './overrideInsertBreak'
import { overrideInsertData, OverrideInsertDataOptions } from './overrideInsertData'
import { overrideInsertElementWithReference, OverrideInsertElementWithReferenceOptions } from './overrideInsertElementWithReference'
import { overrideInsertNode } from './overrideInsertNode'
import { overrideRenderElement, OverrideRenderElementOptions } from './overrideRenderElement'

export interface CreateEditorOptions
	extends OverrideCreateElementReferenceOptions,
		ReferenceElementOptions,
		OverrideInsertDataOptions,
		OverrideRenderElementOptions,
		OverrideInsertElementWithReferenceOptions,
		CreateEditorPublicOptions {}

export const initBlockEditor = ({ editor, ...options }: CreateEditorOptions & { editor: Editor }) => {
	return initializeEditor({
		editor,
		plugins: [
			...(options.plugins ?? []),
			editor => {
				const e = editor as EditorWithBlocks
				e.registerElement(createReferenceElementPlugin(options))

				e.insertElementWithReference = () => {
					throw new BindingError(
						`BlockEditor: trying to insert a referenced element but referencing has not been correctly set up. ` +
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
				e.upgradeFormatBySingleVersion = (node, oldVersion): SlateNode => {
					if (oldVersion !== 0 || !SlateElement.isElement(node)) {
						return upgradeFormatBySingleVersion(node, oldVersion)
					}
					if (node.type === 'embed' || node.type === 'blockReference' || node.type === 'blockVoidReference') {
						return {
							...node,
							type: 'reference',
							children: node.children.map((child: any) => editor.upgradeFormatBySingleVersion(child, oldVersion) as Descendant),
						}
					}
					return upgradeFormatBySingleVersion(node, oldVersion)
				}
				e.slate = Slate

				overrideCreateElementReference(e, options)
				overrideInsertBreak(e, options)
				overrideInsertData(e, options)
				overrideInsertElementWithReference(e, options)
				overrideInsertNode(e)
				overrideRenderElement(e, options)

				return e
			},
		],
	})
}
