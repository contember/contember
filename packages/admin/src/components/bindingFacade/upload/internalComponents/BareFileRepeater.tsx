import { Component, HasOne, SugaredField, SugaredFieldProps, SugaredRelativeEntityList } from '@contember/binding'
import type { ComponentType } from 'react'
import { Fragment } from 'react'
import { Repeater } from '../../collections'
import type { ResolvedFileKinds } from '../ResolvedFileKinds'
import { staticRenderFileKind } from '../utils'
import {
	BareFileRepeaterContainer,
	BareFileRepeaterContainerPrivateProps,
	BareFileRepeaterContainerPublicProps,
} from './BareFileRepeaterContainer'

export type BareFileRepeaterProps =
	& SugaredRelativeEntityList
	& BareFileRepeaterContainerPublicProps
	& {
		sortableBy?: SugaredFieldProps['field']
		fileKinds: ResolvedFileKinds
	}

export const BareFileRepeater: ComponentType<BareFileRepeaterProps> = Component<BareFileRepeaterProps>(
	props => (
		<Repeater<BareFileRepeaterContainerPrivateProps, any>
			{...props}
			initialEntityCount={0}
			useDragHandle={false}
			containerComponent={BareFileRepeaterContainer}
			unstable__sortAxis="xy"
		/>
	),
	(props, environment) => {
		if (props.fileKinds.isDiscriminated) {
			const renderedFileKinds = (
				<>
					<SugaredField field={props.fileKinds.discriminationField} isNonbearing />
					{Array.from(props.fileKinds.fileKinds.values(), (fileKind, i) => (
						<Fragment key={i}>{staticRenderFileKind(fileKind.datum, environment)}</Fragment>
					))}
				</>
			)
			const repeaterChildren = props.fileKinds.baseEntity === undefined
				? renderedFileKinds
				: (
					<HasOne field={props.fileKinds.baseEntity}>{renderedFileKinds}</HasOne>
				)

			return (
				<Repeater {...props} initialEntityCount={0}>
					{repeaterChildren}
				</Repeater>
			)
		}

		return (
			<Repeater {...props} initialEntityCount={0}>
				{staticRenderFileKind(props.fileKinds.fileKind, environment)}
			</Repeater>
		)
	},
	'BareFileRepeater',
)
