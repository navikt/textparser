import {
    Utils,
    parse,
    build,
    ParagraphRule,
    HighlightRule,
    BoldRule,
    LinkRule,
    LinebreakRule,
    createDynamicHighlightingRule
} from './../src';

describe('index - exports', () => {
    it('should export `parse`', () => {
        expect(parse).not.toBe(null)
    });

    it('should export `build`', () => {
        expect(build).not.toBe(null)
    });

    it('should export `LinebreakRule`', () => {
        expect(LinebreakRule).not.toBe(null)
    });

    it('should export `ParagraphRule`', () => {
        expect(ParagraphRule).not.toBe(null)
    });

    it('should export `HighlightRule`', () => {
        expect(HighlightRule).not.toBe(null)
    });

    it('should export `BoldRule`', () => {
        expect(BoldRule).not.toBe(null)
    });

    it('should export `LinkRule`', () => {
        expect(LinkRule).not.toBe(null)
    });

    it('should export `createDynamicHighlightingRule`', () => {
        expect(createDynamicHighlightingRule).not.toBe(null)
    });

    it('should export `Utils.getText()`', () => {
        expect(Utils.getText).not.toBe(null)
    });
});
