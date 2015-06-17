/**
 * MathML semantics description in accessibility taxonomy terms.
 */
'use strict';

var MathMLRels = {
  supersript: 'msup > :last-child',
  subscript: 'msub > :last-child'
};

var MathMLSemantics = {
  mfrac: {
    match: 'mfrac',
    role: 'fraction',
    rels: {
      __proto__: MathMLRels,
      numerator: ':first-child',
      denominator: ':last-child'
    }
  },
  mi: {
    match: 'mi',
    text: ':content',
    rels: MathMLRels
  },
  mn: {
    match: 'mn',
    text: ':content',
    rels: MathMLRels
  }
};
