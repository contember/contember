import { NestedClassName, colorSchemeClassName, filterThemedClassName } from '@contember/utilities'
import { useColorScheme } from './contexts'
import { useClassName } from './useClassName'

/**
 * Hook for component class name accepting outer class name with theme-* and scheme-* class manes
 *
 * It looks for theme CSS classes in the given class name, deduplicates them and returns final theme class name with scheme CSS class set
 * @internal
 *
 * @param componentClassName - Component class name
 * @param additionalClassName - Additional class name
 * @param prefixOverride - Context component prefix override
 * @returns string
 * @see useColorScheme
 *
 * @example
 * ```tsx
 * function Button({ className }: { className?: string | string[] }) {
 * 	 const [contentThemeClassName, controlsThemeClassName] = useThemedClassName(className)
 *
 * 	 return (
 * 		 <div className={contentThemeClassName}>
 * 			 <button className={controlsThemeClassName}>Click me</button>
 * 		 </div>
 * 	 )
 * }
 *
 * function App() {
 * 	 return (
 * 		 <Button className="theme-default theme-danger:hover" />
 * 	 )
 * }
 *
 * // renders:
 * // <div class="scheme-system theme-default-content theme-danger-content:hover">
 * // 	<button class="scheme-system theme-default-controls theme-danger-controls:hover">Click me</button>
 * // </div>
 * ```
 */
export function useThemedClassName(
	componentClassName: NestedClassName,
	additionalClassName: NestedClassName,
	prefixOverride?: string | null | undefined,
): string {
	return useClassName(
		componentClassName,
		filterThemedClassName(
			additionalClassName,
			colorSchemeClassName(useColorScheme()),
		),
		prefixOverride,
	)
}
