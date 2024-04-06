"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _transform = _interopRequireDefault(require("../transform"));

var _gen = require("../../util/gen");

var _insert = require("../../util/insert");

var _compare = require("../../util/compare");

var _order = require("../../order");

var _stringConcealing = require("../string/stringConcealing");

var _probability = require("../../probability");

var _assert = require("assert");

var _random = require("../../util/random");

var _traverse = require("../../traverse");

var _identifiers = require("../../util/identifiers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * [Duplicate Literals Removal](https://docs.jscrambler.com/code-integrity/documentation/transformations/duplicate-literals-removal) replaces duplicate literals with a variable name.
 *
 * - Potency Medium
 * - Resilience Medium
 * - Cost Medium
 *
 * ```js
 * // Input
 * var foo = "http://www.example.xyz";
 * bar("http://www.example.xyz");
 *
 * // Output
 * var a = "http://www.example.xyz";
 * var foo = a;
 * bar(a);
 * ```
 */
class DuplicateLiteralsRemoval extends _transform.default {
  // The array holding all the duplicate literals
  // The array expression node to be inserted into the program

  /**
   * Literals in the array
   */

  /**
   * Literals are saved here the first time they are seen.
   */

  /**
   * Block -> { functionName, indexShift }
   */
  constructor(o) {
    super(o, _order.ObfuscateOrder.DuplicateLiteralsRemoval);

    _defineProperty(this, "arrayName", void 0);

    _defineProperty(this, "arrayExpression", void 0);

    _defineProperty(this, "map", void 0);

    _defineProperty(this, "first", void 0);

    _defineProperty(this, "functions", void 0);

    this.map = new Map();
    this.first = new Map();
    this.functions = new Map();
  }

  apply(tree) {
    super.apply(tree);

    if (this.arrayName && this.arrayExpression.elements.length > 0) {
      // This function simply returns the array
      var getArrayFn = this.getPlaceholder();
      (0, _insert.append)(tree, (0, _gen.FunctionDeclaration)(getArrayFn, [], [(0, _gen.ReturnStatement)(this.arrayExpression)])); // This variable holds the array

      (0, _insert.prepend)(tree, (0, _gen.VariableDeclaration)((0, _gen.VariableDeclarator)(this.arrayName, (0, _gen.CallExpression)((0, _gen.MemberExpression)((0, _gen.Identifier)(getArrayFn), (0, _gen.Literal)("call"), true), [(0, _gen.ThisExpression)()])))); // Create all the functions needed

      for (var blockNode of this.functions.keys()) {
        var {
          functionName,
          indexShift
        } = this.functions.get(blockNode);
        var propertyNode = (0, _gen.BinaryExpression)("-", (0, _gen.Identifier)("index_param"), (0, _gen.Literal)(indexShift));
        var indexRangeInclusive = [0 + indexShift - 1, this.map.size + indexShift]; // The function uses mangling to hide the index being accessed

        var mangleCount = (0, _random.getRandomInteger)(1, 10);

        for (var i = 0; i < mangleCount; i++) {
          var operator = (0, _random.choice)([">", "<"]);
          var compareValue = (0, _random.choice)(indexRangeInclusive);
          var test = (0, _gen.BinaryExpression)(operator, (0, _gen.Identifier)("index_param"), (0, _gen.Literal)(compareValue));
          var alternate = (0, _gen.BinaryExpression)("-", (0, _gen.Identifier)("index_param"), (0, _gen.Literal)((0, _random.getRandomInteger)(-100, 100)));
          var testValue = operator === ">" && compareValue === indexRangeInclusive[0] || operator === "<" && compareValue === indexRangeInclusive[1];
          propertyNode = (0, _gen.ConditionalExpression)(test, testValue ? propertyNode : alternate, !testValue ? propertyNode : alternate);
        }

        var returnArgument = (0, _gen.MemberExpression)((0, _gen.Identifier)(this.arrayName), propertyNode, true);
        (0, _insert.prepend)(blockNode, (0, _gen.FunctionDeclaration)(functionName, [(0, _gen.Identifier)("index_param")], [(0, _gen.ReturnStatement)(returnArgument)]));
      }
    }
  }

  match(object, parents) {
    return (0, _compare.isPrimitive)(object) && !(0, _compare.isDirective)(object, parents) && !(0, _stringConcealing.isModuleSource)(object, parents) && !parents.find(x => x.$dispatcherSkip);
  }
  /**
   * Converts ordinary literal to go through a getter function.
   * @param object
   * @param parents
   * @param index
   */


  transformLiteral(object, parents, index) {
    var blockNode = (0, _random.choice)(parents.filter(x => this.functions.has(x))); // Create initial function if none exist

    if (this.functions.size === 0) {
      var root = parents[parents.length - 1];
      var rootFunctionName = this.getPlaceholder() + "_dLR_0";
      this.functions.set(root, {
        functionName: rootFunctionName,
        indexShift: (0, _random.getRandomInteger)(-100, 100)
      });
      blockNode = root;
    } // If no function here exist, possibly create new chained function


    var block = (0, _traverse.getBlock)(object, parents);

    if (!this.functions.has(block) && (0, _random.chance)(50 - this.functions.size)) {
      var newFunctionName = this.getPlaceholder() + "_dLR_" + this.functions.size;
      this.functions.set(block, {
        functionName: newFunctionName,
        indexShift: (0, _random.getRandomInteger)(-100, 100)
      });
      blockNode = block;
    } // Derive the function to call from the selected blockNode


    var {
      functionName,
      indexShift
    } = this.functions.get(blockNode); // Call the function given it's indexShift

    var callExpression = (0, _gen.CallExpression)((0, _gen.Identifier)(functionName), [(0, _gen.Literal)(index + indexShift)]);
    this.replaceIdentifierOrLiteral(object, callExpression, parents);
  }

  transform(object, parents) {
    return () => {
      if (object.type === "Identifier") {
        var info = (0, _identifiers.getIdentifierInfo)(object, parents);
        if (info.isLabel || info.spec.isDefined) return;
      }

      if (object.regex) {
        return;
      }

      if (!(0, _probability.ComputeProbabilityMap)(this.options.duplicateLiteralsRemoval)) {
        return;
      } // HARD CODED LIMIT of 10,000 (after 1,000 elements)


      if (this.map.size > 1000 && (0, _random.chance)(this.map.size / 100)) return;

      if (this.arrayName && parents[0].object && parents[0].object.name == this.arrayName) {
        return;
      }

      var stringValue;

      if (object.type == "Literal") {
        stringValue = typeof object.value + ":" + object.value;

        if (object.value === null) {
          stringValue = "null:null";
        } else {
          // Skip empty strings
          if (typeof object.value === "string" && !object.value) {
            return;
          }
        }
      } else if (object.type == "Identifier") {
        stringValue = "identifier:" + object.name;
      } else {
        throw new Error("Unsupported primitive type: " + object.type);
      }

      (0, _assert.ok)(stringValue);

      if (this.map.has(stringValue) || this.first.has(stringValue)) {
        // Create the array if not already made
        if (!this.arrayName) {
          this.arrayName = this.getPlaceholder();
          this.arrayExpression = (0, _gen.ArrayExpression)([]);
        } // Delete with first location


        var firstLocation = this.first.get(stringValue);

        if (firstLocation) {
          var index = this.map.size;
          (0, _assert.ok)(!this.map.has(stringValue));
          this.map.set(stringValue, index);
          this.first.delete(stringValue);
          var pushing = (0, _insert.clone)(object);
          this.arrayExpression.elements.push(pushing);
          (0, _assert.ok)(this.arrayExpression.elements[index] === pushing);
          this.transformLiteral(firstLocation[0], firstLocation[1], index);
        }

        var index = this.map.get(stringValue);
        (0, _assert.ok)(typeof index === "number");
        this.transformLiteral(object, parents, index);
        return;
      } // Save this, maybe a duplicate will be found.


      this.first.set(stringValue, [object, parents]);
    };
  }

}

exports.default = DuplicateLiteralsRemoval;