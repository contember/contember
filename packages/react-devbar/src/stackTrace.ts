/*
The source map decoding, lookup and path normalization in this file are ported from source-map 0.6.1. (https://github.com/mozilla/source-map)


Copyright (c) 2009-2011, Mozilla Foundation and contributors
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the names of the Mozilla Foundation nor the names of project
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

// Parses browser stack traces and maps their frames to original sources through source maps. Frame parsing and path
// shortening follow stacktracey 2 and the source map lookup follows source-map 0.6 as used by get-source, which this
// replaces, so the dev error overlay shows the same frames.

export interface StackFrameLocation {
	callee: string
	file: string
	line?: number
	column?: number
	index: boolean
	native: boolean
}

export interface ResolvedStackFrame {
	callee: string
	fileShort: string
	line?: number
	thirdParty: boolean
	sourceLines?: string[]
}

const nixSlashes = (path: string): string => path.replace(/\\/g, '/')

const toNumber = (value: string | undefined): number | undefined => parseInt(value || '', 10) || undefined

export const parseStackFrames = (stack: string): StackFrameLocation[] =>
	stack.split('\n').flatMap(rawLine => {
		const line = rawLine.trim()
		let callee: string | undefined
		let location: string[]
		let native = false
		const planA = line.match(/at (.+) \(eval at .+ \((.+)\), .+\)/)
			?? line.match(/at (.+) \((.+)\)/)
			?? (line.slice(0, 3) !== 'at ' ? line.match(/(.*)@(.*)/) : null)
		if (planA) {
			callee = planA[1]
			native = planA[2] === 'native'
			location = (planA[2].match(/(.*):(\d+):(\d+)/) ?? planA[2].match(/(.*):(\d+)/) ?? []).slice(1)
		} else {
			const planB = line.match(/^(at\s+)*(.+):(\d+):(\d+)/)
			if (!planB) {
				return []
			}
			location = planB.slice(2)
		}
		if (callee && !location[0] && callee.split('.')[0] === 'Array') {
			native = true
		}
		return [{
			callee: callee || '',
			file: nixSlashes(location[0] || ''),
			line: toNumber(location[1]),
			column: toNumber(location[2]),
			index: location[0] === window.location.href,
			native,
		}]
	})

const describeFile = (file: string, index: boolean): { fileShort: string; thirdParty: boolean } => {
	const withoutPage = file.replace(window.location.href, '')
	const external = withoutPage.match(/^(http|https):\/\/?([^/]+)\/(.*)/)
	const relative = nixSlashes(external ? external[3] : withoutPage).replace(/^.*:\/\/?\/?/, '')
	const thirdParty = external !== null
		|| relative[0] === '~'
		|| relative[0] === '/'
		|| relative.startsWith('node_modules')
		|| relative.startsWith('webpack/bootstrap')
	return {
		fileShort: relative.replace(/^node_modules\//, '').replace(/^webpack\/bootstrap\//, '').replace(/^__parcel_source_root\//, ''),
		thirdParty: thirdParty && !index,
	}
}

interface SourceFile {
	url: string
	text: string
	lines: string[]
}

const createSourceFile = (url: string, text: string): SourceFile => ({ url, text, lines: text.split('\n') })

// Path handling of get-source: a `..` above the origin drops it, leaving a page-relative path.
const isAbsoluteFilePath = (path: string): boolean => path.startsWith('/') || /^[^/]*:/.test(path)

const concatPath = (base: string, path: string): string => {
	const baseEndsWithSlash = base.endsWith('/')
	const pathStartsWithSlash = path.startsWith('/')
	return base + (baseEndsWithSlash || pathStartsWithSlash ? '' : '/') + (baseEndsWithSlash && pathStartsWithSlash ? path.substring(1) : path)
}

const normalizeFilePath = (path: string): string => {
	const output: string[] = []
	let skip = 0
	for (const part of path.split('/').reverse()) {
		if (part === '.') {
			continue
		}
		if (part === '..') {
			skip++
		} else if (skip === 0) {
			output.push(part)
		} else {
			skip--
		}
	}
	const result = output.reverse().join('/')
	const prefix = result[0] === '/' ? (result[1] === '/' ? window.location.protocol : window.location.origin) : ''
	return prefix + result
}

const resolveFilePath = (path: string): string =>
	isAbsoluteFilePath(path) ? normalizeFilePath(path) : normalizeFilePath(concatPath(window.location.href, path))

const filePathRelativeTo = (file: string, path: string): string =>
	file.startsWith('data:') || isAbsoluteFilePath(path)
		? normalizeFilePath(path)
		: normalizeFilePath(concatPath(file.split('/').slice(0, -1).join('/'), path))

const fetchedFiles = new Map<string, Promise<SourceFile>>()

const fetchSourceFile = (path: string): Promise<SourceFile> => {
	const resolved = resolveFilePath(path)
	const cached = fetchedFiles.get(resolved)
	if (cached) {
		return cached
	}
	const file = fetch(resolved).then(async response => {
		if (response.status !== 200) {
			throw new Error(response.statusText)
		}
		return createSourceFile(resolved, await response.text())
	})
	fetchedFiles.set(resolved, file)
	return file
}

const decodeDataUri = (uri: string): string => {
	const normalized = uri.replace(/\r?\n/g, '')
	const comma = normalized.indexOf(',')
	if (comma <= 4) {
		throw new TypeError('malformed data: URI')
	}
	const isBase64 = normalized.substring(5, comma).split(';').slice(1).includes('base64')
	const data = normalized.substring(comma + 1).replace(/%([0-9A-Fa-f]{2})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
	const binary = isBase64 ? atob(data) : data
	return new TextDecoder().decode(Uint8Array.from(binary, char => char.charCodeAt(0) & 0xff))
}

interface Mapping {
	generatedColumn: number
	sourceIndex?: number
	originalLine?: number
	originalColumn?: number
	nameIndex?: number
}

const base64Digits = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

const decodeSegment = (segment: string): number[] => {
	const values: number[] = []
	let value = 0
	let shift = 0
	for (const char of segment) {
		const digit = base64Digits.indexOf(char)
		if (digit < 0) {
			throw new Error(`Invalid base64 digit: ${char}`)
		}
		value += (digit & 31) << shift
		if (digit & 32) {
			shift += 5
			continue
		}
		values.push(value & 1 ? -(value >> 1) : value >> 1)
		value = 0
		shift = 0
	}
	if (shift > 0) {
		throw new Error('Expected more digits in base 64 VLQ value.')
	}
	return values
}

const compareMappings = (a: Mapping, b: Mapping): number =>
	a.generatedColumn - b.generatedColumn
	|| (a.sourceIndex ?? 0) - (b.sourceIndex ?? 0)
	|| (a.originalLine ?? 0) - (b.originalLine ?? 0)
	|| (a.originalColumn ?? 0) - (b.originalColumn ?? 0)
	|| (a.nameIndex ?? 0) - (b.nameIndex ?? 0)

const decodeMappings = (mappings: string): Mapping[][] => {
	let sourceIndex = 0
	let originalLine = 0
	let originalColumn = 0
	let nameIndex = 0
	return mappings.split(';').map(lineMappings => {
		let generatedColumn = 0
		const line: Mapping[] = []
		for (const segment of lineMappings.split(',')) {
			if (segment === '') {
				continue
			}
			const values = decodeSegment(segment)
			if (values.length === 2) {
				throw new Error('Found a source, but no line and column')
			}
			if (values.length === 3) {
				throw new Error('Found a source and line, but no column')
			}
			generatedColumn += values[0]
			if (values.length < 4) {
				line.push({ generatedColumn })
				continue
			}
			sourceIndex += values[1]
			originalLine += values[2]
			originalColumn += values[3]
			const mapping: Mapping = { generatedColumn, sourceIndex, originalLine, originalColumn }
			if (values.length > 4) {
				nameIndex += values[4]
				mapping.nameIndex = nameIndex
			}
			line.push(mapping)
		}
		return line.sort(compareMappings)
	})
}

interface SourceMap {
	sources: string[]
	sourcesContent: (string | null)[] | null
	sourceRoot: string | null
	lines: Mapping[][]
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const parseSourceMap = (text: string): SourceMap => {
	const map: unknown = JSON.parse(text)
	if (!isRecord(map) || !Array.isArray(map.sources) || typeof map.mappings !== 'string') {
		throw new Error('Unsupported source map')
	}
	if (Number(map.version) !== 3) {
		throw new Error(`Unsupported version: ${map.version}`)
	}
	const sourcesContent = Array.isArray(map.sourcesContent)
		? map.sourcesContent.map(content => typeof content === 'string' ? content : null)
		: null
	return {
		sources: map.sources.map(String),
		sourcesContent,
		sourceRoot: typeof map.sourceRoot === 'string' && map.sourceRoot !== '' ? map.sourceRoot : null,
		lines: decodeMappings(map.mappings),
	}
}

const originalPosition = (map: SourceMap, line: number, column: number): { sourceIndex: number; line: number; column: number } | null => {
	const candidates = map.lines[line - 1] ?? []
	let found: Mapping | undefined
	for (const mapping of candidates) {
		if (mapping.generatedColumn > column) {
			break
		}
		if (found === undefined || found.generatedColumn !== mapping.generatedColumn) {
			found = mapping
		}
	}
	if (found?.sourceIndex === undefined || found.originalLine === undefined || found.originalColumn === undefined) {
		return null
	}
	return { sourceIndex: found.sourceIndex, line: found.originalLine + 1, column: found.originalColumn }
}

const isAbsolutePath = (path: string): boolean => path.startsWith('/') || /^(?:[\w+\-.]+:)?\/\//.test(path)

const relativePath = (root: string, path: string): string => {
	let base = root.replace(/\/$/, '')
	let level = 0
	while (!path.startsWith(`${base}/`)) {
		const index = base.lastIndexOf('/')
		if (index < 0) {
			return path
		}
		base = base.slice(0, index)
		if (/^([^/]+:\/)?\/*$/.test(base)) {
			return path
		}
		level++
	}
	return '../'.repeat(level) + path.slice(base.length + 1)
}

// The path normalization of source-map: collapses repeated slashes and resolves `.` and `..` segments.
const normalizeSourcePath = (input: string): string => {
	const url = input.match(/^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/)
	if (url && !url[5]) {
		return input
	}
	const path = url ? url[5] : input
	const parts = path.split(/\/+/)
	let up = 0
	for (let i = parts.length - 1; i >= 0; i--) {
		const part = parts[i]
		if (part === '.') {
			parts.splice(i, 1)
		} else if (part === '..') {
			up++
		} else if (up > 0) {
			if (part === '') {
				parts.splice(i + 1, up)
				up = 0
			} else {
				parts.splice(i, 2)
				up--
			}
		}
	}
	const normalized = parts.join('/') || (isAbsolutePath(path) ? '/' : '.')
	if (!url) {
		return normalized
	}
	const [, scheme, auth, host, port] = url
	return `${scheme ? `${scheme}:` : ''}//${auth ? `${auth}@` : ''}${host ?? ''}${port ? `:${port}` : ''}${normalized}`
}

// source-map stores an absolute source relative to an absolute root and joins them again on lookup.
const sourceUrl = (map: SourceMap, sourceIndex: number): string => {
	const root = map.sourceRoot === null ? null : normalizeSourcePath(map.sourceRoot)
	const rawSource = normalizeSourcePath(map.sources[sourceIndex] ?? '')
	if (root === null) {
		return rawSource
	}
	const source = isAbsolutePath(root) && isAbsolutePath(rawSource) ? relativePath(root, rawSource) : rawSource
	return normalizeSourcePath(`${root}${root.endsWith('/') || source.startsWith('/') ? '' : '/'}${source}`)
}

interface ResolvedLocation {
	file: SourceFile
	line?: number
}

// Original sources can carry a source map of their own; the depth bound stops a map that points back at itself.
const maxSourceMapDepth = 8

const resolveInFile = async (file: SourceFile, line: number | undefined, column: number | undefined, depth: number): Promise<ResolvedLocation> => {
	const fallback = { file, line }
	const mapUrl = [...file.text.matchAll(/\u0023 sourceMappingURL=(.+)\n?/g)].at(-1)?.[1]
	if (!mapUrl || depth >= maxSourceMapDepth) {
		return fallback
	}
	try {
		const mapFile = mapUrl.startsWith('data:')
			? createSourceFile(file.url, decodeDataUri(mapUrl))
			: await fetchSourceFile(filePathRelativeTo(file.url, mapUrl))
		const map = parseSourceMap(mapFile.text)
		if (line === undefined || column === undefined) {
			throw new Error('A stack frame without a line and column cannot be mapped')
		}
		const original = originalPosition(map, line, column)
		if (original === null) {
			return fallback
		}
		const url = filePathRelativeTo(mapFile.url, sourceUrl(map, original.sourceIndex))
		const content = map.sourcesContent?.[original.sourceIndex]
		const originalFile = content ? createSourceFile(url, content) : await fetchSourceFile(url)
		return await resolveInFile(originalFile, original.line, original.column + 1, depth + 1)
	} catch {
		return fallback
	}
}

const resolveFrame = async (frame: StackFrameLocation): Promise<ResolvedStackFrame> => {
	const unresolved: ResolvedStackFrame = { callee: frame.callee, line: frame.line, ...describeFile(frame.file, frame.index) }
	// stacktracey also fetched the page for frames without a file; their source is never shown, as they have no line.
	if (frame.file === '' || frame.file.includes('<')) {
		return unresolved
	}
	let generated: SourceFile
	try {
		generated = await fetchSourceFile(frame.file)
	} catch {
		return unresolved
	}
	const resolved = await resolveInFile(generated, frame.line, frame.column, 0)
	const described = describeFile(resolved.file.url, frame.index)
	const sourceLine = resolved.line === undefined ? '' : resolved.file.lines[resolved.line - 1] ?? ''
	return {
		callee: frame.callee,
		line: resolved.line,
		fileShort: described.fileShort,
		thirdParty: described.thirdParty || sourceLine.includes('__webpack_require__') || sourceLine.includes('/******/ ({'),
		sourceLines: resolved.file.lines,
	}
}

export const resolveStackTrace = (stack: string): Promise<ResolvedStackFrame[]> => Promise.all(parseStackFrames(stack).map(resolveFrame))
