"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriggerIndirectChangesFetcher = void 0;
const database_1 = require("@contember/database");
class TriggerIndirectChangesFetcher {
    constructor(mapper, whereBuilder, pathFactory) {
        this.mapper = mapper;
        this.whereBuilder = whereBuilder;
        this.pathFactory = pathFactory;
    }
    async fetch(listener, where) {
        for (const key of listener.path.reverse()) {
            where = { [key]: where };
        }
        const qb = database_1.SelectBuilder.create()
            .from(listener.rootEntity.tableName, 'root_')
            .select(['root_', listener.rootEntity.primaryColumn], 'id');
        const path = this.pathFactory.create([]);
        const qbWithWhere = this.whereBuilder.build(qb, listener.rootEntity, path, where);
        return (await qbWithWhere.getResult(this.mapper.db)).map(it => it.id);
    }
}
exports.TriggerIndirectChangesFetcher = TriggerIndirectChangesFetcher;
//# sourceMappingURL=TriggerIndirectChangesFetcher.js.map