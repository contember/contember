import {
	BindingError,
	Component,
	EntityAccessor,
	Environment,
	FieldAccessor,
	HasManyProps,
	QueryLanguage,
	RelativeSingleField,
	SugaredField,
	useDesugaredRelativeEntityList,
	useEntityContext,
	useEnvironment,
} from '@contember/binding'
import { emptyArray, useArrayMapMemo, useConstantLengthInvariant } from '@contember/react-utils'
import * as React from 'react'
import { BlockRepeater } from '../../collections'
import { useDiscriminatedData } from '../../discrimination'
import { BlockEditorInner, BlockEditorInnerPublicProps } from './BlockEditorInner'
import { EmbedHandler } from './embed'
import { FieldBackedElement, NormalizedFieldBackedElement } from './FieldBackedElement'

export interface BlockEditorProps extends HasManyProps, BlockEditorInnerPublicProps {
	leadingFieldBackedElements?: FieldBackedElement[]
	//trailingFieldBackedElements?: FieldBackedElement[]

	embedHandlers?: Iterable<EmbedHandler>
}

// TODO enforce that leadingFieldBackedElements and trailingFieldBackedElements always have the same length
export const BlockEditor = Component<BlockEditorProps>(
	props => {
		const entity = useEntityContext()
		const environment = useEnvironment()

		useConstantLengthInvariant(
			props.leadingFieldBackedElements || emptyArray,
			'The number of leadingFieldBackedElements must remain constant between renders.',
		)
		//useConstantLengthInvariant(
		//	props.trailingFieldBackedElements || emptyArray,
		//	'The number of trailingFieldBackedElements must remain constant between renders.',
		//)

		const desugaredEntityList = useDesugaredRelativeEntityList(props)
		const entityListAccessor = React.useMemo(() => entity.getRelativeEntityList(desugaredEntityList), [
			entity,
			desugaredEntityList,
		])

		const desugarFieldBackedElement = React.useCallback(
			(element: FieldBackedElement) => QueryLanguage.desugarRelativeSingleField(element.field, environment),
			[environment],
		)

		const leadingDesugared = useArrayMapMemo(props.leadingFieldBackedElements || emptyArray, desugarFieldBackedElement)
		//const trailingDesugared = useArrayMapMemo(
		//	props.trailingFieldBackedElements || emptyArray,
		//	desugarFieldBackedElement,
		//)

		const normalizedLeading = useNormalizedFieldBackedElements(
			entity,
			environment,
			leadingDesugared,
			props.leadingFieldBackedElements,
		)
		//const normalizedTrailing = useNormalizedFieldBackedElements(
		//	entity,
		//	environment,
		//	trailingDesugared,
		//	props.trailingFieldBackedElements,
		//)

		const embedHandlers = useDiscriminatedData<EmbedHandler, EmbedHandler>(props.embedHandlers || emptyArray)

		return (
			<BlockEditorInner
				{...props}
				environment={environment}
				batchUpdates={entity.batchUpdates}
				desugaredEntityList={desugaredEntityList}
				entityListAccessor={entityListAccessor}
				leadingFieldBackedElements={normalizedLeading}
				//trailingFieldBackedElements={normalizedTrailing}
				embedHandlers={embedHandlers}
			/>
		)
	},
	(props, environment) => {
		const embedHandlers = Array.from(props.embedHandlers || [])
		if (__DEV_MODE__) {
			if (props.textBlockDiscriminateBy !== undefined && props.textBlockDiscriminateByScalar !== undefined) {
				throw new BindingError(
					`BlockEditor: You cannot simultaneously use the 'textBlockDiscriminateBy' and the ` +
						`'textBlockDiscriminateByScalar' prop at the same time. Choose exactly one.`,
				)
			}
			if (props.textBlockDiscriminateBy === undefined && props.textBlockDiscriminateByScalar === undefined) {
				throw new BindingError(
					`BlockEditor: undiscriminated text blocks. You must supply either the 'textBlockDiscriminateBy' or the ` +
						`'textBlockDiscriminateByScalar' props. The editor needs to be able to tell which blocks are to be ` +
						`treated as text.`,
				)
			}
			if (props.embedBlockDiscriminateBy !== undefined && props.embedBlockDiscriminateByScalar !== undefined) {
				throw new BindingError(
					`BlockEditor: You cannot simultaneously use the 'embedBlockDiscriminateBy' and the ` +
						`'embedBlockDiscriminateByScalar' prop at the same time. Choose exactly one.`,
				)
			}
			if (props.embedBlockDiscriminateBy !== undefined || props.embedBlockDiscriminateByScalar !== undefined) {
				if (props.embedContentDiscriminationField === undefined) {
					throw new BindingError(
						`BlockEditor: You enabled embed blocks by supplying the 'embedBlockDiscriminateBy(Scalar)' prop but then ` +
							`failed to also supply the 'embedContentDiscriminationField'. Without it, the editor would not be ` +
							`able to distinguish between the kinds of embedded content.`,
					)
				}
				if (embedHandlers.length === 0) {
					throw new BindingError(
						`BlockEditor: You enabled embed blocks by supplying the 'embedBlockDiscriminateBy(Scalar)' prop but then ` +
							`failed to also supply any embed handlers. Without them, the editor would not be able to ` +
							`recognize any embedded content.`,
					)
				}
			}
		}
		return (
			<>
				{props.leadingFieldBackedElements?.map((item, i) => (
					<SugaredField field={item.field} key={`leading_${i}`} />
				))}
				{/*props.trailingFieldBackedElements?.map((item, i) => (
					<SugaredField field={item.field} key={`trailing_${i}`} />
				))*/}
				<BlockRepeater {...props}>
					<SugaredField field={props.textBlockField} />
					{props.children}
					{props.embedContentDiscriminationField && (
						<>
							<SugaredField field={props.embedContentDiscriminationField} />
							{embedHandlers.map((handler, i) => (
								<React.Fragment key={i}>{handler.getStaticFields(environment)}</React.Fragment>
							))}
						</>
					)}
				</BlockRepeater>
			</>
		)
	},
	'BlockEditor',
)

const useNormalizedFieldBackedElements = (
	entity: EntityAccessor,
	environment: Environment,
	desugaredOriginal: RelativeSingleField[] = [],
	original: FieldBackedElement[] = [],
): NormalizedFieldBackedElement[] => {
	const getRelativeSingleFields = React.useCallback(
		(item: RelativeSingleField) => entity.getRelativeSingleField(item),
		[entity],
	)
	const accessors = useArrayMapMemo(desugaredOriginal, getRelativeSingleFields)
	const normalizeFieldBackElement = React.useCallback(
		(value: FieldAccessor, index: number): NormalizedFieldBackedElement => ({
			...original[index],
			field: desugaredOriginal[index],
			accessor: accessors[index],
		}),
		[accessors, desugaredOriginal, original],
	)

	return useArrayMapMemo(accessors, normalizeFieldBackElement)
}
