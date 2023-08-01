import { DetailedHTMLProps, HTMLAttributes } from 'react'

export const Block = ({ children, style }: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) => <div style={{
	background: 'rgba(var(--cui-background-color--toned-controls-rgb-50), var(--cui-opacity--low));',
	borderRadius: '0.25em',
	display: 'flex',
	color: 'rgb(var(--cui-color--toned-controls-rgb-50))',
	fontSize: '0.8125em',
	lineHeight: '1em',
	justifyContent: 'space-between',
	padding: '0.5em',
	...style,
}}>
	<span>&lt;ReactNode</span>
	{children}
	<span>/&gt;</span>
</div>
