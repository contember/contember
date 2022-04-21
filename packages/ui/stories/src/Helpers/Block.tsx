import { DetailedHTMLProps, HTMLAttributes } from 'react'

export const Block = ({ style }: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) => <div style={{
	background: 'var(--cui-toned-control-background-color)',
	borderRadius: '0.25em',
	display: 'flex',
	color: 'var(--cui-toned-color)',
	fontSize: '0.8125em',
	flexBasis: 0,
	flexGrow: 1,
	flexShrink: 1,
	lineHeight: '1em',
	justifyContent: 'space-between',
	padding: '0.5em',
	...style,
}}>
	<span>&lt;ReactNode</span>
	<span>/&gt;</span>
</div>
