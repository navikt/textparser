import {renderToStaticMarkup} from 'react-dom/server';
import {
    AST,
    BoldRule,
    build,
    HighlightRule,
    LinebreakRule,
    LinkRule,
    ParagraphRule,
    BulletRule,
    parse,
    ReactElementDescription,
    Rule
} from "../src";

const example = `
Hey Name Lastname,

Follow these simple steps:
- goto webpage: www.url.no/registry
- send _*data*_
- *wait* for the reply

And these:

* goto webpage: www.url.no/registry
* send _*data*_
* *wait* for the reply

Best regards
Your name
Your office
`.trim();
const example2 = `
This is the first paragraph

This is the second paragraph
`.trim()

const rules: Array<Rule> = [HighlightRule, BoldRule, LinkRule, LinebreakRule, BulletRule, ParagraphRule];
const whitespace = /\s/g;

describe('textparser - parse', () => {
    it('should handle all predefined rules', () => {
        const ast = parse(example, rules);
        expect(ast).toMatchObject([
            {name: 'Paragraph', content: ['Hey Name Lastname,']},
            {
                name: 'Paragraph',
                content: [
                    'Follow these simple steps:',
                    {name: 'Linebreak'},
                    '- goto webpage: ',
                    {name: 'Link', content: ['www.url.no/registry']},
                    {name: 'Linebreak'},
                    '- send ',
                    {name: 'Bold', content: [{name: 'Highlight', content: ['data']}]},
                    {name: 'Linebreak'},
                    '- ',
                    {name: 'Highlight', content: ['wait']},
                    ' for the reply'
                ]
            },
            {
                name: 'Paragraph',
                content: ['And these:']
            },
            {
                name: 'Bullets',
                content: [
                    {
                        name: 'Bullets__element', content: [
                            'goto webpage: ',
                            {name: 'Link', content: ['www.url.no/registry']}
                        ]
                    },
                    {
                        name: 'Bullets__element', content: [
                            'send ',
                            {name: 'Bold', content: [{name: 'Highlight', content: ['data']}]}
                        ]
                    },
                    {
                        name: 'Bullets__element', content: [
                            {name: 'Highlight', content: ['wait']},
                            ' for the reply'
                        ]
                    }
                ]
            },
            {
                name: 'Paragraph',
                content: ['Best regards', {name: 'Linebreak'}, 'Your name', {name: 'Linebreak'}, 'Your office']
            }
        ]);
    });

    it('should handle empty ruleset', () => {
        const ast = parse(example, []);
        expect(ast).toMatchObject([example]);
    });

    it('should not recurse block-rules', () => {
        const customParagraphRule: Rule = {
            ...ParagraphRule,
            name: 'custom-paragraph',
            react(node: string | { name: string; content: AST }): ReactElementDescription {
                return {type: 'p', props: {className: 'paragraph-class'}}
            }
        };

        const customRules = [ParagraphRule, customParagraphRule];
        const ast = parse(example2, customRules);
        expect(ast).toMatchObject([
            {
                name: 'Paragraph',
                content: ['This is the first paragraph']
            },
            {
                name: 'Paragraph',
                content: ['This is the second paragraph']
            }
        ]);
    });
});

describe('textparser - build', () => {
    it('should handle all predefined rules', () => {
        const reactnodes = build(parse(example, rules), rules);
        const markup = renderToStaticMarkup(reactnodes);
        let expected = `
            <p>Hey Name Lastname,</p>
            <p>Follow these simple steps:<br/>
                - goto webpage: <a href="https://www.url.no/registry" target="_blank" rel="noopener">www.url.no/registry</a><br/>
                - send <b><em>data</em></b><br/>
                - <em>wait</em> for the reply
            </p>
            <p>And these:</p>
            <ul>
                <li>goto webpage: <a href="https://www.url.no/registry" target="_blank" rel="noopener">www.url.no/registry</a></li>            
                <li>send <b><em>data</em></b></li>            
                <li><em>wait</em> for the reply</li>            
            </ul>
            <p>Best regards<br/>
                Your name<br/>
                Your office
            </p>
        `;

        expect(markup.replace(whitespace, '')).toBe(expected.replace(whitespace, ''));
    });

    it('should be easy to extend', () => {
        const customParagraphRule: Rule = {
            ...ParagraphRule,
            react(node: string | { name: string; content: AST }): ReactElementDescription {
                return {type: 'p', props: {className: 'paragraph-class'}}
            }
        };
        const customRules = [HighlightRule, BoldRule, LinkRule, LinebreakRule, BulletRule, customParagraphRule];

        const reactnodes = build(parse(example, customRules), customRules);
        const markup = renderToStaticMarkup(reactnodes);
        let expected = `
            <p class="paragraph-class">Hey Name Lastname,</p>
            <p class="paragraph-class">Follow these simple steps:<br/>
                - goto webpage: <a href="https://www.url.no/registry" target="_blank" rel="noopener">www.url.no/registry</a><br/>
                - send <b><em>data</em></b><br/>
                - <em>wait</em> for the reply
            </p>
            <p class="paragraph-class">And these:</p>
            <ul>
                <li>goto webpage: <a href="https://www.url.no/registry" target="_blank" rel="noopener">www.url.no/registry</a></li>            
                <li>send <b><em>data</em></b></li>            
                <li><em>wait</em> for the reply</li>            
            </ul>
            <p class="paragraph-class">Best regards<br/>
                Your name<br/>
                Your office
            </p>
        `;

        expect(markup.replace(whitespace, '')).toBe(expected.replace(whitespace, ''));
    });

    it('should handle empty ruleset', () => {
        const reactnodes = build(parse(example, []), []);
        const markup = renderToStaticMarkup(reactnodes);
        expect(markup).toBe(example);
    });
});
