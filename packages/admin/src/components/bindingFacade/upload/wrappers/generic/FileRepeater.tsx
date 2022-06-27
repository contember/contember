import type { SugaredFieldProps, SugaredRelativeEntityList } from '@contember/binding'
import { Component } from '@contember/binding'
import type { ReactNode } from 'react'
import { ReactElement } from 'react'
import { BareFileRepeater, FileInputPublicProps, useFileSelection } from '../../internalComponents'
import { HybridFileKindProps } from '../../fileKinds'
import { getFileHandler, useFileHandler } from '../../fileHandler'

export type FileRepeaterProps<SFExtraProps extends {} = {}> =
	& SugaredRelativeEntityList
	& HybridFileKindProps
	& FileInputPublicProps
	& {
		boxLabel?: ReactNode
		label: ReactNode
		sortableBy?: SugaredFieldProps['field']
		children?: ReactNode
	}

export const FileRepeater = Component<FileRepeaterProps>(
	props => {
		const fileHandler = useFileHandler(props, 'FileRepeater')
		const fileSelection = useFileSelection(props)
		return <BareFileRepeater {...props} fileHandler={fileHandler} fileSelection={fileSelection} />
	},
	(props, environment) => (
		<BareFileRepeater {...props} fileHandler={getFileHandler(props, environment, 'FileRepeater')} />
	),
	'FileRepeater',
) as <SFExtraProps extends {} = {}>(props: FileRepeaterProps<SFExtraProps>) => ReactElement | null
