import { Component, SugaredFieldProps, SugaredRelativeEntityList } from '@contember/binding'
import type { ComponentType, ReactNode } from 'react'
import { Fragment } from 'react'
import { BlockRepeater, Repeater } from '../../collections'
import {
	BareFileRepeaterContainer,
	BareFileRepeaterContainerPrivateProps,
	BareFileRepeaterContainerPublicProps,
} from './BareFileRepeaterContainer'
import type { ResolvedFileKinds } from '../ResolvedFileKinds'
import { staticRenderFileKind } from '../utils'

export interface BareFileRepeaterProps extends SugaredRelativeEntityList, BareFileRepeaterContainerPublicProps {
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
			return (
				<BlockRepeater {...props} discriminationField={props.fileKinds.discriminationField} initialEntityCount={0}>
					{Array.from(props.fileKinds.fileKinds.values(), (fileKind, i) => (
						<Fragment key={i}>{staticRenderFileKind(fileKind.datum, environment)}</Fragment>
					))}
				</BlockRepeater>
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
