"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _compiler = require("../compiler");

var _constants = require("../constants");

var _obfuscator = _interopRequireDefault(require("../obfuscator"));

var _order = require("../order");

var _probability = require("../probability");

var _traverse = require("../traverse");

var _gen = require("../util/gen");

var _identifiers = require("../util/identifiers");

var _insert = require("../util/insert");

var _integrity = _interopRequireDefault(require("./lock/integrity"));

var _transform = _interopRequireDefault(require("./transform"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Converts function to `new Function("..code..")` syntax as an alternative to `eval`. Eval is disabled in many environments.
 *
 * `new Function("..code..")` runs in an isolated context, meaning all local variables are undefined and throw errors.
 *
 * Rigorous checks are in place to only include pure functions.
 *
 * `flatten` can attempt to make function reference-less. Recommended to have flatten enabled with RGF.
 */
class RGF extends _transform.default {
  // Array of all the `new Function` calls
  // The name of the array holding all the `new Function` expressions
  constructor(o) {
    super(o, _order.ObfuscateOrder.RGF);

    _defineProperty(this, "arrayExpressionElements", void 0);

    _defineProperty(this, "arrayExpressionName", void 0);

    this.arrayExpressionName = this.getPlaceholder() + "_rgf";
    this.arrayExpressionElements = [];
  }

  apply(tree) {
    super.apply(tree); // Only add the array if there were converted functions

    if (this.arrayExpressionElements.length > 0) {
      (0, _insert.prepend)(tree, (0, _gen.VariableDeclaration)((0, _gen.VariableDeclarator)((0, _gen.Identifier)(this.arrayExpressionName), (0, _gen.ArrayExpression)(this.arrayExpressionElements))));
    }
  }

  match(object, parents) {
    return (object.type === "FunctionDeclaration" || object.type === "FunctionExpression") && // Does not apply to Arrow functions
    !object.async && // Does not apply to async/generator functions
    !object.generator;
  }

  transform(object, parents) {
    var _this$options$lock, _object$id;

    // Discard getter/setter methods
    if (parents[0].type === "Property" && parents[0].value === object) {
      if (parents[0].method || parents[0].kind === "get" || parents[0].kind === "set") {
        return;
      }
    } // Discard class methods


    if (parents[0].type === "MethodDefinition" && parents[0].value === object) {
      return;
    } // Avoid applying to the countermeasures function


    if (typeof ((_this$options$lock = this.options.lock) === null || _this$options$lock === void 0 ? void 0 : _this$options$lock.countermeasures) === "string") {
      // function countermeasures(){...}
      if (object.type === "FunctionDeclaration" && object.id.type === "Identifier" && object.id.name === this.options.lock.countermeasures) {
        return;
      } // var countermeasures = function(){...}


      if (parents[0].type === "VariableDeclarator" && parents[0].init === object && parents[0].id.type === "Identifier" && parents[0].id.name === this.options.lock.countermeasures) {
        return;
      }
    } // Check user option


    if (!(0, _probability.ComputeProbabilityMap)(this.options.rgf, x => x, object === null || object === void 0 ? void 0 : (_object$id = object.id) === null || _object$id === void 0 ? void 0 : _object$id.name)) return; // Discard functions that use 'eval' function

    if (object.$requiresEval) return; // Check for 'this', 'arguments' (not allowed!)

    var isIllegal = false;
    (0, _traverse.walk)(object, parents, (o, p) => {
      if (o.type === "ThisExpression" || o.type === "Super" || o.type === "Identifier" && o.name === "arguments") {
        isIllegal = true;
        return "EXIT";
      }
    });
    if (isIllegal) return;
    return () => {
      // Make sure function is 'reference-less'
      var definedMap = new Map();
      var isReferenceLess = true;
      var identifierPreventingTransformation;
      (0, _traverse.walk)(object, parents, (o, p) => {
        if (o.type === "Identifier" && !_constants.reservedIdentifiers.has(o.name) && !this.options.globalVariables.has(o.name)) {
          var info = (0, _identifiers.getIdentifierInfo)(o, p);

          if (!info.spec.isReferenced) {
            return;
          }

          if (info.spec.isDefined) {
            // Add to defined map
            var definingContext = (0, _insert.getDefiningContext)(o, p);

            if (!definedMap.has(definingContext)) {
              definedMap.set(definingContext, new Set([o.name]));
            } else {
              definedMap.get(definingContext).add(o.name);
            }
          } else {
            // This approach is dirty and does not account for hoisted FunctionDeclarations
            var isDefinedAbove = false;

            for (var pNode of p) {
              if (definedMap.has(pNode)) {
                if (definedMap.get(pNode).has(o.name)) {
                  isDefinedAbove = true;
                  break;
                }
              }
            }

            if (!isDefinedAbove) {
              isReferenceLess = false;
              identifierPreventingTransformation = o.name;
              return "EXIT";
            }
          }
        }
      }); // This function is not 'reference-less', cannot be RGF'd

      if (!isReferenceLess) {
        if (object.id) {
          var _object$id2;

          this.log("".concat(object === null || object === void 0 ? void 0 : (_object$id2 = object.id) === null || _object$id2 === void 0 ? void 0 : _object$id2.name, "() cannot be transformed because of ").concat(identifierPreventingTransformation));
        }

        return;
      } // Since `new Function` is completely isolated, create an entire new obfuscator and run remaining transformations.
      // RGF runs early and needs completed code before converting to a string.
      // (^ the variables haven't been renamed yet)


      var obfuscator = new _obfuscator.default({ ...this.options,
        stringEncoding: false,
        compact: true
      });

      if (obfuscator.options.lock) {
        delete obfuscator.options.lock.countermeasures; // Integrity will not recursively apply to RGF'd functions. This is intended.

        var lockTransform = obfuscator.transforms["Lock"];

        if (lockTransform) {
          lockTransform.before = lockTransform.before.filter(beforeTransform => !(beforeTransform instanceof _integrity.default));
        }
      }

      var transforms = obfuscator.array.filter(x => x.priority > this.priority);
      var embeddedFunctionName = this.getPlaceholder();
      var embeddedFunction = {
        type: "FunctionDeclaration",
        id: (0, _gen.Identifier)(embeddedFunctionName),
        body: (0, _gen.BlockStatement)([...object.body.body]),
        params: object.params,
        async: false,
        generator: false
      };
      var tree = {
        type: "Program",
        body: [embeddedFunction, (0, _gen.ReturnStatement)((0, _gen.CallExpression)((0, _gen.MemberExpression)((0, _gen.Identifier)(embeddedFunctionName), (0, _gen.Literal)("apply"), true), [(0, _gen.ThisExpression)(), (0, _gen.Identifier)("arguments")]))]
      };
      transforms.forEach(transform => {
        transform.apply(tree);
      });
      var toString = (0, _compiler.compileJsSync)(tree, obfuscator.options); // new Function(code)

      var newFunctionExpression = (0, _gen.NewExpression)((0, _gen.Identifier)("Function"), [(0, _gen.Literal)(toString)]); // The index where this function is placed in the array

      var newFunctionExpressionIndex = this.arrayExpressionElements.length; // Add it to the array

      this.arrayExpressionElements.push(newFunctionExpression); // The member expression to retrieve this function

      var memberExpression = (0, _gen.MemberExpression)((0, _gen.Identifier)(this.arrayExpressionName), (0, _gen.Literal)(newFunctionExpressionIndex), true); // Replace based on type
      // (1) Function Declaration:
      // - Replace body with call to new function

      if (object.type === "FunctionDeclaration") {
        object.body = (0, _gen.BlockStatement)([(0, _gen.ReturnStatement)((0, _gen.CallExpression)((0, _gen.MemberExpression)(memberExpression, (0, _gen.Literal)("apply"), true), [(0, _gen.ThisExpression)(), (0, _gen.Identifier)("arguments")]))]); // The parameters are no longer needed ('arguments' is used to capture them)

        object.params = [];
        return;
      } // (2) Function Expression:
      // - Replace expression with member expression pointing to new function


      if (object.type === "FunctionExpression") {
        this.replace(object, memberExpression);
        return;
      }
    };
  }

}

exports.default = RGF;