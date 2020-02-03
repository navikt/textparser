import {renderToStaticMarkup} from 'react-dom/server';
import {
    AST,
    BoldRule,
    build,
    HighlightRule,
    LinebreakRule,
    LinkRule,
    ParagraphRule,
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

Best regards
Your name
Your office
`.trim();

const rules: Array<Rule> = [HighlightRule, BoldRule, LinkRule, LinebreakRule, ParagraphRule];
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
                content: ['Best regards', {name: 'Linebreak'}, 'Your name', {name: 'Linebreak'}, 'Your office']
            }
        ]);
    });

    it('should handle empty ruleset', () => {
        const ast = parse(example, []);
        expect(ast).toMatchObject([example]);
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
        const customRules = [HighlightRule, BoldRule, LinkRule, LinebreakRule, customParagraphRule];

        const reactnodes = build(parse(example, customRules), customRules);
        const markup = renderToStaticMarkup(reactnodes);
        let expected = `
            <p class="paragraph-class">Hey Name Lastname,</p>
            <p class="paragraph-class">Follow these simple steps:<br/>
                - goto webpage: <a href="https://www.url.no/registry" target="_blank" rel="noopener">www.url.no/registry</a><br/>
                - send <b><em>data</em></b><br/>
                - <em>wait</em> for the reply
            </p>
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