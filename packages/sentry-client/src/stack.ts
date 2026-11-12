import { posix } from 'node:path'
import { StackFrame } from './types.js'

// The stack-line grammar and frame fields follow @sentry/node 7, so that issues keep grouping the same way.

const frameLimit = 50
const maxLineLength = 1024
const frameLinePattern = /at (?:async )?(?:(.+?)\s+\()?(?:(.+):(\d+):(\d+)?|([^)]+))\)?/
const separatorLinePattern = /^\s*[-]{4,}$/
const errorHeaderPattern = /\S*Error: /
const webpackErrorPattern = /\(error: (.*)\)/

export type ModuleResolver = (filename: string | undefined) => string | undefined

/** `dir.sub:file` for a file below `basePath`, `package.dir:file` inside node_modules, otherwise the file name. */
export const createModuleResolver = (basePath: string): ModuleResolver => filename => {
	if (!filename) {
		return undefined
	}
	const parsed = posix.parse(filename)
	const file = ['.js', '.mjs', '.cjs'].includes(parsed.ext) ? parsed.base.slice(0, -parsed.ext.length) : parsed.base
	const dir = parsed.dir || '.'
	const nodeModules = dir.lastIndexOf('/node_modules')
	if (nodeModules > -1) {
		return `${dir.slice(nodeModules + 14).replace(/\//g, '.')}:${file}`
	}
	if (dir.startsWith(basePath)) {
		const moduleName = dir.slice(basePath.length + 1).replace(/\//g, '.')
		return moduleName ? `${moduleName}:${file}` : file
	}
	return file
}

export const isInApp = (filename: string | undefined, isNative = false): boolean => {
	const isInternal = isNative
		|| (filename !== undefined
			&& !filename.startsWith('/')
			&& !/^[A-Z]:/.test(filename)
			&& !filename.startsWith('.')
			&& !/^[a-zA-Z]([a-zA-Z0-9.\-+])*:\/\//.test(filename))
	return !isInternal && filename !== undefined && !filename.includes('node_modules/')
}

const functionName = (raw: string | undefined): string => {
	if (raw === undefined) {
		return '<anonymous>'
	}
	let name = raw
	let methodStart = name.lastIndexOf('.')
	if (name[methodStart - 1] === '.') {
		methodStart--
	}
	if (methodStart <= 0) {
		return name
	}
	let object = name.slice(0, methodStart)
	const method = name.slice(methodStart + 1)
	const objectEnd = object.indexOf('.Module')
	if (objectEnd > 0) {
		name = name.slice(objectEnd + 1)
		object = object.slice(0, objectEnd)
	}
	return method === '<anonymous>' ? `${object}.<anonymous>` : name
}

const parseLine = (line: string, resolveModule: ModuleResolver): StackFrame | undefined => {
	const match = frameLinePattern.exec(line)
	if (!match) {
		return separatorLinePattern.test(line) ? { filename: line } : undefined
	}
	const isNative = match[5] === 'native'
	let filename = match[2]?.startsWith('file://') ? match[2].slice(7) : match[2]
	if (filename && /\/[A-Z]:/.test(filename)) {
		filename = filename.slice(1)
	}
	if (!filename && match[5] && !isNative) {
		filename = match[5]
	}
	return {
		filename,
		module: resolveModule(filename),
		function: functionName(match[1]),
		lineno: Number.parseInt(match[3], 10) || undefined,
		colno: Number.parseInt(match[4], 10) || undefined,
		in_app: isInApp(filename, isNative),
	}
}

/**
 * Frames of a V8 or Bun `error.stack`, oldest first, at most 50 (the innermost 50 calls). The first line is the
 * `<name>: <message>` header and is never a frame, whatever the message says.
 */
export const parseStack = (stack: string, resolveModule: ModuleResolver): StackFrame[] => {
	const frames: StackFrame[] = []
	for (const rawLine of stack.split('\n').slice(1)) {
		if (rawLine.length > maxLineLength) {
			continue
		}
		const line = rawLine.replace(webpackErrorPattern, '$1')
		if (errorHeaderPattern.test(line)) {
			continue
		}
		const frame = parseLine(line, resolveModule)
		if (frame) {
			frames.push(frame)
		}
		if (frames.length >= frameLimit) {
			break
		}
	}
	frames.reverse()
	// a synthetic error made inside captureException starts with the client's own frames
	for (let i = 0; i < 2 && /captureMessage|captureException/.test(frames.at(-1)?.function ?? ''); i++) {
		frames.pop()
	}
	const lastFilename = frames.at(-1)?.filename
	return frames.map(frame => ({ ...frame, filename: frame.filename || lastFilename, function: frame.function || '?' }))
}
