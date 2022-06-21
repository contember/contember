import { Component, useEnvironment } from '@contember/binding'
import { BareUploadField } from './BareUploadField'
import { useResolvedSingleKindFileSelection } from './selection/useResolvedSingleKindFileSelection'
import { createEntityConnectorFactory } from '../fileHandler/utils/createEntityConnector'
import { isEmptyByUrlField, SingleKindFileHandler, useSingleKindFileHandler } from '../fileHandler'
import { SelectFileInputSelectionComponentProps } from './selection/SelectFileInput'
import { FileInputPublicProps } from './FileInput'
import { CommonFileKindProps, FullFileKind } from '../fileKinds'
import { useCallback } from 'react'

export type PublicSingleKindUploadFieldProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& CommonFileKindProps<AcceptArtifacts>
	& SelectFileInputSelectionComponentProps<SFExtraProps>
	& FileInputPublicProps

export type SingleKindUploadFieldProps<AcceptArtifacts = unknown, SFExtraProps extends {} = {}> =
	& PublicSingleKindUploadFieldProps<AcceptArtifacts,  SFExtraProps>
	& {
		kindFactory: (params: PublicSingleKindUploadFieldProps) => FullFileKind<any, any>
	}

export const SingleKindUploadField = Component<SingleKindUploadFieldProps>(props => {
		const env = useEnvironment()
		const connectorFactoryFactory = useCallback(
			() => createEntityConnectorFactory(env, props.baseEntity),
			[env, props.baseEntity],
		)
		return (
			<BareUploadField
				{...props}
				fileSelection={useResolvedSingleKindFileSelection(props, connectorFactoryFactory)}
				fileHandler={useSingleKindFileHandler(props, props.kindFactory)}
			/>
		)
	},
	props => (
		<BareUploadField
			{...props}
			fileHandler={new SingleKindFileHandler(
				props.kindFactory(props),
				isEmptyByUrlField(props.urlField),
			)}
		/>
	),
	'SingleKindUploadField')
