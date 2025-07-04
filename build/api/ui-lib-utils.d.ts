import { ClassValue } from 'clsx';
import { ComponentProps } from 'react';
import { ComponentType } from 'react';
import { ElementRef } from 'react';
import { ForwardRefExoticComponent } from 'react';
import { PropsWithoutRef } from 'react';
import { ReactNode } from 'react';
import { RefAttributes } from 'react';

/**
 * `cn` is a utility function that combines Tailwind CSS class names using `clsx`
 * and merges conflicting classes with `twMerge`.
 *
 * Useful for composing conditional and dynamic className values in React components
 * with Tailwind, ensuring the final output avoids duplicates or conflicts.
 *
 * #### Example: Conditional class merging
 * ```tsx
 * const Button = ({ isPrimary }: { isPrimary?: boolean }) => {
 *   return (
 *     <button className={cn('px-4 py-2', isPrimary && 'bg-blue-500', 'text-white')}>
 *       Click me
 *     </button>
 *   )
 * }
 * ```
 */
export declare const cn: (...inputs: ClassValue[]) => string;

declare type Config<T extends ConfigSchema | undefined, El extends React.ElementType> = {
    baseClass?: ClassValue;
    variants?: T;
    passVariantProps?: string[];
    defaultProps?: Partial<React.ComponentProps<El> & {
        [K in `data-${string}`]?: DataAttrValue;
    }>;
    defaultVariants?: ConfigVariants<T>;
    compoundVariants?: ((ConfigVariants<T> | ConfigVariantsMulti<T>) & {
        className?: string;
    })[];
    variantsAsDataAttrs?: (keyof ConfigVariants<T>)[];
    displayName?: string;
    wrapOuter?: ComponentType<{
        children?: ReactNode;
    } & ConfigVariants<T>>;
    wrapInner?: ComponentType<{
        children?: ReactNode;
    } & ConfigVariants<T>>;
    beforeChildren?: ReactNode;
    afterChildren?: ReactNode;
    style?: React.CSSProperties;
};

declare type ConfigSchema = Record<string, Record<string, ClassValue>>;

export declare type ConfigVariants<T extends ConfigSchema | undefined> = T extends ConfigSchema ? {
    [Variant in keyof T]?: StringToBoolean<keyof T[Variant]> | null | undefined;
} : {};

declare type ConfigVariantsMulti<T extends ConfigSchema | undefined> = T extends ConfigSchema ? {
    [Variant in keyof T]?: StringToBoolean<keyof T[Variant]> | StringToBoolean<keyof T[Variant]>[] | undefined;
} : {};

declare type DataAttrValue = boolean | string | number | undefined | null;

declare type NoInfer_2<T> = T & {
    [K in keyof T]: T[K];
};
export { NoInfer_2 as NoInfer }

declare type StringToBoolean<T> = T extends 'true' | 'false' ? boolean : T;

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
export declare const uic: <El extends React.ElementType, Variants extends ConfigSchema | undefined = undefined>(Component: El, config: Config<Variants, NoInfer_2<El>>) => ForwardRefExoticComponent<PropsWithoutRef<ComponentProps<El> & {
asChild?: boolean;
children?: ReactNode;
className?: string;
} & ConfigVariants<Variants>> & RefAttributes<ElementRef<El>>>;

export declare const uiconfig: <T extends ConfigSchema | undefined>(config: Config<T, ComponentType<{}>>) => Config<T, ComponentType<{}>>;

export { }
