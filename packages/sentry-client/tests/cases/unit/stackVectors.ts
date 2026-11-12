import { StackFrame } from '../../../src/types.js'

// Stacks with the frames @sentry/node 7.120.4 reported for them: exceptionFromError(createStackParser(nodeStackLineParser(createGetModuleFromFilename('/app/dist'))), error).
export const stackVectors: Record<string, { stack: string; frames: StackFrame[] }> = {
	node: {
		stack:
			'DbError: outer failure\n    at Server.<anonymous> (/app/dist/server.js:20:17)\n    at Object.onceWrapper (node:events:621:28)\n    at Server.emit (node:events:519:35)\n    at emitListeningNT (node:net:1983:10)\n    at process.processTicksAndRejections (node:internal/process/task_queues:89:21)',
		frames: [
			{
				filename: 'node:internal/process/task_queues',
				module: 'task_queues',
				function: 'process.processTicksAndRejections',
				lineno: 89,
				colno: 21,
				in_app: false,
			},
			{
				filename: 'node:net',
				module: 'node:net',
				function: 'emitListeningNT',
				lineno: 1983,
				colno: 10,
				in_app: false,
			},
			{
				filename: 'node:events',
				module: 'node:events',
				function: 'Server.emit',
				lineno: 519,
				colno: 35,
				in_app: false,
			},
			{
				filename: 'node:events',
				module: 'node:events',
				function: 'Object.onceWrapper',
				lineno: 621,
				colno: 28,
				in_app: false,
			},
			{
				filename: '/app/dist/server.js',
				module: 'server',
				function: 'Server.<anonymous>',
				lineno: 20,
				colno: 17,
				in_app: true,
			},
		],
	},
	nodeAsyncAndEval: {
		stack:
			'Error: from eval\n    at eval (eval at run (/app/dist/lib/run.js:3:9), <anonymous>:1:7)\n    at new Promise (<anonymous>)\n    at async Promise.all (index 0)\n    at async Handler.handle (/app/dist/lib/handler.mjs:44:3)\n    at Object.<anonymous> (/app/dist/index.js:1:1)\n    at Module._compile (node:internal/modules/cjs/loader:1554:14)\n    at Array.forEach (<anonymous>)',
		frames: [
			{
				filename: '<anonymous>',
				module: '<anonymous>',
				function: 'Array.forEach',
				in_app: false,
			},
			{
				filename: 'node:internal/modules/cjs/loader',
				module: 'loader',
				function: 'Module._compile',
				lineno: 1554,
				colno: 14,
				in_app: false,
			},
			{
				filename: '/app/dist/index.js',
				module: 'index',
				function: 'Object.<anonymous>',
				lineno: 1,
				colno: 1,
				in_app: true,
			},
			{
				filename: '/app/dist/lib/handler.mjs',
				module: 'lib:handler',
				function: 'Handler.handle',
				lineno: 44,
				colno: 3,
				in_app: true,
			},
			{
				filename: 'index 0',
				module: 'index 0',
				function: 'Promise.all',
				in_app: false,
			},
			{
				filename: '<anonymous>',
				module: '<anonymous>',
				function: 'new Promise',
				in_app: false,
			},
			{
				filename: 'eval at run (/app/dist/lib/run.js:3:9), <anonymous>',
				module: 'run.js:3:9), <anonymous>',
				function: 'eval',
				lineno: 1,
				colno: 7,
				in_app: false,
			},
		],
	},
	nodeModulesAndUrls: {
		stack:
			'TypeError: x is not a function\n    at Client.query (/app/node_modules/pg/lib/client.js:525:17)\n    at Pool.connect (/app/node_modules/@scope/pool/dist/index.cjs:9:2)\n    at run (file:///app/dist/esm/run.mjs:12:3)\n    at C:\\app\\win.js:1:2\n    at /app/dist/anonymous-fn.js:7:9\n    at Foo.bar.baz (/outside/base/file.ts:3:4)\n    at Proxy.method (/app/dist/proxy.js:2:2)\n    at Thing..get (/app/dist/dots.js:1:1)',
		frames: [
			{
				filename: '/app/dist/dots.js',
				module: 'dots',
				function: 'Thing..get',
				lineno: 1,
				colno: 1,
				in_app: true,
			},
			{
				filename: '/app/dist/proxy.js',
				module: 'proxy',
				function: 'Proxy.method',
				lineno: 2,
				colno: 2,
				in_app: true,
			},
			{
				filename: '/outside/base/file.ts',
				module: 'file.ts',
				function: 'Foo.bar.baz',
				lineno: 3,
				colno: 4,
				in_app: true,
			},
			{
				filename: '/app/dist/anonymous-fn.js',
				module: 'anonymous-fn',
				function: '<anonymous>',
				lineno: 7,
				colno: 9,
				in_app: true,
			},
			{
				filename: 'C:\\app\\win.js',
				module: 'C:\\app\\win',
				function: '<anonymous>',
				lineno: 1,
				colno: 2,
				in_app: true,
			},
			{
				filename: '/app/dist/esm/run.mjs',
				module: 'esm:run',
				function: 'run',
				lineno: 12,
				colno: 3,
				in_app: true,
			},
			{
				filename: '/app/node_modules/@scope/pool/dist/index.cjs',
				module: '@scope.pool.dist:index',
				function: 'Pool.connect',
				lineno: 9,
				colno: 2,
				in_app: false,
			},
			{
				filename: '/app/node_modules/pg/lib/client.js',
				module: 'pg.lib:client',
				function: 'Client.query',
				lineno: 525,
				colno: 17,
				in_app: false,
			},
		],
	},
	bun: {
		stack:
			'DbError: outer failure\n    at <anonymous> (/app/dist/server.js:20:21)\n    at emit (node:events:101:22)\n    at emitListeningNextTick (node:_http_server:112:14)\n    at processTicksAndRejections (native:7:39)',
		frames: [
			{
				filename: 'native',
				module: 'native',
				function: 'processTicksAndRejections',
				lineno: 7,
				colno: 39,
				in_app: false,
			},
			{
				filename: 'node:_http_server',
				module: 'node:_http_server',
				function: 'emitListeningNextTick',
				lineno: 112,
				colno: 14,
				in_app: false,
			},
			{
				filename: 'node:events',
				module: 'node:events',
				function: 'emit',
				lineno: 101,
				colno: 22,
				in_app: false,
			},
			{
				filename: '/app/dist/server.js',
				module: 'server',
				function: '<anonymous>',
				lineno: 20,
				colno: 21,
				in_app: true,
			},
		],
	},
	bunAsync: {
		stack:
			'Error: after await\n    at async <anonymous> (/app/dist/handler.js:23:43)\n    at module code (/app/dist/index.js:5:1)\n    at moduleEvaluation (native:1:11)',
		frames: [
			{
				filename: 'native',
				module: 'native',
				function: 'moduleEvaluation',
				lineno: 1,
				colno: 11,
				in_app: false,
			},
			{
				filename: '/app/dist/index.js',
				module: 'index',
				function: 'module code',
				lineno: 5,
				colno: 1,
				in_app: true,
			},
			{
				filename: '/app/dist/handler.js',
				module: 'handler',
				function: '<anonymous>',
				lineno: 23,
				colno: 43,
				in_app: true,
			},
		],
	},
	separatorAndLongLine: {
		stack:
			'Error: odd lines\n    at first (/app/dist/a.js:1:1)\n    ----------------\n    at xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (/app/dist/long.js:1:1)\n    at last (/app/dist/b.js:2:2)',
		frames: [
			{
				filename: '/app/dist/b.js',
				module: 'b',
				function: 'last',
				lineno: 2,
				colno: 2,
				in_app: true,
			},
			{
				filename: '    ----------------',
				function: '?',
			},
			{
				filename: '/app/dist/a.js',
				module: 'a',
				function: 'first',
				lineno: 1,
				colno: 1,
				in_app: true,
			},
		],
	},
	headerInside: {
		stack: 'Error: header\n    at first (/app/dist/a.js:1:1)\nCaused by: TypeError: inner\n    at second (/app/dist/b.js:2:2)',
		frames: [
			{
				filename: '/app/dist/b.js',
				module: 'b',
				function: 'second',
				lineno: 2,
				colno: 2,
				in_app: true,
			},
			{
				filename: '/app/dist/a.js',
				module: 'a',
				function: 'first',
				lineno: 1,
				colno: 1,
				in_app: true,
			},
		],
	},
	ownFrames: {
		stack:
			'Error: Sentry syntheticException\n    at Object.captureException (/app/node_modules/@contember/sentry-client/dist/index.js:10:5)\n    at captureException (/app/node_modules/@contember/sentry-client/dist/index.js:20:5)\n    at caller (/app/dist/caller.js:3:3)',
		frames: [
			{
				filename: '/app/dist/caller.js',
				module: 'caller',
				function: 'caller',
				lineno: 3,
				colno: 3,
				in_app: true,
			},
		],
	},
	lowercaseHeader: {
		stack:
			'error: syntax error at or near "x"\n    at Parser.parseErrorMessage (/app/node_modules/pg-protocol/dist/parser.js:283:98)\n    at Client.query (/app/dist/db.js:10:5)',
		frames: [
			{
				filename: '/app/dist/db.js',
				module: 'db',
				function: 'Client.query',
				lineno: 10,
				colno: 5,
				in_app: true,
			},
			{
				filename: '/app/node_modules/pg-protocol/dist/parser.js',
				module: 'pg-protocol.dist:parser',
				function: 'Parser.parseErrorMessage',
				lineno: 283,
				colno: 98,
				in_app: false,
			},
		],
	},
	pathInMessage: {
		stack: 'ConfigProblem: unexpected key at /etc/hostname:1:1\n    at load (/app/dist/config.js:4:11)',
		frames: [
			{
				filename: '/app/dist/config.js',
				module: 'config',
				function: 'load',
				lineno: 4,
				colno: 11,
				in_app: true,
			},
		],
	},
	urlInMessage: {
		stack: 'FetchFailed: request failed at https://example.com/hook:443:1\n    at send (/app/dist/webhook.js:7:3)',
		frames: [
			{
				filename: '/app/dist/webhook.js',
				module: 'webhook',
				function: 'send',
				lineno: 7,
				colno: 3,
				in_app: true,
			},
		],
	},
	webpackWrapper: {
		stack: 'Error: wrapped\n    at handler (webpack-internal:///./src/handler.js:3:9)\n    at run (/app/dist/main.js (error: /app/dist/inner.js:5:6))',
		frames: [
			{
				filename: '/app/dist/main.js /app/dist/inner.js',
				module: 'main.js .app.dist:inner',
				function: 'run',
				lineno: 5,
				colno: 6,
				in_app: true,
			},
			{
				filename: 'webpack-internal:///./src/handler.js',
				module: 'handler',
				function: 'handler',
				lineno: 3,
				colno: 9,
				in_app: true,
			},
		],
	},
}
