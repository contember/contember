import * as React from 'react'
import Plain from 'slate-plain-serializer'
import { Editor } from 'slate-react'

/**
 * The plain text example.
 */
export default class PlainTextEditor extends React.Component {
	/**
	 * Deserialize the initial editor value.
	 */
	state = {
		value: Plain.deserialize('')
	}

	/**
	 * Render the editor.
	 */
	render() {
		return <Editor placeholder="Enter some plain text..." value={this.state.value} onChange={this.onChange} />
	}

	/**
	 * On change.
	 */
	onChange = ({ value }: any) => {
		this.setState({ value })
	}
}
