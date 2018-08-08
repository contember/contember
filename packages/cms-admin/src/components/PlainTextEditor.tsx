import * as React from 'react'
import Plain from 'slate-plain-serializer'
import { Editor } from 'slate-react'

/**
 * The plain text example.
 *
 * @type {Component}
 */

export default class PlainTextEditor extends React.Component {
	/**
	 * Deserialize the initial editor value.
	 *
	 * @type {Object}
	 */

	state = {
		value: Plain.deserialize(''),
	}

	/**
	 * Render the editor.
	 *
	 * @return {Component} component
	 */

	render() {
		return (
			<Editor
				placeholder="Enter some plain text..."
				value={this.state.value}
				onChange={this.onChange}
			/>
		)
	}

	/**
	 * On change.
	 *
	 * @param {Change} change
	 */

	onChange = ({ value }) => {
		this.setState({ value })
	}
}


