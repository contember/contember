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
import * as React from 'react'
import { emptyArray, useArrayMapMemo, useConstantLengthInvariant } from '@contember/react-utils'
import { Block } from '../../blocks'
import { BlockRepeater } from '../../collections'
import { BlockEditorInner, BlockEditorInnerPublicProps } from './BlockEditorInner'
import { FieldBackedElement, NormalizedFieldBackedElement } from './FieldBackedElement'

export interface BlockEditorProps extends HasManyProps, BlockEditorInnerPublicProps {
	leadingFieldBackedElements?: FieldBackedElement[]
	trailingFieldBackedElements?: FieldBackedElement[]
}

// TODO enforce that leadingFieldBackedElements and trailingFieldBackedElements always have the same length
export const BlockEditor = Component<BlockEditorProps>(
	props => {
		const entity = useEntityContext()
		const environment = useEnvironment()

		useConstantLengthInvariant(
			props.leadingFieldBackedElements || [],
			'The number of leadingFieldBackedElements must remain constant between renders.',
		)
		useConstantLengthInvariant(
			props.trailingFieldBackedElements || [],
			'The number of trailingFieldBackedElements must remain constant between renders.',
		)

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
		const trailingDesugared = useArrayMapMemo(
			props.trailingFieldBackedElements || emptyArray,
			desugarFieldBackedElement,
		)

		const normalizedLeading = useNormalizedFieldBackedElements(
			entity,
			environment,
			leadingDesugared,
			props.leadingFieldBackedElements,
		)
		const normalizedTrailing = useNormalizedFieldBackedElements(
			entity,
			environment,
			trailingDesugared,
			props.trailingFieldBackedElements,
		)

		return (
			<BlockEditorInner
				{...props}
				batchUpdates={entity.batchUpdates}
				desugaredEntityList={desugaredEntityList}
				entityListAccessor={entityListAccessor}
				leadingFieldBackedElements={normalizedLeading}
				trailingFieldBackedElements={normalizedTrailing}
			/>
		)
	},
	props => {
		if (props.textBlockDiscriminatedBy !== undefined && props.textBlockDiscriminatedByScalar !== undefined) {
			throw new BindingError(
				`BlockEditor: the text block cannot be simultaneously discriminated by a literal and a scalar.\n` +
					`Both the 'textBlockDiscriminatedBy' and the 'textBlockDiscriminatedByScalar' supplied.`,
			)
		}
		const field = <SugaredField field={props.textBlockField} />
		return (
			<>
				{props.leadingFieldBackedElements?.map((item, i) => (
					<SugaredField field={item.field} key={`leading_${i}`} />
				))}
				{props.trailingFieldBackedElements?.map((item, i) => (
					<SugaredField field={item.field} key={`trailing_${i}`} />
				))}
				<BlockRepeater {...props}>
					{props.children}
					{props.textBlockDiscriminatedBy && <Block discriminateBy={props.textBlockDiscriminatedBy}>{field}</Block>}
					{props.textBlockDiscriminatedByScalar && (
						<Block discriminateByScalar={props.textBlockDiscriminatedByScalar}>{field}</Block>
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
