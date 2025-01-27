import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react'
import { cn, uic } from '../utils'

export const Avatar = uic(AvatarPrimitive.Root, {
	baseClass: 'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
	displayName: AvatarPrimitive.Root.displayName,
})

export const AvatarImage = uic(AvatarPrimitive.Image, {
	baseClass: 'aspect-square h-full w-full',
	displayName: AvatarPrimitive.Image.displayName,
})

const useGenerateAvatarFallbackColor = (name?: string) => {
	if (!name) return 'hsl(0, 80%, 80%)'

	const charCodes = name.split('').map(char => char.charCodeAt(0))
	const sum = charCodes.reduce((acc, code) => acc + code, 0)
	const hue = sum % 360
	return `hsl(${hue}, 80%, 80%)`
}

export const AvatarFallback = forwardRef<
	ElementRef<typeof AvatarPrimitive.Fallback>,
	ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & { avatarFallbackColorString?: string }
>(({ className, avatarFallbackColorString, ...props }, ref) => {
	const backgroundColor = useGenerateAvatarFallbackColor(avatarFallbackColorString)

	return (
		<AvatarPrimitive.Fallback
			ref={ref}
			style={{ backgroundColor }}
			className={cn(
				'flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-bold',
				className,
			)}
			{...props}
		/>
	)
})
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName
