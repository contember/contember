import { SchemaColumn } from '@contember/interface'
import { dict } from '../dict'

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
	return value ? dict.boolean.true : dict.boolean.false
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

export const formatBytes = (bytes: number, decimals = 1) => {
	if (bytes === 0) return '0 Bytes'
	const k = 1024
	const dm = decimals + 1 || 3
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export const formatDuration = (duration: number) => {
	const minutes = Math.floor(duration / 60)
	const seconds = duration % 60
	return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export const formatJson = (value: any) => {
	return JSON.stringify(value, null, 2)
}

export const getFormatter = (schema: SchemaColumn) => {
	switch (schema.type) {
		case 'Date':
			return formatDate
		case 'DateTime':
			return formatDateTime
		case 'Bool':
			return formatBoolean
		case 'Integer':
		case 'Float':
			return formatNumber
		case 'Json':
			return formatJson
		default:
			return (value: any) => value
	}
}
