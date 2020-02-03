import {
    ASTNode,
    BoldRule,
    createDynamicHighligtingRule,
    HighlightRule,
    LinebreakRule,
    LinkRule,
    ParagraphRule,
    RegexMatch,
    RuleScope
} from "../src";
import {match} from "../src/utils";

const matched: RegexMatch = {
    fullmatch: '',
    capture: [],
    index: 0,
    input: ''
};
describe('rules', () => {
    describe('linebreak', () => {
        it('should have basic config', () => {
            expect(LinebreakRule.name).toBe('Linebreak');
            expect(LinebreakRule.scope).toBe(RuleScope.INLINE);
            expect(LinebreakRule.parse(matched)).toEqual({
                name: 'Linebreak',
                content: []
            });
            expect(LinebreakRule.react('', [])).toEqual({
                type: 'br'
            });
        });

        it('should not match newline followed by newline', () => {
            expect(LinebreakRule.regex.exec('\n')?.index).toBe(0);
            expect(LinebreakRule.regex.exec('\n\na\n\n\n')?.index).toBe(1);
            expect(LinebreakRule.regex.exec('\n\n\n\n\n')?.index).toBe(4);
        });
    });

    describe('paragraph', () => {
        it('should have basic config', () => {
            expect(ParagraphRule.name).toBe('Paragraph');
            expect(ParagraphRule.scope).toBe(RuleScope.BLOCK);
            expect(ParagraphRule.parse({...matched, capture: ['Content here']})).toEqual({
                name: 'Paragraph',
                content: ['Content here']
            });
            expect(ParagraphRule.react('', [])).toEqual({
                type: 'p'
            });
        });

        it('should match double-newlines', () => {
            expect(match(ParagraphRule.regex, 'First\n\nSecond')).toMatchObject({
                fullmatch: 'First\n\n',
                capture: ['First']
            });
            expect(match(ParagraphRule.regex, 'First\n\n\n\nSecond')).toMatchObject({
                fullmatch: 'First\n\n\n\n',
                capture: ['First']
            });
            expect(match(ParagraphRule.regex, 'First\nAndMore\n\nSecond')).toMatchObject({
                fullmatch: 'First\nAndMore\n\n',
                capture: ['First\nAndMore']
            });
            expect(match(ParagraphRule.regex, 'Second')).toMatchObject({
                fullmatch: 'Second',
                capture: ['Second']
            });
            expect(match(ParagraphRule.regex, '')).toBeNull();
        });
    });

    describe('highlight', () => {
        it('should have basic config', () => {
            expect(HighlightRule.name).toBe('Highlight');
            expect(HighlightRule.scope).toBe(RuleScope.INLINE);
            expect(HighlightRule.parse({...matched, capture: ['Content here']})).toEqual({
                name: 'Highlight',
                content: ['Content here']
            });
            expect(HighlightRule.react('', [])).toEqual({
                type: 'em'
            });
        });

        it('should match single star', () => {
            expect(match(HighlightRule.regex, 'First *Second* Third')).toMatchObject({
                fullmatch: '*Second*',
                capture: ['Second']
            });
            expect(match(HighlightRule.regex, 'First **Second* Third*')).toMatchObject({
                fullmatch: '*Second*',
                capture: ['Second']
            });
            expect(match(HighlightRule.regex, '*First *Second** Third')).toMatchObject({
                fullmatch: '*First *',
                capture: ['First ']
            });
            expect(match(HighlightRule.regex, 'First **Second** Third')).toBeNull();
            expect(match(HighlightRule.regex, 'Second')).toBeNull();
        });
    });

    describe('dynamicHighlight', () => {
        it('should have basic config', () => {
            const rule = createDynamicHighligtingRule([]);
            expect(rule.name).toBe('DynamicHighlight');
            expect(rule.scope).toBe(RuleScope.INLINE);
            expect(rule.parse({...matched, capture: ['Content here']})).toEqual({
                name: 'DynamicHighlight',
                content: ['Content here']
            });
            expect(rule.react('', [])).toEqual({
                type: 'em'
            });
        });

        it('should be escape regex-tokens', () => {
            const scaryTokenlist = '-[\]{}()*+?.,^$|#';
            const safeTokenlist = scaryTokenlist
                .split('')
                .map((token) => `\\${token}`)
                .join('');
            expect(createDynamicHighligtingRule([scaryTokenlist]).regex.toString()).toContain(safeTokenlist);
        });

        it('it should use word-boundries to highlight', () => {
            expect(match(createDynamicHighligtingRule(['ll']).regex, 'good hello world')).toMatchObject({
                fullmatch: 'hello',
                capture: ['hello']
            });
        });
    });

    describe('bold', () => {
        it('should have basic config', () => {
            expect(BoldRule.name).toBe('Bold');
            expect(BoldRule.scope).toBe(RuleScope.INLINE);
            expect(BoldRule.parse({...matched, capture: ['Content here']})).toEqual({
                name: 'Bold',
                content: ['Content here']
            });
            expect(BoldRule.react('', [])).toEqual({
                type: 'b'
            });
        });

        it('should match single underscore', () => {
            expect(match(BoldRule.regex, 'First _Second_ Third')).toMatchObject({
                fullmatch: '_Second_',
                capture: ['Second']
            });
            expect(match(BoldRule.regex, 'First __Second_ Third_')).toMatchObject({
                fullmatch: '_Second_',
                capture: ['Second']
            });
            expect(match(BoldRule.regex, '_First _Second__ Third')).toMatchObject({
                fullmatch: '_First _',
                capture: ['First ']
            });
            expect(match(BoldRule.regex, 'First __Second__ Third')).toBeNull();
            expect(match(BoldRule.regex, 'Second')).toBeNull();
        });
    });

    describe('link', () => {
        it('should have basic config', () => {
            expect(LinkRule.name).toBe('Link');
            expect(LinkRule.scope).toBe(RuleScope.INLINE);
            expect(LinkRule.parse({...matched, capture: ['Content here']})).toEqual({
                name: 'Link',
                content: ['Content here']
            });
            expect(LinkRule.react({name: 'Link', content: ['url.com']}, [])).toEqual({
                type: 'a',
                props: {target: '_blank', rel: 'noopener', href: 'https://url.com'}
            });
        });

        it('should autoprefix urls with https', () => {
            const astnode: ASTNode = {
                name: 'N/A',
                content: [
                    'www.',
                    {name: 'Bold', content: ['domain']},
                    '.com'
                ]
            };
            expect(LinkRule.react(astnode, [])).toMatchObject({
                type: 'a',
                props: {
                    href: 'https://www.domain.com',
                    target: '_blank',
                    rel: 'noopener'
                }
            });
        });

        it('should not autoprefix urls with predefined protocol', () => {
            const astnode: ASTNode = {
                name: 'N/A',
                content: [
                    'http://',
                    'www.',
                    {name: 'Bold', content: ['domain']},
                    '.com'
                ]
            };
            expect(LinkRule.react(astnode, [])).toMatchObject({
                type: 'a',
                props: {
                    href: 'http://www.domain.com',
                    target: '_blank',
                    rel: 'noopener'
                }
            });
        });

        it('should detect urls with minimal information', () => {
            expect(match(LinkRule.regex, 'data https://www.domain.com data')).toMatchObject({
                fullmatch: 'https://www.domain.com',
                capture: ['https://www.domain.com']
            });
            expect(match(LinkRule.regex, 'data http://www.domain.com data')).toMatchObject({
                fullmatch: 'http://www.domain.com',
                capture: ['http://www.domain.com']
            });
            expect(match(LinkRule.regex, 'data www.domain.com data')).toMatchObject({
                fullmatch: 'www.domain.com',
                capture: ['www.domain.com']
            });
            expect(match(LinkRule.regex, 'data domain.com data')).toBeNull();
        });
    });
});