import * as React from 'react'

class Select extends React.PureComponent<Select.Props> {
	render() {
		return (
			<div className="select-wrap">
				<select
					disabled={this.props.disabled === true}
					onChange={this.props.onChange}
					value={this.props.value}
					className="select"
					multiple={this.props.multiple}
				>
					{this.props.options.map(option => (
						<option value={option.value} disabled={option.disabled} key={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</div>
		)
	}
}

namespace Select {
	export interface Option {
		value: string | number
		label: string
		disabled?: boolean
	}

	export interface Props {
		value: string | number | string[]
		onChange?: React.ChangeEventHandler<HTMLSelectElement>
		options: Option[]
		disabled?: boolean
		multiple?: boolean
	}
}

export { Select }
