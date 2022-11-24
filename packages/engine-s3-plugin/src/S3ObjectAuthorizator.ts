import pm from 'picomatch'
import { ForbiddenError } from '@contember/graphql-utils'

export type S3ObjectUploadRule = {
	pattern: string
	maxSize?: number
	matcher?: (subject: string) => boolean
}

export type S3ObjectReadRule = {
	pattern: string
	matcher?: (subject: string) => boolean
}

export class S3ObjectAuthorizator {
	private readonly uploadRules: S3ObjectUploadRule[]
	private readonly readRules: S3ObjectReadRule[]

	constructor(
		uploadRules: Omit<S3ObjectUploadRule, 'matcher'>[],
		readRules: Omit<S3ObjectReadRule, 'matcher'>[],
	) {
		this.uploadRules = uploadRules
		this.readRules = readRules
	}

	public verifyReadAccess({ key }: { key: string }): void {
		for (const rule of this.readRules) {
			rule.matcher ??= pm(rule.pattern)
			if (rule.matcher(key)) {
				return
			}
		}
		throw new ForbiddenError(`Read access forbidden for object key ${key}`)
	}

	public verifyUploadAccess({ key, size }: { key: string; size: number | null }): void {
		const matchedPatterns: S3ObjectUploadRule[] = []
		for (const rule of this.uploadRules) {
			rule.matcher ??= pm(rule.pattern)
			const isMatched = rule.matcher(key)
			if (isMatched) {
				if (!rule.maxSize || (size !== null && size <= rule.maxSize)) {
					return
				}
				matchedPatterns.push(rule)
			}
		}
		if (matchedPatterns.length > 0) {
			if (size === null) {
				throw new ForbiddenError('File size must be provided')
			} else {
				throw new ForbiddenError('Uploaded file is too large')
			}
		}
		throw new ForbiddenError(`Upload access forbidden for object key ${key}`)
	}
}
