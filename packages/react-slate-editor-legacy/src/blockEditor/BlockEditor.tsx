import {
	BindingError,
	Component,
	Environment,
	FieldValue,
	HasMany,
	SugaredField,
	SugaredFieldProps,
	SugaredRelativeEntityList,
	useDesugaredRelativeSingleField,
	useEntity,
	useEnvironment,
	VariableInputTransformer,
} from '@contember/react-binding'
import { emptyArray, useReferentiallyStableCallback } from '@contember/react-utils'
import { ComponentType, Fragment, FunctionComponent, ReactElement, ReactNode, useEffect, useMemo, useState } from 'react'
import { Slate, useSlate } from 'slate-react'
import { getDiscriminatedBlock, useNormalizedBlocks } from '../blocks'
import { SugaredDiscriminateBy, useDiscriminatedData } from '../discrimination'
import { initBlockEditor } from './editor'
import type { EmbedHandler } from './embed'
import { useCreateElementReference } from './references'
import { ReferencesProvider } from './references/ReferencesProvider'
import { useGetReferencedEntity } from './references/useGetReferencedEntity'
import { useInsertElementWithReference } from './references/useInsertElementWithReference'
import { SortedBlocksContext } from './state/SortedBlocksContext'
import { useBlockEditorState } from './state/useBlockEditorState'
import { ContentOutlet, ContentOutletProps, useEditorReferenceBlocks } from './templating'
import { OverrideRenderElementOptions } from './editor/overrideRenderElement'
import { EditorReferenceBlocksContext } from '../contexts'
import { ReferenceElementRendererProps } from './elements'
import { Repeater } from '@contember/react-repeater'
import { Descendant, insertNodes, Node, removeNodes, withoutNormalizing } from 'slate'
import { createEditor, CreateEditorPublicOptions, paragraphElementType } from '@contember/react-slate-editor-base'

export interface BlockEditorProps extends SugaredRelativeEntityList, CreateEditorPublicOptions {

	contentField: SugaredFieldProps['field']
	sortableBy: SugaredFieldProps['field']
	children?: ReactNode

	referencesField?: SugaredRelativeEntityList | string
	referenceDiscriminationField?: SugaredFieldProps['field']
	monolithicReferencesMode?: boolean
	renderReference?: ComponentType<ReferenceElementRendererProps>

	embedReferenceDiscriminateBy?: SugaredDiscriminateBy
	embedContentDiscriminationField?: SugaredFieldProps['field']
	embedHandlers?: Iterable<EmbedHandler>
	renderSortableBlock: OverrideRenderElementOptions['renderSortableBlock']
}

const BlockEditorComponent: FunctionComponent<BlockEditorProps> = Component(
	props => {
		const environment = useEnvironment()

		assertStaticBlockEditorInvariants(props, environment)

		const {
			contentField,
			sortableBy,
			children,

			referencesField,
			referenceDiscriminationField,
			monolithicReferencesMode = false,

			embedReferenceDiscriminateBy,
			embedContentDiscriminationField,
			embedHandlers = emptyArray,


			plugins,
			renderSortableBlock,
			renderReference,

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

		const entity = useEntity()

		const [{ editor, OuterWrapper, InnerWrapper }] = useState(() => {
			return createEditor({ defaultElementType: paragraphElementType, plugins, entity, environment, children })
		})

		const { nodes, onChange, sortedBlocksRef, refreshBlocks } = useBlockEditorState({
			editor,
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
			editor,
			createElementReference: stableCreateElementReference,
		})

		const stableGetReferencedEntity = useReferentiallyStableCallback(getReferencedEntity)
		useState(() =>
			initBlockEditor({
				editor,
				editorReferenceBlocks,
				embedContentDiscriminationField: desugaredEmbedContentDiscriminationField,
				embedHandlers: discriminatedEmbedHandlers,
				embedReferenceDiscriminateBy: embedReferenceDiscriminant,
				embedSubBlocks,
				referenceDiscriminationField: desugaredReferenceDiscriminationField,
				createElementReferences: stableCreateElementReference,
				getReferencedEntity: stableGetReferencedEntity,
				insertElementWithReference,
				renderSortableBlock,
				renderReference,
			}))

		useEffect(() => {
			refreshBlocks()
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [])

		return (
			<OuterWrapper>
				<Repeater {...blockListProps} sortableBy={sortableBy}>

					<ReferencesProvider getReferencedEntity={getReferencedEntity}>
						<SortedBlocksContext.Provider value={sortedBlocksRef.current}>
							<EditorReferenceBlocksContext.Provider value={editorReferenceBlocks}>
								<Slate editor={editor} initialValue={nodes} onChange={onChange}>
									<SyncValue nodes={nodes}/>
									<InnerWrapper>
										{children}
									</InnerWrapper>
								</Slate>
							</EditorReferenceBlocksContext.Provider>
						</SortedBlocksContext.Provider>
					</ReferencesProvider>
				</Repeater>

			</OuterWrapper>
		)
	},
	(props, environment) => {
		assertStaticBlockEditorInvariants(props, environment)

		const embedHandlers = Array.from(props.embedHandlers || [])

		const references = !!(props.referencesField && props.referenceDiscriminationField) && (
			<HasMany
				{...(typeof props.referencesField === 'string' ? { field: props.referencesField } : props.referencesField)}
				initialEntityCount={0}
			>
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
				<HasMany field={props.field} initialEntityCount={0}>
					<SugaredField field={props.sortableBy} />
					<SugaredField field={props.contentField} />
					{!props.monolithicReferencesMode && references}
				</HasMany>
				{props.monolithicReferencesMode && references}
			</>
		)
	},
	'BlockEditor',
)

const SyncValue = ({ nodes }: { nodes: Descendant[] }) => {
	const editor = useSlate()
	useEffect(() => {
		if (editor.children !== nodes && JSON.stringify(editor.children) !== JSON.stringify(nodes)) {
			withoutNormalizing(editor, () => {
				for (const [, childPath] of Node.children(editor, [], {
					reverse: true,
				})) {
					removeNodes(editor, { at: childPath })
				}
				insertNodes(editor, nodes)
			})
		}

	}, [editor, nodes])
	return null
}

/**
 * The `BlockEditor` component is the main component of the editor. It is responsible for rendering the content editor.
 *
 * @group Blocks and repeaters
 */
export const BlockEditor = Object.assign<
	typeof BlockEditorComponent,
	{
		ContentOutlet: (props: ContentOutletProps) => ReactElement | null
		// TextField: (props: TextFieldProps) => ReactElement | null
	}
>(BlockEditorComponent, {
	ContentOutlet,
})

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
