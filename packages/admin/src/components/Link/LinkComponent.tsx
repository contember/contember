import { isSpecialLinkClick } from '@contember/ui'
import {
	AnchorHTMLAttributes,
	ComponentType,
	FunctionComponent,
	MouseEvent as ReactMouseEvent,
	PureComponent,
	ReactNode,
} from 'react'
import { RequestChange } from '../../state/request'

class LinkComponent extends PureComponent<LinkComponent.Props> {
	onClick = (e?: ReactMouseEvent<HTMLAnchorElement, MouseEvent>) => {
		if (e) {
			if (this.props.onClick) {
				this.props.onClick(e)
			}
			if (e.isDefaultPrevented() || isSpecialLinkClick(e.nativeEvent)) {
				return
			}
			e.preventDefault()
		}
		this.props.goTo()
	}

	defaultComponent: FunctionComponent<InnerProps> = ({ href, onClick, isActive, ...props }) => (
		// TODO do something with isActive?
		<a href={href} onClick={onClick} {...props}>
			{this.props.children}
		</a>
	)

	render() {
		const { Component = this.defaultComponent, requestChange, goTo, dispatch, ...innerProps } = this.props
		return <Component isActive={location.pathname === this.props.href} {...innerProps} onClick={this.onClick} />
	}
}

export type PublicAnchorProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>

export interface InnerProps extends PublicAnchorProps {
	href: string
	isActive: boolean
}

namespace LinkComponent {
	export interface OwnProps {
		requestChange: RequestChange
		Component?: ComponentType<InnerProps>
		children?: ReactNode
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
			dispatch?: any // TODO: For some reason, Redux sends a dispatch prop, no idea why.
		}
}

export { LinkComponent }
