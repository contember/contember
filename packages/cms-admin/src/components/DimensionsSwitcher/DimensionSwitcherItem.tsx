import * as React from 'react'
import { Field, Environment } from '../../binding'
import { Parser } from '../../binding/queryLanguage'

interface DimensionSwitcherItemProps {
	labelName: string
	valueName: string
}

export class DimensionSwitcherItem extends React.PureComponent<DimensionSwitcherItemProps> {
	public static displayName = 'DimensionSwitcherItem'
	public render() {
		return null
	}
	public static generateSyntheticChildren(
		props: DimensionSwitcherItemProps,
		environment: Environment
	): React.ReactNode {
		return (
			<>
				{Parser.generateWrappedNode(
					props.labelName,
					fieldName => (
						<Field name={fieldName} />
					),
					environment
				)}
				{Parser.generateWrappedNode(
					props.valueName,
					fieldName => (
						<Field name={fieldName} />
					),
					environment
				)}
			</>
		)
	}
}
