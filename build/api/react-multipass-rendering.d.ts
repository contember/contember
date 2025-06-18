import type { ElementType } from 'react';
import type { ReactElement } from 'react';
import type { ReactNode } from 'react';
import type { ReactText } from 'react';

export declare class BranchNode<Props extends {} = {}, StaticContext = undefined, FactoryMethodName extends ValidFactoryName = string, ChildrenRepresentation = any, ReducedChildrenRepresentation = any, Representation = any> {
    private static defaultOptions;
    readonly specification: BranchNode.Specification<Props, StaticContext, FactoryMethodName, ChildrenRepresentation, ReducedChildrenRepresentation, Representation>;
    readonly options: BranchNodeOptions;
    constructor(factoryMethodName: FactoryMethodName, childrenRepresentationReducer: ChildrenRepresentationReducer<ChildrenRepresentation, ReducedChildrenRepresentation>, options?: Partial<BranchNodeOptions>);
    constructor(useSiteFactory: UseSiteBranchNodeRepresentationFactory<Props, ChildrenRepresentation, Representation, StaticContext>, ComponentType?: ElementType<Props>, options?: Partial<BranchNodeOptions>);
}

export declare namespace BranchNode {
    export type Specification<Props extends {} = {}, StaticContext = any, FactoryMethodName extends ValidFactoryName = string, ChildrenRepresentation = any, ReducedChildrenRepresentation = any, Representation = any> = {
        type: 'declarationSite';
        factoryMethodName: FactoryMethodName;
        childrenRepresentationReducer: ChildrenRepresentationReducer<ChildrenRepresentation, ReducedChildrenRepresentation>;
    } | {
        type: 'useSite';
        factory: UseSiteBranchNodeRepresentationFactory<Props, ChildrenRepresentation, Representation, StaticContext>;
        ComponentType?: ElementType<Props>;
    };
}

declare type BranchNodeList<LeavesRepresentationUnion, BranchNodesRepresentationUnion, StaticContext> = BranchNode<any, StaticContext, ValidFactoryName, RawNodeRepresentation<LeavesRepresentationUnion, BranchNodesRepresentationUnion>, any, BranchNodesRepresentationUnion>[];

export declare interface BranchNodeOptions {
    childrenAreOptional: boolean;
    childrenAbsentErrorMessage: string;
}

export declare class ChildrenAnalyzer<AllLeavesRepresentation = any, AllBranchNodesRepresentation = never, StaticContext = undefined> {
    private static defaultOptions;
    private readonly leaves;
    private readonly branchNodes;
    private readonly options;
    constructor(leaves: LeafList<AllLeavesRepresentation, StaticContext>, options?: Partial<ChildrenAnalyzerOptions>);
    constructor(leaves: LeafList<AllLeavesRepresentation, StaticContext>, branchNodes: BranchNodeList<AllLeavesRepresentation, AllBranchNodesRepresentation, StaticContext>, options?: Partial<ChildrenAnalyzerOptions>);
    processChildren(children: ReactNode, initialStaticContext: StaticContext): Array<AllLeavesRepresentation | AllBranchNodesRepresentation>;
    private processNode;
}

export declare class ChildrenAnalyzerError extends Error {
    details?: string;
    constructor(message: string, options?: {
        cause: Error;
        details?: string;
    });
}

export declare interface ChildrenAnalyzerOptions<StaticContext = any> {
    ignoreRenderProps: boolean;
    renderPropsErrorMessage: ErrorMessageFactory<StaticContext>;
    ignoreUnhandledNodes: boolean;
    unhandledNodeErrorMessage: ErrorMessageFactory<StaticContext>;
    staticContextFactoryName: string;
    staticRenderFactoryName: string;
}

export declare type ChildrenRepresentationReducer<ChildrenRepresentation, ReducedChildrenRepresentation> = (childrenRepresentations: ChildrenRepresentation) => ReducedChildrenRepresentation;

export declare type ConstrainedLeafRepresentationFactory<Props extends {}, Representation, StaticContext> = (node: ReactElement<Props, any>, staticContext: StaticContext) => Representation;

export declare type DeclarationSiteNodeRepresentationFactory<Props extends {}, ReducedChildrenRepresentation, Representation, StaticContext> = (props: Props, reducedChildrenRepresentation: ReducedChildrenRepresentation, staticContext: StaticContext) => Representation;

declare type ErrorMessageFactory<StaticContext = any> = string | ((node: ReactNode, staticContext: StaticContext) => string);

export declare class Leaf<Props extends {} = {}, StaticContext = any, FactoryMethodName extends ValidFactoryName = string, Representation = any> {
    readonly specification: Leaf.Specification<FactoryMethodName, Representation, Props, StaticContext>;
    constructor(factoryMethodName: FactoryMethodName);
    constructor(staticFactory: UnconstrainedLeafRepresentationFactory<Props, Representation, StaticContext>);
    constructor(staticFactory: ConstrainedLeafRepresentationFactory<Props, Representation, StaticContext>, ComponentType: ElementType<Props>);
}

export declare namespace Leaf {
    export type Specification<FactoryMethodName extends ValidFactoryName, Representation, Props extends {}, StaticContext> = {
        type: 'declarationSite';
        factoryMethodName: FactoryMethodName;
    } | {
        type: 'useSite';
        factory: UnconstrainedLeafRepresentationFactory<Props, Representation, StaticContext>;
        ComponentType?: ElementType<Props>;
    };
}

declare type LeafList<RepresentationUnion, StaticContext> = Leaf<any, StaticContext, ValidFactoryName, RepresentationUnion>[];

export declare type RawNodeRepresentation<AllLeavesRepresentation, AllBranchNodesRepresentation = AllLeavesRepresentation> = AllLeavesRepresentation | AllBranchNodesRepresentation | Array<AllLeavesRepresentation | AllBranchNodesRepresentation> | undefined;

export declare type RepresentationFactorySite = 'declarationSite' | 'useSite';

export declare type StaticContextFactory<Props extends {}, StaticContext> = (props: Props, staticContext: StaticContext) => StaticContext;

export declare type SyntheticChildrenFactory<Props extends {}, StaticContext> = (props: Props, staticContext: StaticContext) => ReactNode;

export declare type UnconstrainedLeafRepresentationFactory<Props extends {}, Representation, StaticContext> = (node: ReactText | ReactElement<Props, any> | boolean | null | undefined, staticContext: StaticContext) => Representation;

export declare type UseSiteBranchNodeRepresentationFactory<Props extends {}, ChildrenRepresentation, Representation, StaticContext> = (node: ReactElement<Props, any>, childrenRepresentation: ChildrenRepresentation, staticContext: StaticContext) => Representation;

export declare type ValidFactoryName = string | number;

export { }
