import { BindingError, Component, SugaredRelativeSingleField } from '@contember/binding'
import { FormGroup, FormGroupProps, Select, SelectOption } from '@contember/ui'
import * as React from 'react'
import { NormalizedStaticOption, SelectFieldInnerProps, StaticChoiceField, useStaticChoiceField } from '../fields'
import { useNormalizedBlocks } from './useNormalizedBlocks'

export interface DiscriminatedBlocksProps extends Omit<FormGroupProps, 'children'>, SugaredRelativeSingleField {
	children: React.ReactNode
	allowBlockTypeChange?: boolean
}

export const DiscriminatedBlocks = Component<DiscriminatedBlocksProps>(
	props => {
		const normalizedBlocks = useNormalizedBlocks(props.children)
		const blocksArray = React.useMemo(() => Array.from(normalizedBlocks.data.values()), [normalizedBlocks.data])
		const transformedBlockList = React.useMemo<NormalizedStaticOption[]>(
			() =>
				blocksArray.map(item => ({
					...item,
					label: item.data.label,
					value: item.discriminateBy,
				})),
			[blocksArray],
		)
		const metadata = useStaticChoiceField({
			...props,
			options: transformedBlockList,
			arity: 'single',
		})
		return (
			<>
				{props.allowBlockTypeChange !== false && (
					<SelectFieldInner
						label={props.label}
						data={metadata.data}
						currentValue={metadata.currentValue}
						onChange={metadata.onChange}
						environment={metadata.environment}
						errors={metadata.errors}
						placeholder="Choose…"
						isMutating={metadata.isMutating}
					/>
				)}
				{metadata.currentValue in blocksArray && blocksArray[metadata.currentValue].data.children}
			</>
		)
	},
	props => (
		<>
			<StaticChoiceField {...(props as any)} options={[]} arity="single" isNonbearing={true} />
			{props.children}
		</>
	),
	'DiscriminatedBlocks',
)

class SelectFieldInner extends React.PureComponent<SelectFieldInnerProps> {
	public render() {
		const options = Array<SelectOption>({
			disabled: this.props.allowNull !== true,
			value: -1,
			label: this.props.placeholder || (typeof this.props.label === 'string' ? this.props.label : ''),
		}).concat(
			this.props.data.map(({ key, label }) => {
				if (typeof label !== 'string') {
					throw new BindingError(`The labels of <SelectField /> items must be strings!`)
				}
				return {
					disabled: false,
					value: key,
					label: label,
				}
			}),
		)

		return (
			<FormGroup
				{...this.props}
				label={this.props.environment.applySystemMiddleware('labelMiddleware', this.props.label)}
			>
				<Select
					value={this.props.currentValue.toString()}
					onChange={event => {
						this.props.onChange(parseInt(event.currentTarget.value, 10))
					}}
					options={options}
					disabled={this.props.isMutating}
				/>
			</FormGroup>
		)
	}
}
