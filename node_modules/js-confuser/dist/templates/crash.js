"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CrashTemplate3 = exports.CrashTemplate2 = exports.CrashTemplate1 = void 0;

var _template = _interopRequireDefault(require("./template"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const CrashTemplate1 = (0, _template.default)("\nvar {var} = \"a\";\nwhile(1){\n    {var} = {var} += \"a\";\n}\n");
exports.CrashTemplate1 = CrashTemplate1;
const CrashTemplate2 = (0, _template.default)("\nwhile(true) {\n    var {var} = 99;\n    for({var} = 99; {var} == {var}; {var} *= {var}) {\n        !{var} && console.log({var});\n        if ({var} <= 10){\n            break;\n        }\n    };\n    if({var} === 100) {\n        {var}--\n    }\n };");
exports.CrashTemplate2 = CrashTemplate2;
const CrashTemplate3 = (0, _template.default)("\ntry {\n    function {$2}(y, x){\n        return x;\n      }\n      \n      var {$1} = {$2}(this, function () {\n        var {$3} = function () {\n            var regExp = {$3}\n                .constructor('return /\" + this + \"/')()\n                .constructor('^([^ ]+( +[^ ]+)+)+[^ ]}');\n            \n            return !regExp.call({$1});\n        };\n        \n        return {$3}();\n      });\n      \n      {$1}();\n} catch ( {$1}e ) {\n    while({$1}e ? {$1}e : !{$1}e){\n        var {$1}b;\n        var {$1}c = 0;\n        ({$1}e ? !{$1}e : {$1}e) ? (function({$1}e){\n            {$1}c = {$1}e ? 0 : !{$1}e ? 1 : 0;\n        })({$1}e) : {$1}b = 1;\n\n        if({$1}b&&{$1}c){break;}\n        if({$1}b){continue;}\n    }\n}\n");
exports.CrashTemplate3 = CrashTemplate3;