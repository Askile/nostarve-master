"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FunctionLengthTemplate = void 0;

var _template = _interopRequireDefault(require("./template"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Helper function to set `function.length` property.
 */
const FunctionLengthTemplate = (0, _template.default)("\nfunction {name}(functionObject, functionLength){\n  Object[\"defineProperty\"](functionObject, \"length\", {\n    \"value\": functionLength,\n    \"configurable\": true\n  });\n  return functionObject;\n}\n");
exports.FunctionLengthTemplate = FunctionLengthTemplate;