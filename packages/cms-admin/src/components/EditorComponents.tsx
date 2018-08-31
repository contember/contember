import * as React from 'react'
import classNames from 'classnames'

export function Menu({ ...rest }: any) {
	return <div className="editor-menu" {...rest} />
}

export function Toolbar({ ...rest }: any) {
	return <div className="editor-toolbar" {...rest} />
}

export function Button(props: any) {
	return (
		<span
			className={classNames({
				'editor-button': true,
				'is-active': props.active,
				'is-reversed': props.reversed
			})}
		/>
	)
}

export function Icon({ className, ...rest }: any) {
	return <span className={`material-icons ${className}`} {...rest} />
}

export function Image(props: any) {
	return (
		<img
			className={classNames({
				'editor-image': true,
				'is-selected': props.selected
			})}
		/>
	)
}
