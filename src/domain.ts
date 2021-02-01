import { ReactNode, ComponentType } from 'react';

export type ASTNode =
    | string
    | {
    name: string;
    content: AST;
};

export type AST = Array<ASTNode>;

export enum RuleScope {
    BLOCK,
    INLINE
}

export type Renderer = {
    name: string;
    react(node: ASTNode, ast: AST): ReactElementDescription;
}
export type RendererMap = {
    [name: string]: Renderer
}

export type Rule = Renderer & {
    scope: RuleScope;
    regex: RegExp;
    parse(match: RegexMatch): ASTNode;
    extraRenderers?: {
        [key: string]: Renderer['react']
    };
    [key: string]: any;
};

export interface ReactElementDescription {
    type: string | ComponentType<any>;
    props?: { [key: string]: any };
    children?: Array<ReactNode>;
}

export type RegexMatch = {
    fullmatch: string;
    capture: Array<string>;
    index: number;
    input: string;
};
