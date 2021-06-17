import type { SugaredFieldProps, SugaredRelativeEntityList } from '@contember/binding'
import { Component, useEnvironment } from '@contember/binding'
import type { FormGroupProps } from '@contember/ui'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import type { RepeaterContainerPublicProps } from '../../collections'
import { BareFileRepeater } from '../BareFileRepeater'
import { getResolvedFileKinds } from '../templating'

export interface FileRepeaterProps
	extends SugaredRelativeEntityList,
		RepeaterContainerPublicProps,
		Pick<FormGroupProps, 'description' | 'labelDescription'> {
	addButtonSubText?: ReactNode
	label: ReactNode
	sortableBy?: SugaredFieldProps['field']
	discriminationField?: SugaredFieldProps['field']
	children?: ReactNode
}

export const FileRepeater = Component<FileRepeaterProps>(
	props => {
		const environment = useEnvironment()
		const fileKinds = useMemo(() => getResolvedFileKinds(props.children, environment, props.discriminationField), [
			props.children,
			props.discriminationField,
			environment,
		])
		if (!fileKinds) {
			return null // TODO!
		}
		return <BareFileRepeater {...props} fileKinds={fileKinds} />
	},
	(props, environment) => {
		const fileKinds = getResolvedFileKinds(props.children, environment, props.discriminationField)
		if (!fileKinds) {
			return null // TODO!
		}
		return <BareFileRepeater {...props} fileKinds={fileKinds} />
	},
	'FileRepeater',
)
