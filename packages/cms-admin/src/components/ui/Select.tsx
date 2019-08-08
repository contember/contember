import * as React from 'react'
import ReactDOMServer from 'react-dom/server'

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
					{/*
						This is a super ugly workaround to React's unfortunate limitation that all <option> contents must be just
						strings, otherwise it will just call .toString() which, in our case, would result into '[object Object]'.

						We, however, need to support JSX in order to allow for custom field formatting, and the like. It does,
						of course, depend on people only attempting to render components that render just text but that is fine.

						Relevant issue: https://github.com/facebook/react/issues/13586
					*/}
					{this.props.options.map(option => {
						const optionProps: React.DetailedHTMLProps<
							React.OptionHTMLAttributes<HTMLOptionElement>,
							HTMLOptionElement
						> = {
							value: option.value,
							disabled: option.disabled,
							key: option.value,
						}
						if (typeof option.label === 'object' && option.label !== null) {
							optionProps.dangerouslySetInnerHTML = {
								__html: ReactDOMServer.renderToStaticMarkup(option.label as React.ReactElement),
							}
						} else {
							optionProps.children = option.label
						}
						return <option {...optionProps} />
					})}
				</select>
			</div>
		)
	}
}

namespace Select {
	export interface Option {
		value: string | number
		label: React.ReactNode
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
