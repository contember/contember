import * as React from 'react'
import { RequestChange } from '../../state/request'

class LinkComponent extends React.PureComponent<LinkComponent.Props> {
	onClick = (e?: React.SyntheticEvent<Element>) => {
		if (
			e &&
			e.nativeEvent instanceof MouseEvent &&
			(e.nativeEvent.altKey || e.nativeEvent.ctrlKey || e.nativeEvent.metaKey || e.nativeEvent.shiftKey) // @TODO: use isSpecialLinkClick.ts
		) {
			return
		}
		e && e.preventDefault()
		this.props.goTo()
	}

	defaultComponent: React.FunctionComponent<InnerProps> = ({ href, onClick, isActive, ...props }) => (
		// TODO do something with isActive?
		<a href={href} onClick={onClick} {...props}>
			{this.props.children}
		</a>
	)

	render() {
		const { Component = this.defaultComponent, requestChange, goTo, dispatch, ...innerProps } = this.props
		return <Component onClick={this.onClick} isActive={location.pathname === this.props.href} {...innerProps} />
	}
}

export type PublicAnchorProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'>

export interface InnerProps extends PublicAnchorProps {
	href: string
	onClick: (e?: React.SyntheticEvent<Element>) => void
	isActive: boolean
}

namespace LinkComponent {
	export interface OwnProps {
		requestChange: RequestChange
		Component?: React.ComponentType<InnerProps>
		children?: React.ReactNode
	}

	export interface DispatchProps {
		goTo: () => void
	}

	export interface StateProps {
		href: string
	}

	export type Props = StateProps &
		DispatchProps &
		OwnProps &
		PublicAnchorProps & {
			dispatch?: any // TODO: For some reason, Redux sends a dispatch prop, no ide why.
		}
}

export default LinkComponent
