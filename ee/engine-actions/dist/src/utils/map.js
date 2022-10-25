"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapGetOrPut = void 0;
const mapGetOrPut = (map, key, defaultValue) => {
    const value = map.get(key);
    if (value !== undefined) {
        return value;
    }
    const newValue = defaultValue();
    map.set(key, newValue);
    return newValue;
};
exports.mapGetOrPut = mapGetOrPut;
//# sourceMappingURL=map.js.map