import { Component } from '@contember/binding'
import type { ReactNode } from 'react'
import { ReactElement } from 'react'
import type { FileInputPublicProps } from '../../internalComponents'
import { BareUploadField, useFileSelection } from '../../internalComponents'
import { HybridFileKindProps } from '../../fileKinds'
import { getFileHandler, useFileHandler } from '../../fileHandler'

export type UploadFieldProps<SFExtraProps extends {} = {}> =
	& FileInputPublicProps
	& HybridFileKindProps
	& {
		children?: ReactNode
	}

/**
 * @group Uploads
 */
export const UploadField = Component<UploadFieldProps>(
	props => {
		const fileHandler = useFileHandler(props, 'UploadField')
		const fileSelection = useFileSelection(props)
		return <BareUploadField {...props} fileHandler={fileHandler} fileSelection={fileSelection} />
	},
	(props, environment) => (
		<BareUploadField {...props} fileHandler={getFileHandler(props, environment, 'UploadField')} />
	),
	'UploadField',
) as <SFExtraProps extends {} = {}>(props: UploadFieldProps<SFExtraProps>) => ReactElement | null
