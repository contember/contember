import cn from 'classnames'
import { useClassNamePrefix } from '../auxiliary'
import type { Size } from '../types'

export interface ContemberLogoProps {
	logotype?: boolean
	size?: Size | number
}

const logoSizes: { [key in Size]: number } = {
	default: 1,
	large: 2,
	small: 0.75,
}

// TODO: repeated IDS
export const ContemberLogo = ({ logotype, size }: ContemberLogoProps) => {
	const prefix = useClassNamePrefix()

	let fontSize: string | undefined

	switch (typeof size) {
		case 'number':
			fontSize = `${size}em`
			break
		case 'string':
			fontSize = `${logoSizes[size]}em`
	}

	return (
		<span className={cn(`${prefix}contemberLogo`, logotype && 'view-logotype')} style={{ fontSize }}>
			<svg
				className={`${prefix}contemberLogo-image`}
				xmlns="http://www.w3.org/2000/svg"
				xmlnsXlink="http://www.w3.org/1999/xlink"
				viewBox={`0 0 ${logotype ? '1871' : '439'} 414`}
			>
				<defs>
					<path strokeWidth="20" strokeLinecap="round" id="d" d="M10 147v191" />
					<path strokeWidth="20" strokeLinecap="round" id="a" d="M10 147L429 12" />
					<path strokeWidth="20" strokeLinecap="round" id="b" d="M429 12L263 212" />
					<path strokeWidth="20" strokeLinecap="round" id="c" d="M10 147c105 46 252 65 253 65" />
				</defs>
				{logotype && (
					<path
						fill="currentColor"
						d="M1866 51v33c-7-2-17-4-27-3s-17 4-22 9c-7 7-10 17-10 27v76h-35V51h31v20c4-7 9-12 15-16a54 54 0 0 1 48-3M662 136c-5 16-12 30-28 43a87 87 0 0 1-56 17c-28 0-52-11-68-31-15-20-21-43-21-68 0-26 6-49 21-68 17-20 40-30 68-30 21 0 40 4 56 17 17 14 25 30 29 48l-36 5a51 51 0 0 0-8-18c-10-12-23-18-39-18-16-1-32 6-41 18a73 73 0 0 0-13 46c0 17 3 34 13 46 9 13 25 19 41 19s29-6 39-19a56 56 0 0 0 8-15l35 8zm107-45c-6-8-16-11-26-11-11 0-20 3-26 11s-8 19-8 30 2 21 8 29 15 12 26 12c10 0 20-4 26-12s8-18 8-29-2-22-8-30m-80 81a77 77 0 0 1-18-51c0-20 6-38 18-51 13-16 33-24 54-24a70 70 0 0 1 72 75c0 20-6 36-18 51a70 70 0 0 1-54 24c-21 0-41-8-54-24m277-49v69h-36v-67c0-15-2-29-9-37-5-6-13-9-23-8-6 0-12 2-17 5-5 4-8 10-10 18l-2 27v62h-36V51h32v15a15 15 0 0 0 2-2c9-11 23-16 36-17 17-1 34 2 48 15 15 16 15 40 15 62m68 7c0 11 0 20 3 25 4 6 10 8 15 8 7 1 16 0 23-1v30c-11 3-31 3-41 1-13-3-21-7-29-18-8-12-6-26-6-43V79h-25V51h25V12h35v39h41v28h-41v52zm93-41c-4 4-6 9-7 14h63c0-5-2-11-6-15-5-7-15-11-25-11-9 0-18 3-25 12m-1 61c6 8 16 12 26 12a31 31 0 0 0 30-17l35 10a66 66 0 0 1-24 29 73 73 0 0 1-38 12c-22 0-44-8-57-24a77 77 0 0 1-17-49c0-21 6-40 17-53 13-16 33-24 54-24s38 7 51 23c14 16 18 37 16 62h-100c1 7 3 14 7 19m316-45v87h-37v-84c0-10-1-16-6-22-5-5-12-8-18-8s-14 3-19 8c-5 7-6 13-6 20v86h-36v-84c0-10-2-16-7-22-5-5-11-8-18-8s-14 3-18 8c-6 7-7 13-7 20v86h-36V51h32v15c10-11 25-18 41-18 11 0 26 3 35 13l7 8c10-13 26-21 43-21 12 0 27 3 36 13 12 13 14 27 14 45m124 16c0-12-3-23-8-30-6-10-15-13-27-13-10 0-18 3-24 10-7 8-10 20-10 33s3 25 10 33c6 7 15 10 25 10s20-3 26-13c5-7 8-18 8-30m37 0c0 19-4 37-16 52a63 63 0 0 1-49 23c-16 0-30-5-41-13v9h-31V4h36v53a67 67 0 0 1 34-10c20 0 39 8 51 23 11 14 16 32 16 52m57-32c-4 4-5 9-7 14h64c-1-5-3-11-6-15-6-7-15-11-25-11-9 0-19 3-26 12m0 61c6 8 15 12 26 12a31 31 0 0 0 29-17l36 10a66 66 0 0 1-25 29 73 73 0 0 1-38 12c-22 0-44-8-56-24a77 77 0 0 1-18-49c0-21 6-40 18-53 13-16 33-24 54-24s37 7 50 23c15 16 18 37 16 62h-99c1 7 3 14 7 19"
					/>
				)}
				<use xlinkHref="#a" stroke="#7ed321" transform="translate(0 191)" />
				<use xlinkHref="#b" stroke="#0094ff" transform="translate(0 191)" />
				<use xlinkHref="#c" stroke="red" transform="translate(0 191)" />
				<use xlinkHref="#d" stroke="#7ed321" transform="translate(419 -135)" />
				<use xlinkHref="#d" stroke="#ff00b8" />
				<use xlinkHref="#d" stroke="#9013fe" transform="translate(253 65)" />
				<use xlinkHref="#a" stroke="#0094ff" />
				<use xlinkHref="#b" stroke="#ff00b8" />
				<use xlinkHref="#c" stroke="red" />
			</svg>
		</span>
	)
}
ContemberLogo.displayName = 'ContemberLogo'
