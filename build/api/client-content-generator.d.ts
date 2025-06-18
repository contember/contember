import { Model } from '@contember/schema';
import { SchemaNames } from '@contember/client-content';

export declare class ContemberClientGenerator {
    private readonly nameSchemaGenerator;
    private readonly enumTypeSchemaGenerator;
    private readonly entityTypeSchemaGenerator;
    constructor(nameSchemaGenerator?: NameSchemaGenerator, enumTypeSchemaGenerator?: EnumTypeSchemaGenerator, entityTypeSchemaGenerator?: EntityTypeSchemaGenerator);
    generate(model: Model.Schema): Record<string, string>;
}

export declare class EntityTypeSchemaGenerator {
    generate(model: Model.Schema): string;
    private generateTypeEntityCode;
    private formatReducedFields;
    private formatUniqueFields;
}

export declare class EnumTypeSchemaGenerator {
    generate(model: Model.Schema): string;
}

export declare class NameSchemaGenerator {
    generate(model: Model.Schema): SchemaNames;
}

export { }
