export function dataAttribute(value: unknown): string | true | undefined {
	if (value === false) {
		return undefined
	} else if (value === true) {
		// Closest to HTML: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#boolean-attributes
		// React issue: https://github.com/facebook/react/issues/24812
		return ''
	} else {
		return String(value)
	}
}
