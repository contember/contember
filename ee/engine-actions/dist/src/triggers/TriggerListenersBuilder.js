"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriggerListenerBuilder = void 0;
const TriggerListenersStore_1 = require("./TriggerListenersStore");
const schema_utils_1 = require("@contember/schema-utils");
const map_1 = require("../utils/map");
const ImplementationException_1 = require("../ImplementationException");
class TriggerListenerBuilder {
    constructor(model) {
        this.model = model;
        this.data = {
            createListeners: new Map(),
            updateListeners: new Map(),
            deleteListeners: new Map(),
            indirectListeners: new Map(),
            junctionListeners: new Map(),
        };
    }
    add(trigger) {
        if (trigger.type === 'basic') {
            this.processBasicTrigger(trigger);
        }
        else if (trigger.type === 'watch') {
            this.processIndirectListeners(trigger);
        }
        else {
            ((_) => {
                throw new ImplementationException_1.ImplementationException(`Unhandled trigger ${trigger.type}`);
            })(trigger);
        }
    }
    processBasicTrigger(trigger) {
        const entity = (0, schema_utils_1.getEntity)(this.model, trigger.entity);
        if (trigger.create) {
            this.addListener('createListeners', trigger.entity, {
                type: 'create',
                entity,
                trigger,
            });
        }
        if (trigger.delete) {
            this.addListener('deleteListeners', trigger.entity, {
                type: 'delete',
                entity,
                trigger,
            });
        }
        if (trigger.update) {
            this.addListener('updateListeners', trigger.entity, {
                type: 'update',
                entity,
                trigger,
                fields: new Set(Object.keys(entity.fields)), // todo: only columns and owning
            });
        }
    }
    processIndirectListeners(trigger) {
        const entity = (0, schema_utils_1.getEntity)(this.model, trigger.entity);
        this.addListener('createListeners', trigger.entity, {
            type: 'create',
            entity,
            trigger,
        });
        this.addListener('deleteListeners', trigger.entity, {
            type: 'delete',
            entity,
            trigger,
        });
        this.processIndirectListenersNode(trigger, entity, entity, trigger.watch, []);
    }
    processIndirectListenersNode(trigger, rootEntity, entity, node, path) {
        const fields = new Set();
        const relations = new Set();
        for (const entry of node) {
            const [field, args, selection] = Array.isArray(entry) ? entry : [entry, undefined, undefined];
            (0, schema_utils_1.acceptFieldVisitor)(this.model, entity, field, {
                visitColumn: ({ entity, column }) => {
                    if ((selection === null || selection === void 0 ? void 0 : selection.length) > 0) {
                        throw new ImplementationException_1.ImplementationException(`Column ${field} cannot have sub-selection`);
                    }
                    fields.add(column.name);
                },
                visitManyHasOne: ({ entity, relation, targetEntity, targetRelation }) => {
                    fields.add(relation.name);
                    relations.add(relation.name);
                    if ((selection === null || selection === void 0 ? void 0 : selection.length) > 0) {
                        this.processIndirectListenersNode(trigger, rootEntity, targetEntity, selection, [...path, relation.name]);
                    }
                },
                visitOneHasMany: ({ entity, relation, targetEntity, targetRelation }) => {
                    this.processIndirectListenersNode(trigger, rootEntity, targetEntity, [...selection !== null && selection !== void 0 ? selection : [], targetRelation.name], [...path, relation.name]);
                },
                visitOneHasOneOwning: ({ entity, relation, targetEntity, targetRelation }) => {
                    fields.add(relation.name);
                    relations.add(relation.name);
                    if ((selection === null || selection === void 0 ? void 0 : selection.length) > 0) {
                        this.processIndirectListenersNode(trigger, rootEntity, targetEntity, selection, [...path, relation.name]);
                    }
                },
                visitOneHasOneInverse: ({ entity, relation, targetEntity, targetRelation }) => {
                    this.processIndirectListenersNode(trigger, rootEntity, targetEntity, [...selection !== null && selection !== void 0 ? selection : [], targetRelation.name], [...path, relation.name]);
                },
                visitManyHasManyOwning: ({ entity, relation, targetEntity, targetRelation }) => {
                    this.addJunctionListener(entity.name, relation.name, {
                        type: 'junction',
                        rootEntity,
                        path: path,
                        trigger,
                        context: {
                            entity,
                            relation,
                            type: 'owning',
                        },
                    });
                    if ((selection === null || selection === void 0 ? void 0 : selection.length) > 0) {
                        this.processIndirectListenersNode(trigger, rootEntity, targetEntity, selection, [...path, relation.name]);
                    }
                },
                visitManyHasManyInverse: ({ entity, relation, targetEntity, targetRelation }) => {
                    this.addJunctionListener(targetEntity.name, targetRelation.name, {
                        type: 'junction',
                        rootEntity,
                        path: path,
                        trigger,
                        context: {
                            entity,
                            relation,
                            type: 'inverse',
                        },
                    });
                    if ((selection === null || selection === void 0 ? void 0 : selection.length) > 0) {
                        this.processIndirectListenersNode(trigger, rootEntity, targetEntity, selection, [...path, relation.name]);
                    }
                },
            });
        }
        if (path.length === 0) {
            this.addListener('updateListeners', entity.name, {
                type: 'update',
                entity: rootEntity,
                fields,
                trigger,
            });
        }
        else {
            this.addListener('indirectListeners', entity.name, {
                type: 'indirect',
                rootEntity: rootEntity,
                fields,
                relations,
                path,
                trigger,
            });
        }
    }
    createStore() {
        return new TriggerListenersStore_1.TriggerListenersStore(this.data);
    }
    addListener(type, entityName, value) {
        (0, map_1.mapGetOrPut)(this.data[type], entityName, () => []).push(value);
    }
    addJunctionListener(entityName, relationName, listener) {
        const entityJunctionListeners = (0, map_1.mapGetOrPut)(this.data.junctionListeners, entityName, () => new Map());
        const relationListeners = (0, map_1.mapGetOrPut)(entityJunctionListeners, relationName, () => []);
        relationListeners.push(listener);
    }
}
exports.TriggerListenerBuilder = TriggerListenerBuilder;
//# sourceMappingURL=TriggerListenersBuilder.js.map