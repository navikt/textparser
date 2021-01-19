import {createElement, Fragment, ReactElement} from 'react';
import {AST, ASTNode, RegexMatch, Rule, RuleScope} from './domain';
import {flatMap, match, minBy} from './utils';

type NonNullableMatch = { match: RegexMatch; rule: Rule };
type Match = null | NonNullableMatch;

function findFirstMatchingRule(node: string, rules: Array<Rule>): Match {
    return rules
        .map(rule => {
            const isMatch = match(rule.regex, node);
            if (!isMatch) {
                return null;
            }

            return {
                match: isMatch,
                rule
            };
        })
        .filter(result => result)
        .reduce(
            minBy<Match>(result => (result ? result.match.index : Number.MAX_SAFE_INTEGER)),
            null as Match
        );
}

function findSurroundingNodes(node: string, matched: NonNullableMatch): Array<AST> {
    const matchStart: number = matched.match.index;
    const matchEnd: number = matched.match.index + matched.match.fullmatch.length;
    const beforeMatch: string = node.slice(0, matchStart);
    const afterMatch: string = node.slice(matchEnd);

    return [[beforeMatch], [afterMatch]];
}

function parseMatch(matched: NonNullableMatch, rules: Array<Rule>, recurse: boolean): AST {
    const matchedASTNode = matched.rule.parse(matched.match);
    if (recurse) {
        return nodeParser(
            matchedASTNode,
            rules.filter(rule => rule !== matched.rule),
            recurse
        );
    } else {
        return [matchedASTNode];
    }
}

function recurseAST(ast: AST, rules: Array<Rule>, recurse: boolean): AST {
    return flatMap(ast, child => nodeParser(child, rules, recurse));
}

function nodeParser(node: ASTNode, rules: Array<Rule>, recurse: boolean): AST {
    if (typeof node === 'string') {
        const matched = findFirstMatchingRule(node, rules);
        if (!matched) {
            return [node];
        }

        const surroundingNodes = findSurroundingNodes(node, matched);
        const [beforeAST, afterAST] = surroundingNodes.map(surroundingNode => recurseAST(surroundingNode, rules, recurse));
        const matchedAST = parseMatch(matched, rules, recurse);

        return [...beforeAST, ...matchedAST, ...afterAST];
    } else {
        return [
            {
                name: node.name,
                content: recurseAST(node.content, rules, recurse)
            }
        ];
    }
}

function simplify(node: ASTNode): Array<ASTNode> {
    if (typeof node === 'string') {
        return node.length === 0 ? [] : [node];
    } else {
        return [{name: node.name, content: flatMap(node.content, simplify)}];
    }
}

function internalBuild(ast: AST, ruleMap: { [name: string]: Rule }, node: ASTNode, key: number): React.ReactNode {
    if (typeof node === 'string') {
        return node;
    }
    const type = ruleMap[node.name];
    const element = type.react(node, ast);
    const children =
        element.children?.length === 0 || node.content.length === 0
            ? undefined
            : element.children || node.content.map((child, i) => internalBuild(ast, ruleMap, child, i));
    return createElement(element.type, {...element.props, key}, children);
}

function convertRuleFormat(rules: Array<Rule>) {
    const blockRules = rules.filter(rule => rule.scope === RuleScope.BLOCK);
    const inlineRules = rules.filter(rule => rule.scope === RuleScope.INLINE);
    return {blockRules, inlineRules};
}

export function parse(content: string, rules: Array<Rule>): AST {
    const trimmed = content.trim().replace(/\r/g, '');
    const {blockRules, inlineRules} = convertRuleFormat(rules);

    const initalAST: AST = [trimmed];
    const afterBlockRules: AST = flatMap(initalAST, node => nodeParser(node, blockRules, false));
    const afterInlineRules: AST = flatMap(afterBlockRules, node => nodeParser(node, inlineRules, true));

    return flatMap(afterInlineRules, simplify);
}

export function build(ast: AST, rules: Array<Rule>): ReactElement<{}> {
    const ruleMap = rules.reduce((acc, rule) => ({...acc, [rule.name]: rule}), {});
    const nodes = ast.map((node, i) => internalBuild(ast, ruleMap, node, i));
    return createElement(Fragment, {}, nodes);
}
