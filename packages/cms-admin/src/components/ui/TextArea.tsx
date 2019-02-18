import * as React from 'react'
import cn from 'classnames'

export interface TextAreaProps {
	large?: boolean
}

export class TextArea extends React.PureComponent<TextAreaProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>> {
	public render() {
		const { large, children, ...rest } = this.props

		return (
			<div className={cn('inputGroup', large && 'view-large')}>
				<textarea className="inputGroup-text" {...rest} />
			</div>
		)
	}
}
