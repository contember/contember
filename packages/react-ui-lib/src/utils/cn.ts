import { ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(...inputs))
