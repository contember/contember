import * as React from 'react'
import { Link } from '../index'
import LinkComponent from '../Link/LinkComponent'
import getAlertLink, { AlertLinkProps } from './AlertLink'

interface LinkWithAlertProps extends AlertLinkProps, Pick<LinkComponent.OwnProps, 'requestChange'> {}

export default class LinkWithAlert extends React.PureComponent<LinkWithAlertProps> {
	public render() {
		return <Link requestChange={this.props.requestChange} Component={getAlertLink(this.props)} />
	}
}
