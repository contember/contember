import { DetailedHTMLProps, HTMLAttributes } from 'react'

export const Block = ({ children, style }: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) => <div style={{
	background: 'var(--cui-toned-control-background-color)',
	borderRadius: '0.25em',
	display: 'flex',
	color: 'var(--cui-toned-color)',
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
