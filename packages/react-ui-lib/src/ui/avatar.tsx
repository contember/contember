import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react'
import { cn } from '../utils'

const Avatar = forwardRef<
	ElementRef<typeof AvatarPrimitive.Root>,
	ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
	<AvatarPrimitive.Root
		ref={ref}
		className={cn(
			'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
			className,
		)}
		{...props}
	/>
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = forwardRef<
	ElementRef<typeof AvatarPrimitive.Image>,
	ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
	<AvatarPrimitive.Image
		ref={ref}
		className={cn('aspect-square h-full w-full', className)}
		{...props}
	/>
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const useGenerateAvatarFallbackColor = (name?: string) => {
	if (!name) return 'hsl(0, 80%, 80%)'

	const charCodes = name.split('').map(char => char.charCodeAt(0))
	const sum = charCodes.reduce((acc, code) => acc + code, 0)
	const hue = sum % 360
	return `hsl(${hue}, 80%, 80%)`
}

const AvatarFallback = forwardRef<
	ElementRef<typeof AvatarPrimitive.Fallback>,
	ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & { avatarFallbackColorString?: string }
>(({ className, avatarFallbackColorString, ...props }, ref) => {
	const backgroundColor = useGenerateAvatarFallbackColor(avatarFallbackColorString)

	return (
		<AvatarPrimitive.Fallback
			ref={ref}
			style={{ backgroundColor }}
			className={cn(
				'flex h-full w-full items-center justify-center rounded-full bg-muted',
				className,
			)}
			{...props}
		/>
	)
})
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
