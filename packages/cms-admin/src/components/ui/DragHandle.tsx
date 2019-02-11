import * as React from 'react'

export interface DragHandleProps {
	className?: string
}

export const DragHandle = (props: DragHandleProps) => {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="10" height="24" viewBox="0 0 10 24" className={props.className}>
			<g transform="translate(-310 -236)">
				<path
					d="M310 237.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm7 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm-7 7a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm7 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm-7 7a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm7 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm-7 7a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm7 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0z"
					fill="currentColor"
				/>
			</g>
		</svg>
	)
}
