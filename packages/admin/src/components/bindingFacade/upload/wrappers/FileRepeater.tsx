import type { SugaredFieldProps, SugaredRelativeEntityList } from '@contember/binding'
import { Component } from '@contember/binding'
import type { ReactNode } from 'react'
import { ReactElement } from 'react'
import { BareFileRepeater, FileInputPublicProps } from '../internalComponents'
import { getResolvedFileKinds, HybridFileKindProps, useFileKinds } from '../templating'

export type FileRepeaterProps<SFExtraProps extends {} = {}> =
	& SugaredRelativeEntityList
	& HybridFileKindProps<SFExtraProps>
	& FileInputPublicProps
	& {
		boxLabel?: ReactNode
		label: ReactNode
		sortableBy?: SugaredFieldProps['field']
		children?: ReactNode
	}

export const FileRepeater = Component<FileRepeaterProps>(
	props => {
		const fileKinds = useFileKinds(props, 'FileRepeater')
		return <BareFileRepeater {...props} fileKinds={fileKinds} />
	},
	(props, environment) => (
		<BareFileRepeater {...props} fileKinds={getResolvedFileKinds(props, environment, 'FileRepeater')} />
	),
	'FileRepeater',
) as <SFExtraProps extends {} = {}>(props: FileRepeaterProps<SFExtraProps>) => ReactElement | null
