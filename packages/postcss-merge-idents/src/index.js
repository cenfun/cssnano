'use strict';
const valueParser = require('postcss-value-parser');
const { sameParent } = require('cssnano-utils');

function canonical(obj) {
  // Prevent potential infinite loops
  let stack = 50;

  return function recurse(key) {
    if (
      Object.prototype.hasOwnProperty.call(obj, key) &&
      obj[key] !== key &&
      stack
    ) {
      stack--;

      return recurse(obj[key]);
    }

    stack = 50;

    return key;
  };
}
/**
 * @param {import('postcss').Root} css
 * @return {void}
 */
function mergeAtRules(css) {
  const pairs = [
    {
      atrule: /keyframes/i,
      decl: /animation/i,
      /** @type {import('postcss').AtRule[]} */
      cache: [],
      replacements: {},
      /** @type {import('postcss').Declaration[]} */
      decls: [],
      /** @type {import('postcss').AtRule[]} */
      removals: [],
    },
    {
      atrule: /counter-style/i,
      decl: /(list-style|system)/i,
      cache: [],
      replacements: {},
      decls: [],
      removals: [],
    },
  ];

  let relevant;

  css.walk((node) => {
    if (node.type === 'atrule') {
      relevant = pairs.filter((pair) =>
        pair.atrule.test(node.name.toLowerCase())
      )[0];

      if (!relevant) {
        return;
      }

      if (relevant.cache.length < 1) {
        relevant.cache.push(node);
        return;
      } else {
        let toString = node.nodes.toString();

        relevant.cache.forEach((cached) => {
          if (
            cached.name.toLowerCase() === node.name.toLowerCase() &&
            sameParent(cached, node) &&
            cached.nodes.toString() === toString
          ) {
            relevant.removals.push(cached);
            relevant.replacements[cached.params] = node.params;
          }
        });

        relevant.cache.push(node);

        return;
      }
    }

    if (node.type === 'decl') {
      relevant = pairs.filter((pair) =>
        pair.decl.test(node.prop.toLowerCase())
      )[0];

      if (!relevant) {
        return;
      }

      relevant.decls.push(node);
    }
  });

  pairs.forEach((pair) => {
    let canon = canonical(pair.replacements);

    pair.decls.forEach((decl) => {
      decl.value = valueParser(decl.value)
        .walk((node) => {
          if (node.type === 'word') {
            node.value = canon(node.value);
          }
        })
        .toString();
    });
    pair.removals.forEach((cached) => cached.remove());
  });
}

function pluginCreator() {
  return {
    postcssPlugin: 'postcss-merge-idents',

    OnceExit(css) {
      mergeAtRules(css);
    },
  };
}

pluginCreator.postcss = true;
module.exports = pluginCreator;
