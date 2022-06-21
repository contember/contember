import { Component, SugaredFieldProps, SugaredRelativeEntityList, useEnvironment } from '@contember/binding'
import { useResolvedSingleKindFileSelection } from './selection/useResolvedSingleKindFileSelection'
import { createEntityConnectorFactory } from '../fileHandler/utils/createEntityConnector'
import { isEmptyByUrlField, SingleKindFileHandler, useSingleKindFileHandler } from '../fileHandler'
import { SelectFileInputSelectionComponentProps } from './selection/SelectFileInput'
import { FileInputPublicProps } from './FileInput'
import { CommonFileKindProps, FullFileKind } from '../fileKinds'
import { BareFileRepeater } from './BareFileRepeater'
import { ReactNode, useCallback } from 'react'

export type PublicSingleKindFileRepeaterProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& SugaredRelativeEntityList
	& CommonFileKindProps<AcceptArtifacts>
	& SelectFileInputSelectionComponentProps<SFExtraProps>
	& FileInputPublicProps
	& {
		sortableBy?: SugaredFieldProps['field']
		boxLabel?: ReactNode
		label: ReactNode
	}

export type SingleKindFileRepeaterProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& PublicSingleKindFileRepeaterProps<AcceptArtifacts, SFExtraProps>
	& {
		kindFactory: (params: PublicSingleKindFileRepeaterProps) => FullFileKind<any, any>
	}

export const SingleKindFileRepeater = Component<SingleKindFileRepeaterProps>(props => {
		const env = useEnvironment()
		const connectorFactoryFactory = useCallback(
			() => createEntityConnectorFactory(env, props.baseEntity),
			[env, props.baseEntity],
		)
		return (
			<BareFileRepeater
				{...props}
				fileSelection={useResolvedSingleKindFileSelection(props, connectorFactoryFactory)}
				fileHandler={useSingleKindFileHandler(props, props.kindFactory)}
			/>
		)
	},
	props => (
		<BareFileRepeater
			{...props}
			fileHandler={new SingleKindFileHandler(
				props.kindFactory(props),
				isEmptyByUrlField(props.urlField),
			)}
		/>
	),
	'SingleKindFileRepeater')
