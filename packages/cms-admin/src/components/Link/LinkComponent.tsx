import * as React from 'react'
import { RequestChange } from '../../state/request'

class LinkComponent extends React.PureComponent<LinkComponent.Props, LinkComponent.State> {
	onClick = (e?: React.SyntheticEvent<Element>) => {
		e && e.preventDefault()
		this.props.goTo()
	}

	defaultComponent: React.FunctionComponent<InnerProps> = () => {
		const { url, Component, requestChange, goTo, dispatch, ...props } = this.props
		return (
			<a href={url} onClick={this.onClick} {...props}>
				{this.props.children}
			</a>
		)
	}

	render() {
		const Component = this.props.Component || this.defaultComponent
		return <Component href={this.props.url} onClick={this.onClick} />
	}
}

export interface InnerProps {
	href: string
	onClick: (e?: React.SyntheticEvent<Element>) => void
}

namespace LinkComponent {
	export interface OwnProps {
		requestChange: RequestChange
		Component?: React.ComponentType<InnerProps>
	}

	export interface DispatchProps {
		goTo: () => void
	}

	export interface StateProps {
		url: string
	}

	export type Props = StateProps &
		DispatchProps &
		OwnProps &
		Omit<React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>, 'href'> &
		{
			dispatch?: any
		} // Dispatch shouldn't be here

	export interface State {}
}

export default LinkComponent
