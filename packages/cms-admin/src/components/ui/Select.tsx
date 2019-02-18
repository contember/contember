import * as React from 'react'

class Select extends React.PureComponent<Select.Props> {
	render() {
		return (
			<div className="select-wrap">
				<select onChange={this.props.onChange} className="select">
					{this.props.options.map(option => (
						<option value={option.value} disabled={option.disabled} selected={this.props.value === option.value}>
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
		value: string | number
		onChange?: React.ChangeEventHandler<HTMLSelectElement>
		options: Option[]
	}
}

export { Select }
