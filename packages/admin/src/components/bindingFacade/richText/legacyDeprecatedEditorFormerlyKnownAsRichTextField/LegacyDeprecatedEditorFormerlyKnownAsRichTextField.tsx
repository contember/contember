import {
	Component,
	Field,
	FieldAccessor,
	FieldBasicProps,
	QueryLanguage,
	useEntity,
	useMutationState,
} from '@contember/binding'
import { EditorCanvas, FormGroup, FormGroupProps } from '@contember/ui'
import { ReactNode, ComponentType, ReactElement, memo, useCallback, useMemo, useRef, useState, FC, FunctionComponent, Fragment, PureComponent, useEffect } from 'react'
import { Node as SlateNode } from 'slate'
import { Editable, Slate } from 'slate-react'
import { ElementNode } from '../baseEditor'
import { createEditor, CreateEditorPublicOptions } from '../editorFactory'
import { paragraphElementType } from '../plugins'
import { RichEditor } from '../RichEditor'
import { HoveringToolbars, HoveringToolbarsProps } from '../toolbars'
import { useRichTextFieldNodes } from './useRichTextFieldNodes'

export interface LegacyDeprecatedEditorFormerlyKnownAsRichTextFieldProps
	extends FieldBasicProps,
		Omit<FormGroupProps, 'children' | 'errors'>,
		CreateEditorPublicOptions,
		HoveringToolbarsProps {}

export const LegacyDeprecatedEditorFormerlyKnownAsRichTextField: FunctionComponent<LegacyDeprecatedEditorFormerlyKnownAsRichTextFieldProps> = Component(
	props => {
		const entity = useEntity()
		const environment = entity.environment
		const batchUpdates = entity.batchUpdates

		const desugaredField = useMemo(() => QueryLanguage.desugarRelativeSingleField(props, environment), [
			environment,
			props,
		])
		const fieldAccessor = useMemo(() => entity.getRelativeSingleField<string>(desugaredField), [
			entity,
			desugaredField,
		])

		// The cache is questionable, really.
		const [contemberFieldElementCache] = useState(() => new WeakMap<FieldAccessor<string>, ElementNode[]>())
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
			(value: SlateNode[]) => {
				batchUpdates(getAccessor => {
					const fieldAccessor = getAccessor().getRelativeSingleField(desugaredField)

					if (SlateNode.string({ children: value }) === '') {
						fieldAccessor.updateValue(fieldAccessor.valueOnServer === null ? null : '')
						return
					}

					fieldAccessor.updateValue(serialize(value as ElementNode[]))
					contemberFieldElementCache.set(getAccessor().getRelativeSingleField(desugaredField), value as ElementNode[])
				})
			},
			[batchUpdates, contemberFieldElementCache, desugaredField, serialize],
		)

		return (
			<FormGroup
				label={props.label}
				size={props.size}
				labelDescription={props.labelDescription}
				labelPosition={props.labelPosition}
				description={props.description}
				useLabelElement={props.useLabelElement}
				errors={fieldAccessor.errors}
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
			</FormGroup>
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
