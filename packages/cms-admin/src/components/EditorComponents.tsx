import * as React from 'react'
import styled from 'react-emotion'

export const Button = styled('span')`
	cursor: pointer;
	color: ${(props: any) =>
	props.reversed
		? props.active ? 'white' : '#aaa'
		: props.active ? 'black' : '#ccc'};
`

export const Icon = styled(({ className, ...rest } : any) => {
	return <span className={`material-icons ${className}`} {...rest} />
})`
	font-size: 18px;
	vertical-align: text-bottom;
`

export const Menu = styled('div')`
	& > * {
	display: inline-block;
	}
	& > * + * {
	margin-left: 15px;
	}
`

export const Toolbar = styled(Menu)`
	position: relative;
	padding: 1px 18px 17px;
	margin: 0 -20px;
	border-bottom: 2px solid #eee;
	margin-bottom: 20px;
`

export const Image = styled('img')`
	display: block;
	max-width: 100%;
	max-height: 20em;
	box-shadow: ${(props: any) => (props.selected ? '0 0 0 2px blue;' : 'none')};
`
