import { BindingError, Component, Field, HasManyProps, useRelativeEntityList } from '@contember/binding'
import * as React from 'react'
import { Block } from '../../blocks'
import { BlockRepeater } from '../../collections'
import { BlockEditorInner, BlockEditorInnerPublicProps } from './BlockEditorInner'

export interface BlockEditorProps extends HasManyProps, BlockEditorInnerPublicProps {}

export const BlockEditor = Component<BlockEditorProps>(
	props => {
		const entityList = useRelativeEntityList(props)

		return <BlockEditorInner {...props} entityList={entityList} />
	},
	props => {
		if (props.textBlockDiscriminatedBy !== undefined && props.textBlockDiscriminatedByScalar !== undefined) {
			throw new BindingError(
				`BlockEditor: the text block cannot be simultaneously discriminated by a literal and a scalar.\n` +
					`Both the 'textBlockDiscriminatedBy' and the 'textBlockDiscriminatedByScalar' supplied.`,
			)
		}
		const field =
			typeof props.textBlockField === 'string' ? (
				<Field field={props.textBlockField} />
			) : (
				<Field {...props.textBlockField} />
			)
		return (
			<BlockRepeater {...props}>
				{props.children}
				{props.textBlockDiscriminatedBy && <Block discriminateBy={props.textBlockDiscriminatedBy}>{field}</Block>}
				{props.textBlockDiscriminatedByScalar && (
					<Block discriminateByScalar={props.textBlockDiscriminatedByScalar}>{field}</Block>
				)}
			</BlockRepeater>
		)
	},
	'BlockEditor',
)
