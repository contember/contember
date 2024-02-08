export const formatDate = (date: string | null) => {
	if (date === null) {
		return null
	}
	const d = new Date(date)
	return d.toLocaleDateString()
}

export const formatDateTime = (date: string | null) => {
	if (date === null) {
		return null
	}
	const d = new Date(date)
	return d.toLocaleString()
}

export const formatBoolean = (value: boolean | null) => {
	if (value === null) {
		return null
	}
	return value ? 'Yes' : 'No'
}

export const createEnumFormatter = (enumValues: Record<string, string>) => (value: string | null) => {
	if (value === null) {
		return null
	}
	return enumValues[value]
}

export const withFallback = <T>(formatter: (value: T) => string, fallback: string) => (value: T | null) => {
	if (value === null) {
		return fallback
	}
	return formatter(value)
}

export const formatNumber = (value: number | null) => {
	if (value === null) {
		return null
	}
	return value.toLocaleString()
}
