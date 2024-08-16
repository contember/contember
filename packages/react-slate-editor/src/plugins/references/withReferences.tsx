import { EditorPlugin, EditorPluginWrapperProps } from '@contember/react-slate-editor-base'
import { useMemo } from 'react'
import { SugaredRelativeEntityList, SugaredRelativeSingleField, TreeNodeEnvironmentFactory } from '@contember/binding'
import { isElementWithReference } from './elements'
import { referenceOverrides } from './referenceOverrides'
import { ErrorBoundary } from 'react-error-boundary'
import { ReferenceElementWrapper } from './ReferenceElementWrapper'
import { getEditorReferenceBlocks } from '../../internal/helpers/useCreateEditorReferenceBlocks'
import { useGetReferencedEntity } from './useGetReferencedEntity'
import { useCreateElementReference } from './useCreateElementReference'
import { useInsertElementWithReference } from './useInsertElementWithReference'
import { EditorBlockElementContext, EditorGetReferencedEntityContext, EditorReferenceMethodsContext } from '../../contexts'
import { Field, HasMany, useEnvironment } from '@contember/react-binding'
import { useCleanupReferences } from './useCleanupReferences'

export interface ReferencesPluginArgs {
	field: SugaredRelativeEntityList['field']
	discriminationField: SugaredRelativeSingleField['field']
}


export const withReferences = (args: ReferencesPluginArgs): EditorPlugin => {
	return {
		extendEditor: ({ editor, children, environment, entity }) => {
			const blocks = getEditorReferenceBlocks(children, TreeNodeEnvironmentFactory.createEnvironmentForEntityList(environment, {
				field: args.field,
			}))
			for (const block of Object.values(blocks)) {
				editor.registerElement({
					type: block.name,
					canContainAnyBlocks: true,
					isVoid: block.isVoid,
					render: props => {
						return (
							<EditorBlockElementContext.Provider value={props}>
								{block.render({ ...props, isVoid: block.isVoid })}
							</EditorBlockElementContext.Provider>
						)
					},
				})
			}

			referenceOverrides(editor)

			const { renderElement } = editor

			editor.renderElement = props => {
				let children = renderElement(props)
				if (isElementWithReference(props.element)) {
					return (
						<ErrorBoundary fallback={<span style={{ background: 'red', color: 'white' }}>Invalid element</span>}>
							<ReferenceElementWrapper element={props.element}>{children}</ReferenceElementWrapper>
						</ErrorBoundary>
					)
				}
				return children
			}
		},
		OuterWrapper: ({ children, editor }: EditorPluginWrapperProps) => {
			const env = useEnvironment()

			const editorReferenceBlocks = useMemo(() => {
				return getEditorReferenceBlocks(children, TreeNodeEnvironmentFactory.createEnvironmentForEntityList(env, {
					field: args.field,
				}))
			}, [children, env])
			useCleanupReferences({ field: args.field, editor })

			const getReferencedEntity = useGetReferencedEntity({
				referencesField: args.field,
			})
			const createElementReference = useCreateElementReference({
				referenceDiscriminationField: args.discriminationField,
				referencesField: args.field,
				editor,
			})

			const insertElementWithReference = useInsertElementWithReference({
				createElementReference: createElementReference,
				blocks: editorReferenceBlocks,
				editor,
			})

			const methods = useMemo(() => ({ insertElementWithReference, createElementReference }), [insertElementWithReference, createElementReference])
			return (
				<EditorGetReferencedEntityContext.Provider value={getReferencedEntity}>
					<EditorReferenceMethodsContext.Provider value={methods}>
						{children}
					</EditorReferenceMethodsContext.Provider>
				</EditorGetReferencedEntityContext.Provider>
			)
		},
		staticRender: ({ children }, environment) => {
			return (
				<HasMany
					field={args.field}
					initialEntityCount={0}
				>
					<Field field={args.discriminationField} />
					{children}
				</HasMany>
			)
		},
	}
}
