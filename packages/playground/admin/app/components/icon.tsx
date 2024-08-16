import { svgSizeProps } from '@contember/utilities'

export const Logo = () => {
	return (
		<svg
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			{...svgSizeProps(70, 70, 10)}
		>
			<path d="m23.4358 47.8008-3.8475-21.9811 30.6362-6.5978-5.0683 32.3127z" stroke={'currentColor'} strokeWidth={6} />
		</svg>
	)
}
