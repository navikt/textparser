# Textparser - Simple regex-based parser

Parses text into an AST given a set of regex-based rules. 

## Usage
```typescript
import React from 'react';
import { parse, build, AST, ParagraphRule, LinebreakRule, LinkRule } from '@navikt/textparser'

const rules = [ParagraphRule, LinebreakRule, LinkRule];
const textFromUser : string = '...';
const ast : AST = parse(textFromUser, rules);

const reactOutput : React.ReactElement<{}> = build(ast, rules);
``` 

## Creating your own rule
Rules are split into two group; block-rules and inline-rules. 
Block-rules are useful when working with structures spanning multiple lines, e.g paragraphs, lists, tables etc.
Whereas inline-rules are useful can be used to implement bold, italics, linking etc. Take a look at [the predefined rules](src/rules.ts) for more inspiration.

```typescript
type Rule = {
    name: string;
    scope: RuleScope;
    regex: RegExp;
    parse(match: RegexMatch): ASTNode;
    react(node: ASTNode): ReactElementDescription;
}

const atRule = {
  name: 'atRule',
  scope: RuleScope.INLINE,
  regex: /\s?@(\w+)/,
  parse(match): ASTNode {
    return { name: 'atRule', content: [match.capture[0]] }
  },
  react(node: ASTNode): ReactElementDescription {
    return { type: 'a', props: { href: `https://url.com?user=${Utils.getText(node)}` } }
  }
};
```

## Customizing existing rule
```typescript
import * as Utils from '@navikt/textparser';
import { Link } from 'react-router';
 
const customLinkRule: Rule = {
    ...LinkRule,
    react(node: string | { name: string; content: AST }): ReactElementDescription {
        return {type: Link, props: {className: 'paragraph-class', to: Utils.getText(node) }}
    }
};
``` 

## AST showcase
**INPUT**

```
This *is* a paragraph.

This is another.

This has *highlighting*.

This is _bold_.

This has links www.google.com, *https://www.yahoo.com*, _http://www.bing.com_

And here we combine them *_highlight bold_*, and reversed _*highlight bold*_, with links; _*www.google.com*_ *_https://yahoo.com_*

The last paragraph
spans multiple lines.
```

**OUTPUT**
```
[
  {
    "name": "Paragraph",
    "content": [
      "This ",
      {
        "name": "Highlight",
        "content": [
          "is"
        ]
      },
      " a paragraph."
    ]
  },
  {
    "name": "Paragraph",
    "content": [
      "This is another."
    ]
  },
  {
    "name": "Paragraph",
    "content": [
      "This has ",
      {
        "name": "Highlight",
        "content": [
          "highlighting"
        ]
      },
      "."
    ]
  },
  {
    "name": "Paragraph",
    "content": [
      "This is ",
      {
        "name": "Bold",
        "content": [
          "bold"
        ]
      },
      "."
    ]
  },
  {
    "name": "Paragraph",
    "content": [
      "This has links ",
      {
        "name": "Link",
        "content": [
          "www.google.com"
        ]
      },
      ", ",
      {
        "name": "Highlight",
        "content": [
          {
            "name": "Link",
            "content": [
              "https://www.yahoo.com"
            ]
          }
        ]
      },
      ", ",
      {
        "name": "Link",
        "content": [
          {
            "name": "Bold",
            "content": [
              "http://www.bing.com"
            ]
          }
        ]
      }
    ]
  },
  {
    "name": "Paragraph",
    "content": [
      "And here we combine them ",
      {
        "name": "Highlight",
        "content": [
          {
            "name": "Bold",
            "content": [
              "highlight bold"
            ]
          }
        ]
      },
      ", and reversed ",
      {
        "name": "Bold",
        "content": [
          {
            "name": "Highlight",
            "content": [
              "highlight bold"
            ]
          }
        ]
      },
      ", with links; ",
      {
        "name": "Bold",
        "content": [
          {
            "name": "Highlight",
            "content": [
              {
                "name": "Link",
                "content": [
                  "www.google.com"
                ]
              }
            ]
          }
        ]
      },
      " ",
      {
        "name": "Highlight",
        "content": [
          {
            "name": "Link",
            "content": [
              {
                "name": "Bold",
                "content": [
                  "https://yahoo.com"
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "name": "Paragraph",
    "content": [
      "The last paragraph",
      {
        "name": "Linebreak",
        "content": []
      },
      "spans multiple lines."
    ]
  }
]
```
