import * as Utils from '../src/utils';
import {AST, ASTNode} from "../src";

describe('utils', () => {
    describe('match', () => {
        it('should return null if there is no match', () => {
            expect(Utils.match(/aa/, 'bb')).toBeNull();
        });

        it('should convert regex-match-object to RegexMatch', () => {
            expect(Utils.match(/^aa (.+) bb/, 'aa abba bb extra')).toMatchObject({
                fullmatch: 'aa abba bb',
                capture: ['abba'],
                index: 0,
                input: 'aa abba bb extra'
            });
        });
    });

    describe('getText', () => {
        it('should handle string values', () => {
            expect(Utils.getText('string')).toBe('string');
        });

        it ('should handle ASTNode values', () => {
            const astnode : ASTNode = {
                name: '',
                content: [
                    'first',
                    { name: '', content: ['.second.']},
                    'third'
                ]
            };

            expect(Utils.getText(astnode)).toBe('first.second.third');
        });

        it ('should handle AST values', () => {
            const ast : AST = [
                'first',
                { name: '', content: ['.second.']},
                'third'
            ];

            expect(Utils.getText(ast)).toBe('first.second.third');
        });
    });
});