import {
	Component,
	Field,
	FieldAccessor,
	FieldBasicProps,
	QueryLanguage,
	useEntity,
	useMutationState,
} from '@contember/react-binding'
import { EditorCanvas, FieldContainer, FieldContainerProps } from '@contember/ui'
import { FunctionComponent, useCallback, useMemo, useState } from 'react'
import { Descendant, Node as SlateNode } from 'slate'
import { Editable, Slate } from 'slate-react'
import { useAccessorErrors } from '../../errors'
import { createEditor, CreateEditorPublicOptions } from '../editorFactory'
import { paragraphElementType } from '../plugins'
import { RichEditor } from '../RichEditor'
import { HoveringToolbars, HoveringToolbarsProps } from '../toolbars'
import { useRichTextFieldNodes } from './useRichTextFieldNodes'

export interface LegacyDeprecatedEditorFormerlyKnownAsRichTextFieldProps
	extends FieldBasicProps,
		Omit<FieldContainerProps, 'children' | 'errors'>,
		CreateEditorPublicOptions,
		HoveringToolbarsProps {}

export const LegacyDeprecatedEditorFormerlyKnownAsRichTextField: FunctionComponent<LegacyDeprecatedEditorFormerlyKnownAsRichTextFieldProps> =
	Component(
		props => {
			const entity = useEntity()
			const environment = entity.environment
			const getParent = entity.getAccessor

			const desugaredField = useMemo(
				() => QueryLanguage.desugarRelativeSingleField(props, environment),
				[environment, props],
			)
			const fieldAccessor = useMemo(
				() => entity.getRelativeSingleField<string>(desugaredField),
				[entity, desugaredField],
			)

			// The cache is questionable, really.
			const [contemberFieldElementCache] = useState(() => new WeakMap<FieldAccessor<string>, Descendant[]>())
			const isMutating = useMutationState()

			const [editor] = useState(() => {
				return createEditor({
					plugins: props.plugins,
					augmentEditor: props.augmentEditor,
					augmentEditorBuiltins: props.augmentEditorBuiltins,
					defaultElementType: paragraphElementType,
					addEditorBuiltins: editor => editor,
				})
			})

			const valueNodes = useRichTextFieldNodes({
				editor,
				fieldAccessor,
				contemberFieldElementCache,
			})

			const serialize = editor.serializeNodes
			const onChange = useCallback(
				(value: Descendant[]) => {
					getParent().batchUpdates(getAccessor => {
						const fieldAccessor = getAccessor().getRelativeSingleField(desugaredField)

						if (SlateNode.string({ type: 'dummy', children: value }) === '') {
							fieldAccessor.updateValue(fieldAccessor.valueOnServer === null ? null : '')
							return
						}

						fieldAccessor.updateValue(serialize(value))
						contemberFieldElementCache.set(getAccessor().getRelativeSingleField(desugaredField), value)
					})
				},
				[getParent, contemberFieldElementCache, desugaredField, serialize],
			)

			return (
				<FieldContainer
					label={props.label}
					size={props.size}
					labelDescription={props.labelDescription}
					labelPosition={props.labelPosition}
					description={props.description}
					useLabelElement={props.useLabelElement}
					errors={useAccessorErrors(fieldAccessor)}
				>
					<Slate editor={editor} value={valueNodes} onChange={onChange}>
						<EditorCanvas
							underlyingComponent={Editable}
							componentProps={{
								readOnly: isMutating,
								renderElement: editor.renderElement,
								renderLeaf: editor.renderLeaf,
								onKeyDown: editor.onKeyDown,
								onFocusCapture: editor.onFocus,
								onBlurCapture: editor.onBlur,
								onDOMBeforeInput: editor.onDOMBeforeInput,
							}}
						>
							<HoveringToolbars
								blockButtons={props.blockButtons}
								inlineButtons={props.inlineButtons ?? defaultInlineButtons}
							/>
						</EditorCanvas>
					</Slate>
				</FieldContainer>
			)
		},
		props => (
			<>
				<Field defaultValue={props.defaultValue} field={props.field} isNonbearing={props.isNonbearing} />
				{props.label}
				{props.labelDescription}
				{props.description}
			</>
		),
		'LegacyDeprecatedEditorFormerlyKnownAsRichTextField',
	)

const RB = RichEditor.buttons
const defaultInlineButtons: HoveringToolbarsProps['inlineButtons'] = [
	[RB.bold, RB.italic, RB.underline, RB.anchor],
	[RB.strikeThrough, RB.code],
]
