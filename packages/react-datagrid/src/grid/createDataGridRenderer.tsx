import { Component } from '@contember/react-binding'
import { ComponentType, Fragment, ReactNode } from 'react'
import { DataGridColumnProps, DataGridFilterArtifact } from '../types'
import { DataViewLoaderState, dataViewSelectionEnvironmentExtension } from '@contember/react-dataview'
import { ControlledDataGridProps } from './createControlledDataGrid'

export const createDataGridRenderer = <ColumnProps extends {}, ContainerProps extends {}>({ Fallback, Container, staticRender, columnStaticRender }: {
	Fallback: ComponentType<{ children?: ReactNode }>
	Container: ComponentType<ContainerProps>
	staticRender?: (props: ContainerProps) => ReactNode
	columnStaticRender?: (props: { column: DataGridColumnProps<DataGridFilterArtifact, ColumnProps> }) => ReactNode
}) => Component<ContainerProps & ControlledDataGridProps>(props => {
	return (
		<>
			<DataViewLoaderState initial refreshing>
				<Fallback />
			</DataViewLoaderState>
			<Container {...props as any} />
		</>
	)
}, (props, env) => {
	const selection = env.getExtension(dataViewSelectionEnvironmentExtension)?.visibility ?? {}
	return <>
		{staticRender && staticRender(props as any)}
		{Array.from(props.columns)
			.filter(([key]) => selection[key] !== false)
			.map(([key, props]) => (
				<Fragment key={key}>
					{columnStaticRender && columnStaticRender({ column: props })}
					{props.children}
				</Fragment>
			))}
	</>
})
