const UPPER_CASE_REG_EXP = /([A-Z])/g

export function toKebabCase(value: string) {
	return value.replace(UPPER_CASE_REG_EXP, '-$1').toLowerCase()
}
