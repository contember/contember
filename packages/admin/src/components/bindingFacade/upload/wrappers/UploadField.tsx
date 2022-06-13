import { Component } from '@contember/binding'
import type { ReactNode } from 'react'
import { ReactElement } from 'react'
import type { FileInputPublicProps } from '../internalComponents'
import { BareUploadField } from '../internalComponents'
import { getResolvedFileKinds, HybridFileKindProps, useFileKinds } from '../templating'

export type UploadFieldProps<SFExtraProps extends {} = {}> =
	& FileInputPublicProps
	&	HybridFileKindProps<SFExtraProps>
	& {
		children?: ReactNode
	}

export const UploadField = Component<UploadFieldProps>(
	props => {
		const fileKinds = useFileKinds(props, 'UploadField')

		return <BareUploadField {...props} fileKinds={fileKinds} />
	},
	(props, environment) => (
		<BareUploadField {...props} fileKinds={getResolvedFileKinds(props, environment, 'UploadField')} />
	),
	'UploadField',
) as <SFExtraProps extends {} = {}>(props: UploadFieldProps<SFExtraProps>) => ReactElement | null
