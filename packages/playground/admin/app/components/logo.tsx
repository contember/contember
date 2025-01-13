import { memo } from 'react'

const LogoIcon = () => {
	return (
		<svg className={'w-full'} width="45" height="46" viewBox="0 0 66 66" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
			<path d="M59.829 36.9343L54.9863 32.9984L48.7821 38.106C44.0053 42.0419 39.7007 46.5693 35.9672 51.5745L32.3105 56.4887L28.5111 51.4721C24.4152 46.0574 19.7043 41.1774 14.4773 36.9343L9.6347 32.9984L12.5117 30.6665C19.0454 25.3655 24.9313 19.2683 30.0484 12.4999L32.2995 9.51957L34.0455 11.8174C39.5031 19.0294 45.7842 25.5362 52.7572 31.2011L54.9754 33.0098L57.8524 30.6779C59.6752 29.199 61.4542 27.6406 63.1782 26.0367C60.0925 11.2941 47.4533 0.259979 32.3105 0.259979C14.8617 0.259979 0.130859 14.9229 0.130859 32.9984C0.130859 51.074 14.8617 65.7369 32.3105 65.7369C47.4973 65.7369 60.1804 54.6345 63.2111 39.8464C62.102 38.8454 60.982 37.8671 59.818 36.9343H59.829Z" />
		</svg>
	)
}

export const Logo = () => (
	<>
		<div className="flex aspect-square size-8 items-center justify-center lg:pr-2">
			<LogoIcon />
		</div>
		<div className="grid flex-1 text-left text-2xl leading-tight">
			<span className="truncate font-semibold">Contember</span>
		</div>
	</>
)
