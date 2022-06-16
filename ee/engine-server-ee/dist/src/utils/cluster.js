"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerManager = exports.notifyWorkerStarted = exports.waitForWorker = exports.ProcessType = exports.getClusterProcessType = void 0;
const cluster_1 = __importDefault(require("cluster"));
const timeout_1 = require("./timeout");
const getClusterProcessType = (isClusterMode) => !isClusterMode ? ProcessType.singleNode : cluster_1.default.isMaster ? ProcessType.clusterMaster : ProcessType.clusterWorker;
exports.getClusterProcessType = getClusterProcessType;
var ProcessType;
(function (ProcessType) {
    ProcessType[ProcessType["singleNode"] = 0] = "singleNode";
    ProcessType[ProcessType["clusterMaster"] = 1] = "clusterMaster";
    ProcessType[ProcessType["clusterWorker"] = 2] = "clusterWorker";
})(ProcessType = exports.ProcessType || (exports.ProcessType = {}));
const MSG_WORKER_STARTED = 'msg_worker_started';
const waitForWorker = (worker, timeoutMs) => {
    let ok = false;
    return Promise.race([
        new Promise(async (resolve) => {
            const listener = (message) => {
                if ('type' in message && message.type === MSG_WORKER_STARTED) {
                    ok = true;
                    resolve(null);
                    worker.removeListener('message', listener);
                }
            };
            await worker.on('message', listener);
        }),
        (0, timeout_1.timeout)(timeoutMs).then(() => {
            if (!ok) {
                throw new Error('Worker start timed out');
            }
            return true;
        }),
    ]);
};
exports.waitForWorker = waitForWorker;
const notifyWorkerStarted = () => {
    var _a;
    return (_a = process.send) === null || _a === void 0 ? void 0 : _a.call(process, {
        type: MSG_WORKER_STARTED,
    });
};
exports.notifyWorkerStarted = notifyWorkerStarted;
class WorkerManager {
    constructor(workerCount) {
        this.workerCount = workerCount;
        this.state = 'none';
    }
    async start() {
        if (this.state !== 'none') {
            throw new Error(`Worker manager is ${this.state}`);
        }
        this.state = 'initializing';
        cluster_1.default.on('exit', async (worker, code, signal) => {
            if (this.state === 'running' || this.state === 'initializing') {
                // eslint-disable-next-line no-console
                console.log(`Worker ${worker.process.pid} died with signal ${signal}, restarting`);
                await (0, timeout_1.timeout)(2000);
                cluster_1.default.fork();
            }
        });
        for (let i = 0; i < this.workerCount; i++) {
            const worker = cluster_1.default.fork();
            await (0, exports.waitForWorker)(worker, 15000);
            if (this.state !== 'initializing') {
                return;
            }
        }
        this.state = 'running';
    }
    async terminate(signal) {
        if (this.state !== 'running') {
            throw new Error(`Worker manager is ${this.state}`);
        }
        this.state = 'terminating';
        await Promise.allSettled(Array.from(cluster_1.default.workers ? Object.values(cluster_1.default.workers) : []).map(async (it) => {
            if (!it) {
                return;
            }
            // eslint-disable-next-line no-console
            console.log(`Terminating worker ${it.process.pid}`);
            const disconnectPromise = new Promise(resolve => it.once('disconnect', resolve));
            it.disconnect();
            await disconnectPromise;
            const killPromise = new Promise(resolve => it.once('exit', resolve));
            it.kill(signal);
            await killPromise;
            // eslint-disable-next-line no-console
            console.log(`Worker ${it.process.pid} terminated`);
        }));
        this.state = 'closed';
    }
}
exports.WorkerManager = WorkerManager;
//# sourceMappingURL=cluster.js.map