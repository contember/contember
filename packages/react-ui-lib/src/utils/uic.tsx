import { ClassValue, clsx } from 'clsx'
import * as React from 'react'
import { ComponentType, ReactElement, ReactNode } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { twMerge } from 'tailwind-merge'

type StringToBoolean<T> = T extends 'true' | 'false' ? boolean : T
type ConfigSchema = Record<string, Record<string, ClassValue>>

export type ConfigVariants<T extends ConfigSchema | undefined> = T extends ConfigSchema ? {
	[Variant in keyof T]?: StringToBoolean<keyof T[Variant]> | null | undefined;
} : {}

type ConfigVariantsMulti<T extends ConfigSchema | undefined> = T extends ConfigSchema ? {
	[Variant in keyof T]?: StringToBoolean<keyof T[Variant]> | StringToBoolean<keyof T[Variant]>[] | undefined;
} : {}

type Config<T extends ConfigSchema | undefined, El extends React.ElementType> = {
	baseClass?: ClassValue
	variants?: T
	passVariantProps?: string[]
	defaultProps?: Partial<React.ComponentProps<El>>
	defaultVariants?: ConfigVariants<T>
	compoundVariants?: ((ConfigVariants<T> | ConfigVariantsMulti<T>) & { className?: string })[]
	displayName?: string
	wrapOuter?: ComponentType<{ children?: ReactNode } & ConfigVariants<T>>
	wrapInner?: ComponentType<{ children?: ReactNode } & ConfigVariants<T>>
	beforeChildren?: ReactElement
	afterChildren?: ReactElement
}

export const uiconfig = <T extends ConfigSchema | undefined>(config: Config<T, ComponentType<{}>>) => config

export type NoInfer<T> = T & { [K in keyof T]: T[K] }

export const uic = <El extends React.ElementType, Variants extends ConfigSchema | undefined  = undefined>(Component: El, config: Config<Variants, NoInfer<El>>) => {
	const cls = cva<any>(config?.baseClass as any, {
		variants: config?.variants,
		defaultVariants: config?.defaultVariants,
		compoundVariants: config?.compoundVariants,
	})

	const component =  React.forwardRef<React.ElementRef<El>, React.ComponentProps<El> & {
		asChild?: boolean
		children?: React.ReactNode
		className?: string
	} & ConfigVariants<Variants>>((props, ref) => {
		const { className: classNameProp, children: childrenBase, ...rest } = props

		for (const key in config?.variants) {
			if (key in rest && !config?.passVariantProps?.includes(key)) {
				delete (rest as any)[key]
			}
		}
		let Comp: React.ElementType = Component
		if (props.asChild && typeof Component === 'string') {
			Comp = Slot
			delete (rest as any).asChild
		}
		let children = childrenBase
		if (config?.wrapInner) {
			children = React.createElement(config.wrapInner, props as any, children)
		}
		if (config?.beforeChildren || config?.afterChildren) {
			children = <>
				{config?.beforeChildren}
				{children}
				{config?.afterChildren}
			</>
		}

		const innerEl = <Comp ref={ref} className={twMerge(clsx(cls(props), classNameProp))} {...(config.defaultProps ?? {})} {...rest}>{children}</Comp>
		return config?.wrapOuter ? React.createElement(config.wrapOuter, props as any, innerEl) : innerEl
	})
	component.displayName = config?.displayName

	return component
}
