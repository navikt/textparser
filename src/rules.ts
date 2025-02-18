import {ASTNode, ReactElementDescription, RegexMatch, Rule, RuleScope} from './domain';
import { getText } from './utils';

export const LinebreakRule: Rule = {
    name: 'Linebreak',
    scope: RuleScope.INLINE,
    regex:  /\n|\\n/g,
    parse(match: RegexMatch): ASTNode {
        return {
            name: this.name,
            content: []
        };
    },
    react(node: ASTNode): ReactElementDescription {
        return {
            type: 'br'
        };
    }
};

export const ParagraphRule: Rule = {
    name: 'Paragraph',
    scope: RuleScope.BLOCK,
    regex: /((?:.|\s)+?)(?:\n{2,}|$)/,
    parse(match: RegexMatch): ASTNode {
        return {
            name: this.name,
            content: [match.capture[0]]
        };
    },
    react(node: ASTNode): ReactElementDescription {
        return {
            type: 'p'
        };
    }
};

export const HighlightRule: Rule = {
    name: 'Highlight',
    scope: RuleScope.INLINE,
    regex: /\*([^*]+?)\*(?!\*)/,
    parse(match: RegexMatch): ASTNode {
        return {
            name: this.name,
            content: [match.capture[0]]
        };
    },
    react(node: ASTNode): ReactElementDescription {
        return {
            type: 'em'
        };
    }
};

function escapeRegExp(text: string): string {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export function createDynamicHighlightingRule(query: string[]): Rule {
    const queryPattern = query
        .filter(word => word.length > 0)
        .map(escapeRegExp)
        .join('|');
    const regex = queryPattern.length > 0 ? RegExp(`(\\b\\S*(?:${queryPattern})\\S*\\b)`, 'i') : /\\u0000/;
    return {
        name: 'DynamicHighlight',
        scope: RuleScope.INLINE,
        regex,
        parse(match: RegexMatch): ASTNode {
            return {
                name: this.name,
                content: [match.capture[0]]
            };
        },
        react(node: ASTNode): ReactElementDescription {
            return {
                type: 'em'
            };
        }
    };
}

export const BoldRule: Rule = {
    name: 'Bold',
    scope: RuleScope.INLINE,
    regex: /_([^_]+?)_(?!_)/,
    parse(match: RegexMatch): ASTNode {
        return {
            name: this.name,
            content: [match.capture[0]]
        };
    },
    react(node: ASTNode): ReactElementDescription {
        return {
            type: 'b'
        };
    }
};

export const LinkRule: Rule = {
    name: 'Link',
    scope: RuleScope.INLINE,
    regex: /((?:[\w-]+:\/\/?|www(?:-\w+)?\.)[^\s()<>]+(?:\.(?!\s))?\w+)/,
    startsWithHttp: /^(https?):\/\/.*$/,
    parse(match: RegexMatch): ASTNode {
        return {
            name: this.name,
            content: [match.capture[0]]
        };
    },
    react(node: ASTNode): ReactElementDescription {
        const text = getText(node);
        const href = this.startsWithHttp.test(text) ? text : `https://${text}`;

        return {
            type: 'a',
            props: { href, target: '_blank', rel: 'noopener' }
        };
    }
};

export const BulletRule: Rule = {
    name: 'Bullets',
    scope: RuleScope.BLOCK,
    regex: /((?:^|\n)(?:\*\s[^\n]+(?:\n+|$))+)/,
    parse(match: RegexMatch): ASTNode {
        const content: Array<ASTNode> = match.capture[0]
            .split('\n')
            .filter((line) => line.length > 0)
            .map((line) => line.replace(/^\*\s+/, ''))
            .map((line) => ({ name: `${this.name}__element`, content: [line] }));

        return {
            name: this.name,
            content
        }
    },
    react(node: ASTNode): ReactElementDescription {
        return { type: 'ul' }
    },
    extraRenderers: {
        'Bullets__element': (node: ASTNode): ReactElementDescription => {
            return { type: 'li' }
        }
    }
}
