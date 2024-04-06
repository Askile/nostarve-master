import * as terser from "terser";
import JsConfuser from "js-confuser";
import fs from "fs";
import { parentPort } from "worker_threads";
import { ITEMS } from "./variables/ITEMS.js";
import { SPRITE } from "./variables/SPRITE.js";
import { INV } from "./variables/INV.js";
import { STATE } from "./variables/STATE.js";
import { RARITY } from "./variables/RARITY.js";
import { TEXT } from "./variables/TEXT.js";
import { WORLD } from "./variables/WORLD.js";
import { CATEGORY } from "./variables/CATEGORY.js";
import { CLIENT } from "./variables/CLIENT.js";
import { CONFIG } from "./config.js";
import { LANG } from "./templates/LANG.js";
import { DIE } from "./templates/DIE.js";
let seed = Math.floor(Math.random() * 0x80000000);
const letters = shuffleArray(CONFIG.letters, seed).join("");
const fullLetters = shuffleArray((CONFIG.letters.join("") + CONFIG.extraLetters.join("")).split(""), seed).join("");
function seededRandom(seed) {
    let state = seed;
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    return function () {
        state = (a * state + c) % m;
        return state / m;
    };
}
function shuffleArray(array, seed) {
    const rng = seededRandom(seed);
    const shuffledArray = array.slice();
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
}
export let currentIndex = 1;
export function generateChar() {
    let result = "";
    let i = ++currentIndex;
    while (i >= 0) {
        if (result.length > 0) {
            result += fullLetters[i % fullLetters.length];
            i = Math.floor(i / fullLetters.length) - 1;
        }
        else {
            result += letters[i % letters.length];
            i = Math.floor(i / letters.length) - 1;
        }
    }
    return result;
}
async function obfuscate(code) {
    return new Promise(async (resolve, reject) => {
        let properties = [];
        let characters = [];
        let objects = [];
        const windowChar = generateChar();
        replaceCode(/LANG\[(.*?)\] = (.*?)/g, "");
        replaceCode(/var LANG = \[\];/g, "var LANG=" + LANG + ";");
        replaceCode(/DIE\[(.*?)\] = (.*?)/g, "");
        replaceCode(/let DIE = \[\];/g, "let DIE=" + DIE + ";");
        for (let i = 0; i < Object.keys(CATEGORY).length; i++) {
            const key = Object.keys(CATEGORY)[i];
            const value = JSON.stringify(Object.values(CATEGORY)[i]);
            let pattern = new RegExp("CATEGORY." + "\\b" + key + "\\b", 'g');
            replaceCode(pattern, value + " ");
        }
        for (let i = 0; i < Object.keys(RARITY).length; i++) {
            const key = Object.keys(RARITY)[i];
            const value = JSON.stringify(Object.values(RARITY)[i]);
            let pattern = new RegExp("RARITY." + "\\b" + key + "\\b", 'g');
            replaceCode(pattern, value + " ");
        }
        for (let i = 0; i < Object.keys(ITEMS).length; i++) {
            const key = Object.keys(ITEMS)[i];
            const value = JSON.stringify(Object.values(ITEMS)[i]);
            let pattern = new RegExp("ITEMS." + "\\b" + key + "\\b", 'g');
            replaceCode(pattern, value + " ");
        }
        for (let i = 0; i < Object.keys(CLIENT).length; i++) {
            const key = Object.keys(CLIENT)[i];
            const value = JSON.stringify(Object.values(CLIENT)[i]);
            let pattern = new RegExp("CLIENT." + "\\b" + key + "\\b", 'g');
            replaceCode(pattern, value + " ");
        }
        for (let i = 0; i < Object.keys(TEXT).length; i++) {
            const key = Object.keys(TEXT)[i];
            const value = JSON.stringify(Object.values(TEXT)[i]);
            let pattern = new RegExp("TEXT." + "\\b" + key + "\\b", 'g');
            replaceCode(pattern, value + " ");
        }
        for (let i = 0; i < Object.keys(STATE).length; i++) {
            const key = Object.keys(STATE)[i];
            const value = JSON.stringify(Object.values(STATE)[i]);
            let pattern = new RegExp("STATE." + "\\b" + key + "\\b", 'g');
            replaceCode(pattern, value + " ");
        }
        for (let i = 0; i < Object.keys(SPRITE).length; i++) {
            const key = Object.keys(SPRITE)[i];
            const value = Object.values(SPRITE)[i];
            if (value.length) {
                if (objects["SPRITE"]) {
                    objects["SPRITE"][key] = value;
                }
                else {
                    objects["SPRITE"] = {};
                    objects["SPRITE"][key] = value;
                }
            }
            else {
                let pattern = new RegExp("SPRITE." + "\\b" + key + "\\b", 'g');
                replaceCode(pattern, JSON.stringify(value) + " ");
            }
        }
        // console.log("SPRITE");
        for (let i = 0; i < Object.keys(INV).length; i++) {
            const key = Object.keys(INV)[i];
            const value = JSON.stringify(Object.values(INV)[i]);
            let pattern = new RegExp("ItemType." + "\\b" + key + "\\b", 'g');
            replaceCode(pattern, value + " ");
        }
        // console.log("ItemType");
        for (let i = 0; i < Object.keys(WORLD).length; i++) {
            const key = Object.keys(WORLD)[i];
            const value = JSON.stringify(Object.values(WORLD)[i]);
            let pattern = new RegExp("WORLD." + "\\b" + key + "\\b", 'g');
            replaceCode(pattern, value + " ");
        }
        // console.log("WORLD");
        if (CONFIG.minify.strings) {
            for (const string of CONFIG.strings) {
                const char = generateChar();
                replaceCode(new RegExp(`"\\b${string}\\b"`, "g"), char);
                properties.push(string);
                characters.push(char);
            }
            // console.log("Strings");
        }
        if (CONFIG.minify.terser) {
            code = (await terser.minify(code, {
                compress: {
                    dead_code: true,
                    drop_console: true,
                    switches: true,
                    toplevel: true
                }, mangle: {
                    toplevel: true,
                    properties: {
                        keep_quoted: false,
                        reserved: CONFIG.reserved
                    }
                }
            })).code;
        }
        if (CONFIG.minify.window) {
            replaceCode(/window\./g, windowChar + ".");
            // console.log("Window");
        }
        // replaceCode(/\bconst\b/g, "var");
        if (CONFIG.minify.functions) {
            for (const FUNCTION of CONFIG.function_properties) {
                const regexp = new RegExp("\\.\\b" + FUNCTION + "\\b\\(", "g");
                const char = generateChar();
                if (regexp.test(code)) {
                    properties.push(FUNCTION);
                    characters.push(char);
                    replaceCode(regexp, `[${char}](`);
                }
            }
            // console.log("Functions");
        }
        if (CONFIG.minify.object_properties) {
            for (const prop of CONFIG.object_properties) {
                const char = generateChar();
                const regex = new RegExp("\\.\\b" + prop + "\\b", "g");
                const regex_ = new RegExp("\\b" + prop + "\\b:", "g");
                const regex__ = new RegExp("\\b" + prop + "\\b\\(", "g");
                if (regex.test(code))
                    replaceCode(regex, "." + char);
                if (regex_.test(code))
                    replaceCode(regex_, char + ":");
                if (regex__.test(code))
                    replaceCode(regex__, char + "(");
            }
            // console.log("Object properties");
        }
        if (CONFIG.minify.arrays) {
            for (let i = 0; i < CONFIG.array_properties.length; i++) {
                const regex = new RegExp(`\\.\\b${CONFIG.array_properties[i]}\\b`, "g");
                const regex_ = new RegExp(`\\b${CONFIG.array_properties[i]}\\b:`, "g");
                const char = generateChar();
                properties.push(CONFIG.array_properties[i]);
                characters.push(char);
                if (regex.test(code))
                    replaceCode(regex, `[${char}]`);
                if (regex_.test(code))
                    replaceCode(regex_, `[${char}]:`);
            }
            // console.log("Array properties");
        }
        if (CONFIG.minify.math_methods) {
            for (const prop of ["Math", ...Object.getOwnPropertyNames(Math)]) {
                const regex = new RegExp(`\\.\\b${prop}\\b`, "g");
                if (!regex.test(code))
                    continue;
                const char = generateChar();
                replaceCode(regex, `[${char}]`);
                properties.push(prop);
                characters.push(char);
            }
            // console.log("Math methods");
        }
        if (CONFIG.minify.array_methods) {
            for (const prop of [...Object.getOwnPropertyNames(Array.prototype)]) {
                const regex = new RegExp(`\\.\\b${prop}\\b`, "g");
                const char = generateChar();
                replaceCode(regex, `[${char}]`);
                properties.push(prop);
                characters.push(char);
            }
            // console.log("Array methods");
        }
        characters = shuffleArray(characters, seed);
        properties = shuffleArray(properties, seed);
        // console.log("Shuffle");
        if (CONFIG.minify.window) {
            code = `var ${windowChar}=this;` + code;
        }
        if (characters.length > 0) {
            code = `var [${characters}]=${JSON.stringify(properties)};` + code;
        }
        for (const name in objects) {
            const object = objects[name];
            code = `var ${name}=${JSON.stringify(object)};` + code;
        }
        function replaceCode(pattern, replaceValue) {
            code = code.replace(pattern, replaceValue);
        }
        code = await JsConfuser.obfuscate(code, CONFIG.js_confuser);
        seed = Math.floor(Math.random() * 0x80000000);
        currentIndex = 0;
        resolve(code);
    });
}
if (parentPort) {
    const og = fs.readFileSync("./data/client.js", "utf-8");
    parentPort.on('message', async (message) => {
        if (message === "minify") {
            const code = await obfuscate(og);
            if (typeof code === "string") {
                fs.writeFileSync("./data/c.js", code);
                if (parentPort) {
                    parentPort.postMessage("minified");
                }
            }
        }
    });
}
