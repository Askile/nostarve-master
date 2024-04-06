"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _transform = _interopRequireDefault(require("../transform"));

var _traverse = require("../../traverse");

var _gen = require("../../util/gen");

var _insert = require("../../util/insert");

var _assert = require("assert");

var _order = require("../../order");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Defines all the names at the top of every lexical block.
 */
class MovedDeclarations extends _transform.default {
  constructor(o) {
    super(o, _order.ObfuscateOrder.MovedDeclarations);
  }

  match(object, parents) {
    return object.type === "VariableDeclaration" && object.kind === "var" && object.declarations.length === 1 && object.declarations[0].id.type === "Identifier";
  }

  transform(object, parents) {
    return () => {
      var forInitializeType = (0, _insert.isForInitialize)(object, parents); // Get the block statement or Program node

      var blockIndex = parents.findIndex(x => (0, _traverse.isBlock)(x));
      var block = parents[blockIndex];
      var body = block.body;
      var bodyObject = parents[blockIndex - 2] || object; // Make sure in the block statement, and not already at the top of it

      var index = body.indexOf(bodyObject);
      if (index === -1 || index === 0) return;
      var topVariableDeclaration;

      if (body[0].type === "VariableDeclaration" && body[0].kind === "var") {
        topVariableDeclaration = body[0];
      } else {
        topVariableDeclaration = {
          type: "VariableDeclaration",
          declarations: [],
          kind: "var"
        };
        (0, _insert.prepend)(block, topVariableDeclaration);
      }

      var varName = object.declarations[0].id.name;
      (0, _assert.ok)(typeof varName === "string"); // Add `var x` at the top of the block

      topVariableDeclaration.declarations.push((0, _gen.VariableDeclarator)((0, _gen.Identifier)(varName)));
      var assignmentExpression = (0, _gen.AssignmentExpression)("=", (0, _gen.Identifier)(varName), object.declarations[0].init || (0, _gen.Identifier)(varName));

      if (forInitializeType) {
        if (forInitializeType === "initializer") {
          // Replace `for (var i = 0...)` to `for (i = 0...)`
          this.replace(object, assignmentExpression);
        } else if (forInitializeType === "left-hand") {
          // Replace `for (var k in...)` to `for (k in ...)`
          this.replace(object, (0, _gen.Identifier)(varName));
        }
      } else {
        // Replace `var x = value` to `x = value`
        this.replace(object, (0, _gen.ExpressionStatement)(assignmentExpression));
      }
    };
  }

}

exports.default = MovedDeclarations;