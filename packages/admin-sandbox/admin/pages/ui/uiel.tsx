import { ClassValue, clsx } from 'clsx'
import { StringToBoolean } from 'class-variance-authority/dist/types'
import * as React from 'react'
import { ComponentType, ReactElement, ReactNode } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { twMerge } from 'tailwind-merge'

type ConfigSchema = Record<string, Record<string, ClassValue>>;

type ConfigVariants<T extends ConfigSchema | undefined> = T extends ConfigSchema ? {
	[Variant in keyof T]?: StringToBoolean<keyof T[Variant]> | null | undefined;
} : {}

type ConfigVariantsMulti<T extends ConfigSchema | undefined> = T extends ConfigSchema ? {
	[Variant in keyof T]?: StringToBoolean<keyof T[Variant]> | StringToBoolean<keyof T[Variant]>[] | undefined;
} : {}

type Config<T extends ConfigSchema | undefined> = {
	baseClass?: ClassValue
	variants?: T;
	passVariantProps?: string[]
	defaultVariants?: ConfigVariants<T>;
	compoundVariants?: ((ConfigVariants<T> | ConfigVariantsMulti<T>) & {className?: string})[];
	displayName?: string;
	wrapOuter?: ComponentType<{ children?: ReactNode } & ConfigVariants<T>>
	wrapInner?: ComponentType<{ children?: ReactNode } & ConfigVariants<T>>
	beforeChildren?: ReactElement
	afterChildren?: ReactElement
}

export const UIC = <El extends React.ElementType, Variants extends ConfigSchema | undefined  = undefined>(Component: El, config: Config<Variants>) => {
	const cls = cva<any>(config?.baseClass, {
		variants: config?.variants,
		defaultVariants: config?.defaultVariants,
		compoundVariants: config?.compoundVariants,
	})

	const component =  React.forwardRef<any, React.ComponentProps<El> & {
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
			children = React.createElement(config.wrapInner, props, children)
		}
		if (config?.beforeChildren || config?.afterChildren) {
			children = <>
				{config?.beforeChildren}
				{children}
				{config?.afterChildren}
			</>
		}

		const innerEl = <Comp ref={ref} className={twMerge(clsx(cls(props), classNameProp))} {...rest}>{children}</Comp>
		return config?.wrapOuter ? React.createElement(config.wrapOuter, props, innerEl) : innerEl
	})
	component.displayName = config?.displayName

	return component
}
