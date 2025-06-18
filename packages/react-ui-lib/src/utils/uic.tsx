import { dataAttribute } from '@contember/utilities'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { ClassValue, clsx } from 'clsx'
import { ComponentType, createElement, forwardRef, ReactNode, useMemo } from 'react'
import { twMerge } from 'tailwind-merge'
import { useObjectMemo } from '@contember/react-utils'

type StringToBoolean<T> = T extends 'true' | 'false' ? boolean : T
type ConfigSchema = Record<string, Record<string, ClassValue>>

export type ConfigVariants<T extends ConfigSchema | undefined> = T extends ConfigSchema ? {
	[Variant in keyof T]?: StringToBoolean<keyof T[Variant]> | null | undefined;
} : {}

type ConfigVariantsMulti<T extends ConfigSchema | undefined> = T extends ConfigSchema ? {
	[Variant in keyof T]?: StringToBoolean<keyof T[Variant]> | StringToBoolean<keyof T[Variant]>[] | undefined;
} : {}

type DataAttr<T extends ConfigSchema | undefined> = T extends ConfigSchema ? `data-${keyof T & string}` : never
type DataAttrValue = boolean | string | number | undefined | null

type Config<T extends ConfigSchema | undefined, El extends React.ElementType> = {
	baseClass?: ClassValue
	variants?: T
	passVariantProps?: string[]
	defaultProps?: Partial<React.ComponentProps<El> & {
		[K in `data-${string}`]?: DataAttrValue
	}>
	defaultVariants?: ConfigVariants<T>
	compoundVariants?: ((ConfigVariants<T> | ConfigVariantsMulti<T>) & { className?: string })[]
	variantsAsDataAttrs?: (keyof ConfigVariants<T>)[]
	displayName?: string
	wrapOuter?: ComponentType<{ children?: ReactNode } & ConfigVariants<T>>
	wrapInner?: ComponentType<{ children?: ReactNode } & ConfigVariants<T>>
	beforeChildren?: ReactNode
	afterChildren?: ReactNode
	style?: React.CSSProperties
}

export const uiconfig = <T extends ConfigSchema | undefined>(config: Config<T, ComponentType<{}>>) => config

export type NoInfer<T> = T & { [K in keyof T]: T[K] }

/**
 * Props are inferred from the base element and the provided config.
 *
 * `uic` is a utility function that enhances a base React component with configurable
 * styling and structural behaviors using a utility-based class variance system (e.g., `cva`).
 *
 * It wraps the base component and provides features including:
 * - Variant-based styling using `cva` configuration
 * - Optional mapping of variant values to `data-*` attributes
 * - Conditional rendering via `asChild` to support component composition
 * - Structural wrapping of children (`wrapInner`) and of the whole component (`wrapOuter`)
 * - Automatic filtering of unused variant props unless passed in `passVariantProps`
 *
 * The `wrapInner` and `wrapOuter` props in the config allow injecting extra layout structure:
 * - `wrapInner`: Wraps the component's children in a custom element (e.g., for padding or effects)
 * - `wrapOuter`: Wraps the entire rendered component (e.g., for layout constraints or portals)
 *
 * Must be used with a `Config` object that defines styling, variant options, and optional wrappers.
 *
 * #### Example: Basic usage with variant styling
 * ```tsx
 * const Button = uic('button', {
 *   baseClass: 'px-4 py-2 font-bold',
 *   variants: {
 *     intent: {
 *       primary: 'bg-blue-500 text-white',
 *       secondary: 'bg-gray-500 text-white',
 *     },
 *   },
 *   defaultVariants: { intent: 'primary' },
 *   displayName: 'Button',
 * })
 *
 * <Button intent="secondary">Click me</Button>
 * ```
 *
 * #### Example: Using `wrapInner` and `wrapOuter`
 * ```tsx
 * const Card = uic('div', {
 *   baseClass: 'bg-white shadow-md rounded',
 *   wrapInner: 'section',
 *   wrapOuter: ({ children }) => <div className="p-4 border">{children}</div>,
 *   displayName: 'Card',
 * })
 *
 * <Card>
 *   <p>Hello world</p>
 * </Card>
 *
 * // Results in:
 * // <div class="p-4 border">
 * //   <div class="bg-white shadow-md rounded">
 * //     <section>
 * //       <p>Hello world</p>
 * //     </section>
 * //   </div>
 * // </div>
 * ```
 */
export const uic = <El extends React.ElementType, Variants extends ConfigSchema | undefined = undefined>(Component: El, config: Config<Variants, NoInfer<El>>) => {
	const cls = cva<any>(config?.baseClass as any, {
		variants: config?.variants,
		defaultVariants: config?.defaultVariants,
		compoundVariants: config?.compoundVariants,
	})
	const passVariantProps = config?.passVariantProps ? new Set(config.passVariantProps) : undefined

	const component = forwardRef<React.ElementRef<El>, React.ComponentProps<El> & {
		asChild?: boolean
		children?: ReactNode
		className?: string
	} & ConfigVariants<Variants>>((props, ref) => {
		const { className: classNameProp, children: childrenBase, ...rest } = props

		const variants: Record<string, string> = {}

		for (const key in config?.variants) {
			variants[key] = (rest as any)[key]
			if (key in rest && !passVariantProps?.has(key)) {
				delete (rest as any)[key]
			}
		}

		const variantsMemoized = useObjectMemo(variants)

		const dataAttrs: Partial<Record<DataAttr<Variants>, DataAttrValue>> = {}
		if (config?.variantsAsDataAttrs && config.variants) {
			for (const key of config.variantsAsDataAttrs) {
				const keyAsString = key.toString()
				const variantValue = rest[key as any] ?? (config.defaultVariants?.[key] as string | null | undefined | boolean)

				dataAttrs[`data-${keyAsString}` as DataAttr<Variants>] = dataAttribute(variantValue)
			}
		}
		const style = useMemo(() => config?.style ? { ...config.style, ...(rest.style || {}) } : rest.style, [rest.style])
		const finalClassName = useMemo(() => twMerge(clsx(cls(variantsMemoized), classNameProp)), [variantsMemoized, classNameProp])

		let FinalComponent: React.ElementType = Component
		if (props.asChild && typeof Component === 'string') {
			FinalComponent = Slot
			delete (rest as any).asChild
		}

		let children = childrenBase
		if (config?.wrapInner) {
			children = createElement(config.wrapInner, props as any, children)
		}

		if (config?.beforeChildren || config?.afterChildren) {
			children = [
				config?.beforeChildren,
				children,
				config?.afterChildren,
			]
		}


		const innerEl = (
			<FinalComponent
				ref={ref}
				className={finalClassName}
				{...(config.defaultProps ?? {})}
				{...dataAttrs}
				{...rest}
				style={style}
			>
				{children}
			</FinalComponent>
		)
		return config?.wrapOuter ? createElement(config.wrapOuter, props as any, innerEl) : innerEl
	})
	component.displayName = config?.displayName

	return component
}
