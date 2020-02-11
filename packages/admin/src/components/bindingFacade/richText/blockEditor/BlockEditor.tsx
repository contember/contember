import {
	BindingError,
	Component,
	EntityAccessor,
	Environment,
	HasManyProps,
	QueryLanguage,
	SugaredField,
	useEntityContext,
	useEnvironment,
	useRelativeEntityList,
} from '@contember/binding'
import * as React from 'react'
import { useArrayMapMemo } from '../../../../utils'
import { Block } from '../../blocks'
import { BlockRepeater } from '../../collections'
import { BlockEditorInner, BlockEditorInnerPublicProps } from './BlockEditorInner'
import { FieldBackedElement, NormalizedFieldBackedElement } from './FieldBackedElement'

export interface BlockEditorProps extends HasManyProps, BlockEditorInnerPublicProps {
	leadingFieldBackedElements?: FieldBackedElement[]
	trailingFieldBackedElements?: FieldBackedElement[]
}

export const BlockEditor = Component<BlockEditorProps>(
	props => {
		const entity = useEntityContext()
		const environment = useEnvironment()
		const entityList = useRelativeEntityList(props)

		const normalizedLeading = useNormalizedFieldBackedElements(entity, environment, props.leadingFieldBackedElements)
		const normalizedTrailing = useNormalizedFieldBackedElements(entity, environment, props.trailingFieldBackedElements)

		return (
			<BlockEditorInner
				{...props}
				entityList={entityList}
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
				{(props.leadingFieldBackedElements || []).map(item => (
					<SugaredField field={item.field} />
				))}
				{(props.trailingFieldBackedElements || []).map(item => (
					<SugaredField field={item.field} />
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
	original: FieldBackedElement[] = [],
): NormalizedFieldBackedElement[] => {
	const sugared = original.map(item => item.field)
	const desugared = useArrayMapMemo(sugared, item => QueryLanguage.desugarRelativeSingleField(item, environment))
	const accessors = useArrayMapMemo(desugared, item => entity.getRelativeSingleField(item))

	return useArrayMapMemo(
		accessors,
		(value, index): NormalizedFieldBackedElement => ({
			...original[index],
			field: accessors[index],
		}),
	)
}
