import { Slot } from '@radix-ui/react-slot'
import * as React from 'react'
import { ComponentPropsWithoutRef, createContext, forwardRef, useContext } from 'react'
import { uic } from '../utils/index.js'

const DEFAULT_MAX = 100

type ProgressState = 'indeterminate' | 'complete' | 'loading'

const ProgressContext = createContext<{ value: number | null; max: number }>({ value: null, max: DEFAULT_MAX })

const getProgressState = (value: number | null, max: number): ProgressState =>
	value === null ? 'indeterminate' : value === max ? 'complete' : 'loading'

const isValidMax = (max: number | undefined): max is number => typeof max === 'number' && !Number.isNaN(max) && max > 0

const isValidValue = (value: number | null, max: number): value is number =>
	typeof value === 'number' && !Number.isNaN(value) && value <= max && value >= 0

const defaultGetValueLabel = (value: number, max: number) => `${Math.round((value / max) * 100)}%`

export type ProgressRootProps = ComponentPropsWithoutRef<'div'> & {
	/** `null` or `undefined` means indeterminate. */
	value?: number | null
	max?: number
	getValueLabel?: (value: number, max: number) => string
	asChild?: boolean
}

const ProgressRootBase = forwardRef<HTMLDivElement, ProgressRootProps>(
	({ asChild, value: valueProp = null, max: maxProp, getValueLabel = defaultGetValueLabel, ...props }, ref) => {
		const Comp = asChild ? Slot : 'div'
		if ((maxProp || maxProp === 0) && !isValidMax(maxProp)) {
			console.error(
				`Invalid prop \`max\` of value \`${maxProp}\` supplied to \`Progress\`. Only numbers greater than 0 are valid. Defaulting to \`${DEFAULT_MAX}\`.`,
			)
		}
		const max = isValidMax(maxProp) ? maxProp : DEFAULT_MAX
		if (valueProp !== null && !isValidValue(valueProp, max)) {
			console.error(
				`Invalid prop \`value\` of value \`${valueProp}\` supplied to \`Progress\`. It must be between 0 and \`max\` (${max}), or null. Defaulting to \`null\`.`,
			)
		}
		const value = isValidValue(valueProp, max) ? valueProp : null
		return (
			<ProgressContext.Provider value={{ value, max }}>
				<Comp
					aria-valuemax={max}
					aria-valuemin={0}
					aria-valuenow={value ?? undefined}
					aria-valuetext={value !== null ? getValueLabel(value, max) : undefined}
					role="progressbar"
					data-state={getProgressState(value, max)}
					data-value={value ?? undefined}
					data-max={max}
					{...props}
					ref={ref}
				/>
			</ProgressContext.Provider>
		)
	},
)
ProgressRootBase.displayName = 'Progress'

const ProgressIndicatorBase = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<'div'> & { asChild?: boolean }>(({ asChild, ...props }, ref) => {
	const Comp = asChild ? Slot : 'div'
	const { value, max } = useContext(ProgressContext)
	return <Comp data-state={getProgressState(value, max)} data-value={value ?? undefined} data-max={max} {...props} ref={ref} />
})
ProgressIndicatorBase.displayName = 'ProgressIndicator'

const ProgressRoot = uic(ProgressRootBase, {
	baseClass: 'relative h-1.5 w-full overflow-hidden rounded-full bg-primary/20',
	displayName: 'Progress',
})

const ProgressIndicator = uic(ProgressIndicatorBase, {
	baseClass: 'h-full w-full flex-1 transition-all bg-gradient-to-b from-blue-500 to-blue-400',
	displayName: 'ProgressIndicator',
})

export const Progress = React.forwardRef<HTMLDivElement, ProgressRootProps>(({ className, value, ...props }, ref) => (
	<ProgressRoot ref={ref} {...props}>
		<ProgressIndicator style={{ transform: `translateX(-${100 - (value || 0)}%)` }} />
	</ProgressRoot>
))
Progress.displayName = 'Progress'
