import { JSONValue } from '@contember/schema';

export declare class GraphQlField {
    readonly alias: string | null;
    readonly name: string;
    readonly args: GraphQlFieldTypedArgs;
    readonly selectionSet?: GraphQlSelectionSet | undefined;
    constructor(alias: string | null, name: string, args?: GraphQlFieldTypedArgs, selectionSet?: GraphQlSelectionSet | undefined);
}

export declare type GraphQlFieldTypedArgs = Record<string, {
    graphQlType: string;
    value?: JSONValue;
}>;

export declare class GraphQlFragment {
    readonly name: string;
    readonly type: string;
    readonly selectionSet: GraphQlSelectionSet;
    constructor(name: string, type: string, selectionSet: GraphQlSelectionSet);
}

export declare class GraphQlFragmentSpread {
    readonly name: string;
    constructor(name: string);
}

export declare class GraphQlInlineFragment {
    readonly type: string;
    readonly selectionSet: GraphQlSelectionSet;
    constructor(type: string, selectionSet: GraphQlSelectionSet);
}

export declare type GraphQlPrintResult = {
    query: string;
    variables: Record<string, JSONValue>;
};

export declare class GraphQlQueryPrinter {
    private indentString;
    private variableCounter;
    private variables;
    private variableValueToName;
    private usedFragments;
    private body;
    printDocument(operation: 'query' | 'mutation', select: GraphQlSelectionSet, fragments: Record<string, GraphQlFragment>): GraphQlPrintResult;
    private processUsedFragments;
    private processFragment;
    private printVariables;
    private processSelectionSet;
    private processField;
    private resolveVariableName;
    private cleanState;
}

export declare type GraphQlSelectionSet = GraphQlSelectionSetItem[];

export declare type GraphQlSelectionSetItem = GraphQlField | GraphQlFragmentSpread | GraphQlInlineFragment;

export { }
