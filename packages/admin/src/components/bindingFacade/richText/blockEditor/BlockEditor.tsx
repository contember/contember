import {
	BindingError,
	Component,
	Environment,
	FieldValue,
	HasMany,
	SugaredField,
	SugaredFieldProps,
	SugaredRelativeEntityList,
	useBindingOperations,
	useDesugaredRelativeEntityList,
	useDesugaredRelativeSingleField,
	useEntityList,
	useEnvironment,
	VariableInputTransformer,
} from '@contember/binding'
import { emptyArray, noop } from '@contember/react-utils'
import { EditorCanvas, EditorCanvasSize } from '@contember/ui'
import { Fragment, FunctionComponent, ReactElement, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Range as SlateRange } from 'slate'
import { Slate } from 'slate-react'
import { getDiscriminatedBlock, useNormalizedBlocks } from '../../blocks'
import { Repeater } from '../../collections'
import { SugaredDiscriminateBy, useDiscriminatedData } from '../../discrimination'
import type { CreateEditorPublicOptions } from '../editorFactory'
import { RichEditor } from '../RichEditor'
import {
	HoveringToolbars,
	HoveringToolbarsProps,
	InitializeReferenceToolbarButton,
	ToolbarButtonSpec,
} from '../toolbars'
import { BlockHoveringToolbarContents, BlockHoveringToolbarContentsProps } from './BlockHoveringToolbarContents'
import { initBlockEditor } from './editor'
import type { EmbedHandler } from './embed'
import type { FieldBackedElement } from './FieldBackedElement'
import { ContentOutlet, ContentOutletProps, useEditorReferenceBlocks } from './templating'
import { EditableCanvas } from '../baseEditor/EditableCanvas'
import { TextField } from '../../fields'
import { RichTextField } from '../RichTextField'
import { useCreateElementReference } from './references'
import { useBlockEditorState } from './state/useBlockEditorState'
import { useGetReferencedEntity } from './references/useGetReferencedEntity'
import { createEditorWithEssentials } from '../baseEditor'
import { paragraphElementType } from '../plugins'
import { useInsertElementWithReference } from './references/useInsertElementWithReference'
import { useReferentiallyStableCallback } from './useReferentiallyStableCallback'
import { ReferencesProvider } from './references/ReferencesProvider'

export interface BlockEditorProps extends SugaredRelativeEntityList, CreateEditorPublicOptions {
	label: string
	contentField: SugaredFieldProps['field']
	sortableBy: SugaredFieldProps['field']
	children?: ReactNode
	size?: EditorCanvasSize

	leadingFieldBackedElements?: FieldBackedElement[]
	trailingFieldBackedElements?: FieldBackedElement[]

	referencesField?: SugaredRelativeEntityList | string
	referenceDiscriminationField?: SugaredFieldProps['field']
	monolithicReferencesMode?: boolean

	embedReferenceDiscriminateBy?: SugaredDiscriminateBy
	embedContentDiscriminationField?: SugaredFieldProps['field']
	embedHandlers?: Iterable<EmbedHandler>

	// TODO
	inlineButtons?: HoveringToolbarsProps['inlineButtons']
	blockButtons?: BlockHoveringToolbarContentsProps['blockButtons']
	otherBlockButtons?: BlockHoveringToolbarContentsProps['otherBlockButtons']
}

const BlockEditorComponent: FunctionComponent<BlockEditorProps> = Component(
	props => {
		const environment = useEnvironment()

		assertStaticBlockEditorInvariants(props, environment)

		const {
			label,
			contentField,
			sortableBy,
			children,
			size,

			leadingFieldBackedElements = emptyArray,
			trailingFieldBackedElements = emptyArray,

			referencesField,
			referenceDiscriminationField,
			monolithicReferencesMode = false,

			embedReferenceDiscriminateBy,
			embedContentDiscriminationField,
			embedHandlers = emptyArray,

			inlineButtons = defaultInlineButtons,
			blockButtons,
			otherBlockButtons,

			plugins,
			augmentEditor,
			augmentEditorBuiltins,

			...blockListProps
		} = props
		// const desugaredReferenceList = useDesugaredRelativeEntityList(referencesField)
		const desugaredReferenceDiscriminationField = useDesugaredRelativeSingleField(referenceDiscriminationField)
		const desugaredEmbedContentDiscriminationField = useDesugaredRelativeSingleField(embedContentDiscriminationField)


		const editorReferenceBlocks = useEditorReferenceBlocks(children)

		//

		const discriminatedEmbedHandlers = useDiscriminatedData<EmbedHandler>(embedHandlers)
		const embedReferenceDiscriminant = useMemo<FieldValue | undefined>(() => {
			if (embedReferenceDiscriminateBy !== undefined) {
				return VariableInputTransformer.transformValue(embedReferenceDiscriminateBy, environment)
			}
			return undefined
		}, [embedReferenceDiscriminateBy, environment])
		const embedSubBlocks = useNormalizedBlocks(
			embedReferenceDiscriminant !== undefined
				? getDiscriminatedBlock(editorReferenceBlocks, embedReferenceDiscriminant)?.datum.children
				: undefined, // TODO this may crash
		)

		const [baseEditor] = useState(() => createEditorWithEssentials(paragraphElementType))
		const { nodes, onChange, sortedBlocksRef, refreshBlocks } = useBlockEditorState({
			editor: baseEditor,
			blockList: blockListProps,
			contentField,
			sortableBy,
			monolithicReferencesMode,
			referencesField,
		})
		const getReferencedEntity = useGetReferencedEntity({
			monolithicReferencesMode,
			referencesField,
			sortedBlocksRef,
		})
		const createElementReference = useCreateElementReference({
			sortedBlocksRef,
			monolithicReferencesMode,
			referenceDiscriminationField,
			referencesField,
			refreshBlocks,
		})
		const stableCreateElementReference = useReferentiallyStableCallback(createElementReference)

		const insertElementWithReference = useInsertElementWithReference({
			editor: baseEditor,
			createElementReference: stableCreateElementReference,
		})

		const stableGetReferencedEntity = useReferentiallyStableCallback(getReferencedEntity)
		const [editor] = useState(() =>
			initBlockEditor({
				editor: baseEditor,
				augmentEditor,
				augmentEditorBuiltins,
				editorReferenceBlocks,
				embedContentDiscriminationField: desugaredEmbedContentDiscriminationField,
				embedHandlers: discriminatedEmbedHandlers,
				embedReferenceDiscriminateBy: embedReferenceDiscriminant,
				embedSubBlocks,
				plugins,
				referenceDiscriminationField: desugaredReferenceDiscriminationField,
				createElementReferences: stableCreateElementReference,
				getReferencedEntity: stableGetReferencedEntity,
				insertElementWithReference,
			}))


		const shouldDisplayInlineToolbar = useCallback(() => {
			const selection = baseEditor.selection
			return !(!selection || SlateRange.isCollapsed(selection))
		}, [baseEditor])


		const leadingElements = useFieldBackedElementFields(leadingFieldBackedElements)
		const trailingElements = useFieldBackedElementFields(trailingFieldBackedElements)

		// TODO label?
		return (
			<ReferencesProvider getReferencedEntity={getReferencedEntity}>
				<Slate editor={editor} value={nodes} onChange={onChange}>
					<EditorCanvas
						underlyingComponent={EditableCanvas}
						componentProps={{
							renderElement: baseEditor.renderElement,
							renderLeaf: baseEditor.renderLeaf,
							onKeyDown: baseEditor.onKeyDown,
							onFocusCapture: baseEditor.onFocus,
							onBlurCapture: baseEditor.onBlur,
							onDOMBeforeInput: baseEditor.onDOMBeforeInput,
							onDrop: (e => {
								e.preventDefault()
							}),
							placeholder: label,
							leading: leadingElements,
							trailing: trailingElements,
						}}
						size={size ?? 'large'}
					>
						{useMemo(
							() => (
								<HoveringToolbars
									shouldDisplayInlineToolbar={shouldDisplayInlineToolbar}
									inlineButtons={inlineButtons}
									blockButtons={
										<BlockHoveringToolbarContents
											editorReferenceBlocks={editorReferenceBlocks}
											blockButtons={blockButtons}
											otherBlockButtons={otherBlockButtons}
										/>
									}
								/>
							),
							[blockButtons, editorReferenceBlocks, inlineButtons, otherBlockButtons, shouldDisplayInlineToolbar],
						)}
					</EditorCanvas>
				</Slate>
			</ReferencesProvider>
		)
	},
	(props, environment) => {
		assertStaticBlockEditorInvariants(props, environment)

		const embedHandlers = Array.from(props.embedHandlers || [])

		const inlineButtons: ToolbarButtonSpec[] = props.inlineButtons
			? (
					(Array.isArray(props.inlineButtons[0]) ? props.inlineButtons : [props.inlineButtons]) as ToolbarButtonSpec[][]
			  ).flat()
			: emptyArray

		const references = !!(props.referencesField && props.referenceDiscriminationField) && (
			<HasMany
				{...(typeof props.referencesField === 'string' ? { field: props.referencesField } : props.referencesField)}
				initialEntityCount={0}
			>
				{inlineButtons
					.filter((button): button is InitializeReferenceToolbarButton => 'referenceContent' in button)
					.map(({ referenceContent: Content }, i) => {
						return (
							<Content key={i} referenceId="" editor={0 as any} selection={null} onSuccess={noop} onCancel={noop} />
						)
					})}
				<SugaredField field={props.referenceDiscriminationField} />
				{props.children}
				{props.embedContentDiscriminationField && (
					<>
						<SugaredField field={props.embedContentDiscriminationField} />
						{embedHandlers.map((handler, i) => (
							<Fragment key={i}>{handler.staticRender(environment)}</Fragment>
						))}
					</>
				)}
			</HasMany>
		)

		return (
			<>
				{props.leadingFieldBackedElements?.map((item, i) => (
					<SugaredField field={item.field} key={`leading_${i}`} />
				))}
				{props.trailingFieldBackedElements?.map((item, i) => (
					<SugaredField field={item.field} key={`trailing_${i}`} />
				))}
				<Repeater {...props} initialEntityCount={0}>
					<SugaredField field={props.sortableBy} />
					<SugaredField field={props.contentField} />
					{!props.monolithicReferencesMode && references}
				</Repeater>
				{props.monolithicReferencesMode && references}
			</>
		)
	},
	'BlockEditor',
)

export const BlockEditor = Object.assign<
	typeof BlockEditorComponent,
	{
		ContentOutlet: (props: ContentOutletProps) => ReactElement | null
		// TextField: (props: TextFieldProps) => ReactElement | null
	}
>(BlockEditorComponent, {
	ContentOutlet,
})


const useFieldBackedElementFields = (elements: FieldBackedElement[]) => {
	return <>
		{elements.map(el => {
			if (el.format === 'plainText') {
				return (
					<TextField field={el.field} label={undefined} placeholder={el.placeholder} distinction={'seamless'}
										 size={el.size} />
				)
			}
			return <RichTextField field={el.field} label={undefined} placeholder={el.placeholder} distinction={'seamless'} />
		})}
	</>
}

const assertStaticBlockEditorInvariants = (props: BlockEditorProps, environment: Environment) => {
	if (import.meta.env.DEV) {
		//referencesField?: SugaredRelativeEntityList | string
		//referenceDiscriminationField?: SugaredFieldProps['field']
		//
		//embedReferenceDiscriminateBy?: SugaredDiscriminateBy
		//embedContentDiscriminationField?: SugaredFieldProps['field']
		//embedHandlers?: Iterable<EmbedHandler>

		if (props.referencesField !== undefined && props.referenceDiscriminationField === undefined) {
			throw new BindingError(
				`BlockEditor: missing the 'referenceDiscriminationField' prop. ` +
					`Without it the editor cannot tell different kinds of references apart!`,
			)
		}
		if (props.referencesField === undefined && props.referenceDiscriminationField !== undefined) {
			throw new BindingError(
				`BlockEditor: supplied the 'referenceDiscriminationField' prop but missing 'referencesField'. ` +
					`Either remove 'referenceDiscriminationField' to get rid of this error ` +
					`or provide 'referencesField' to enable content references.`,
			)
		}
		if (
			props.referencesField !== undefined &&
			(props.embedReferenceDiscriminateBy === undefined ||
				props.embedContentDiscriminationField === undefined ||
				props.embedHandlers === undefined) &&
			(props.embedReferenceDiscriminateBy !== undefined ||
				props.embedContentDiscriminationField !== undefined ||
				props.embedHandlers !== undefined)
		) {
			throw new BindingError(
				`BlockEditor: trying to enable embeds without content references being enabled. In order to use embeds, ` +
					`provide both the 'referenceDiscriminationField' as well as the 'referencesField' prop`,
			)
		}

		if (props.embedReferenceDiscriminateBy !== undefined) {
			if (props.embedContentDiscriminationField === undefined) {
				throw new BindingError(
					`BlockEditor: You enabled embed blocks by supplying the 'embedReferenceDiscriminateBy' prop but then ` +
						`failed to also supply the 'embedContentDiscriminationField'. Without it, the editor would not be ` +
						`able to distinguish between the kinds of embedded content.`,
				)
			}
			if (!props.embedHandlers || Array.from(props.embedHandlers).length === 0) {
				throw new BindingError(
					`BlockEditor: You enabled embed blocks by supplying the 'embedReferenceDiscriminateBy' prop but then ` +
						`failed to also supply any embed handlers. Without them, the editor would not be able to ` +
						`recognize any embedded content.`,
				)
			}
		}
	}
}

const RB = RichEditor.buttons
const defaultInlineButtons: HoveringToolbarsProps['inlineButtons'] = [
	[RB.bold, RB.italic, RB.underline, RB.anchor],
	[RB.headingOne, RB.headingTwo],
	[RB.strikeThrough, RB.code],
]
