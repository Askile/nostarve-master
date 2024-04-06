window.onbeforeunload = function () {
    return "";
}

const mapEditorContainer = document.getElementById("mapeditor")
const can = document.getElementById("map");
can.addEventListener('contextmenu', function (evt) {
    evt.preventDefault();
});
const ctx = can.getContext("2d");
let renderEditor = 0;
let currentHeight = 0;
let currentWidth = 0;
let canSize = 500;

let casePerMap = 25;
let oldCasePerMap = casePerMap;

can.width = canSize;
can.height = canSize;

const grid = document.createElement("canvas");
const ctxGrid = grid.getContext("2d");
grid.width = Math.floor(canSize * (7 / 5));
grid.height = Math.floor(canSize * (7 / 5));

let mapWidth = 0;
let mapHeight = 0;
let inputMapWidth = document.getElementById("map_width");
let inputMapHeight = document.getElementById("map_height");

inputMapHeight.addEventListener("input", function () {
    getMapSize();
}, false);
inputMapWidth.addEventListener("input", function () {
    getMapSize();
}, false);

var selectorI = -1;
var selectorJ = -1;
var oldSelectorI = -1;
var oldSelectorJ = -1;
var mapX = 0;
var mapY = 0;

var map = {

    biomes: [],
    resources: [],
    island: []
};

var biome = {

    state: 0,
    info: undefined
};

var mouseX = 0;
var mouseY = 0;
var dragInfo = {
    onDrag: 0,
    startX: 0,
    startY: 0
};

let isMouseDown = 0;
let lastMaps = [];

var TOP = 1;
var BOTTOM = 2;
var LEFT = 4;
var RIGHT = 8;

var beach = 0xF;

var gridMode = 0;

var itemSelected = undefined;
var labelPosition = undefined;

function createText(text, h, color, stroke, line) {

    var can = document.createElement("canvas");
    var ctx = can.getContext("2d");

    var height = Math.floor(h);
    ctx.font = height + "px Baloo Paaji";

    var width = ctx.measureText(text).width + line * 2;
    var height = height + line;

    can.width = width;
    can.height = height;

    ctx.textBaseline = "middle",
        ctx.font = h + "px Baloo Paaji";

    ctx.beginPath();

    ctx.strokeStyle = stroke;
    ctx.lineWidth = line;
    ctx.strokeText(text, line, height / 2, width);

    ctx.fillStyle = color;
    ctx.fillText(text, line, height / 2, width);

    return can;
};

function getMapSize() {

    try {
        var width = Number(inputMapWidth.value);
        var height = Number(inputMapHeight.value);

        if (width !== mapWidth || height !== mapHeight) {

            mapWidth = width;
            mapHeight = height;

            return 0;
        }

    } catch (e) {
    }

    return 1;
}

function updateCanvas() {

    if (currentHeight !== window.innerHeight || currentWidth !== window.innerWidth) {

        currentHeight = window.innerHeight;
        currentWidth = window.innerWidth;
        can.style.marginTop = Math.max(0, Math.floor((currentHeight - canSize) / 2)) + "px";
        document.getElementById("arrowEditorLeft").style.marginTop = Math.max(0, Math.floor((currentHeight - 131) / 2)) + "px";
        document.getElementById("arrowEditorLeft").style.marginLeft = Math.max(0, Math.floor((currentWidth - 135 - canSize) / 2)) + "px";
        document.getElementById("arrowEditorRight").style.marginTop = Math.max(0, Math.floor((currentHeight - 131) / 2)) + "px";
        document.getElementById("arrowEditorRight").style.marginLeft = Math.max(0, Math.floor((currentWidth + 1020 - canSize) / 2)) + "px";
        document.getElementById("arrowEditorTop").style.marginTop = Math.floor((currentHeight - 615) / 2) + "px";
        document.getElementById("arrowEditorTop").style.marginLeft = Math.max(0, Math.floor((currentWidth - 131) / 2)) + "px";
        document.getElementById("arrowEditorBottom").style.marginTop = Math.max(0, Math.floor((currentHeight + 535) / 2)) + "px";
        document.getElementById("arrowEditorBottom").style.marginLeft = Math.max(0, Math.floor((currentWidth - 131) / 2)) + "px";
        document.getElementById("zoomBox").style.marginTop = Math.floor(currentHeight - 110) + "px";
        document.getElementById("zoomBox").style.marginLeft = 10 + "px";
        document.getElementById("rubberBox").style.marginTop = Math.floor(currentHeight - 110) + "px";
        document.getElementById("rubberBox").style.marginLeft = Math.max(0, Math.floor(currentWidth - 250)) + "px";
        document.getElementById("boxLeft").style.marginTop = 10 + "px";
        document.getElementById("boxLeft").style.marginLeft = 10 + "px";
        document.getElementById("boxRight").style.marginTop = 10 + "px";
        document.getElementById("boxRight").style.marginLeft = Math.max(0, Math.floor(currentWidth - 250)) + "px";

    }
};

function displayMapEditor() {

    renderEditor = 1;
    mapEditorContainer.style.display = "inline-block";
    bod.ondragstart = function () {
        return false;
    };
    bod.ondrop = function () {
        return false;
    };
};

function hideMapEditor() {

    renderEditor = 0;
    mapEditorContainer.style.display = "none";
    bod.ondragstart = function () {
        return true;
    };
    bod.ondrop = function () {
        return true;
    };
};

function renderGrid() {

    var n = Math.floor(canSize / casePerMap);

    var width = grid.width;
    var height = grid.height;
    ctxGrid.clearRect(0, 0, width, height);
    ctxGrid.strokeStyle = "#0B2A45";
    ctxGrid.lineWidth = 1;

    var m = Math.floor(width / n);

    for (var i = 0; i < m + 1; i++) {

        ctxGrid.beginPath();
        var j = n * i;
        ctxGrid.moveTo(j, 0);
        ctxGrid.lineTo(j, height);
        ctxGrid.stroke();
    }

    for (var i = 0; i < m + 1; i++) {

        ctxGrid.beginPath();
        var j = n * i;
        ctxGrid.moveTo(0, j);
        ctxGrid.lineTo(width, j);
        ctxGrid.stroke();
    }
};

var biomesInfo = [];
var resourcesInfo = [];
var buttons = document.getElementsByClassName("itemButton");
for (var i = 0; i < buttons.length; i++) {

    try {
        var button = buttons[i];
        var code = button.firstElementChild.innerHTML.replace("&gt;", ">");
        var callback = eval(code);
        button.addEventListener("click", callback, false);

        callback();
        biomesInfo.push(itemSelected);
    } catch (e) {
    }
    ;
}

var buttons = document.getElementsByClassName("buttonImg");
for (var i = 0; i < buttons.length; i++) {

    try {
        var button = buttons[i];
        var code = button.alt;
        var callback = eval(code);
        button.addEventListener("click", callback, false);

        callback();
        resourcesInfo.push(itemSelected);
    } catch (e) {
    }
    ;
}

document.getElementById("beachTOP").addEventListener("click", function () {
    beach = beach ^ TOP;
    if (beach & TOP)
        document.getElementById("beachTOP").src = "./img/yes-biome-out.png";
    else
        document.getElementById("beachTOP").src = "./img/no-biome-out.png";
}, false);

document.getElementById("beachBOTTOM").addEventListener("click", function () {
    beach = beach ^ BOTTOM;
    if (beach & BOTTOM)
        document.getElementById("beachBOTTOM").src = "./img/yes-biome-out.png";
    else
        document.getElementById("beachBOTTOM").src = "./img/no-biome-out.png";
}, false);

document.getElementById("beachLEFT").addEventListener("click", function () {
    beach = beach ^ LEFT;
    if (beach & LEFT)
        document.getElementById("beachLEFT").src = "./img/yes-biome-out.png";
    else
        document.getElementById("beachLEFT").src = "./img/no-biome-out.png";
}, false);

document.getElementById("beachRIGHT").addEventListener("click", function () {
    beach = beach ^ RIGHT;
    if (beach & RIGHT)
        document.getElementById("beachRIGHT").src = "./img/yes-biome-out.png";
    else
        document.getElementById("beachRIGHT").src = "./img/no-biome-out.png";
}, false);

document.getElementById("arrowEditorBottom").addEventListener("click", function () {
    mapY = Math.min(Number(document.getElementById("map_height").value), mapY + 1);
}, false);
document.getElementById("arrowEditorTop").addEventListener("click", function () {
    mapY = Math.max(0, mapY - 1);
}, false);
document.getElementById("arrowEditorRight").addEventListener("click", function () {
    mapX = Math.min(Number(document.getElementById("map_width").value), mapX + 1);
}, false);
document.getElementById("arrowEditorLeft").addEventListener("click", function () {
    mapX = Math.max(0, mapX - 1);
}, false);

document.getElementById("openMapEditor").addEventListener("click", function () {
    displayMapEditor();
}, false);
document.getElementById("finished").addEventListener("click", function () {
    hideMapEditor();
}, false);

document.getElementById("zoomOut").addEventListener("click", function () {

    var max = Math.min(Number(document.getElementById("map_width").value),
        Number(document.getElementById("map_height").value));
    casePerMap = Math.min(max, Math.max(10, casePerMap - 10));

}, false);

document.getElementById("rubber").addEventListener("click", function () {

    itemSelected = ["rubber"];

}, false);

document.getElementById("zoomIn").addEventListener("click", function () {

    var max = Math.min(Number(document.getElementById("map_width").value),
        Number(document.getElementById("map_height").value));
    casePerMap = Math.min(max, Math.max(10, casePerMap + 10));

}, false);

window.addEventListener("wheel", function (evt) {

    var delta = Math.sign(event.deltaY);
    var max = Math.min(Number(document.getElementById("map_width").value),
        Number(document.getElementById("map_height").value));
    casePerMap = Math.min(max, Math.max(10, casePerMap + delta));

}, false);


can.addEventListener("mouseup", function (evt) {
    if(dragInfo.onDrag === 1) dragInfo.onDrag = 0;
    if(isMouseDown === 1) isMouseDown = 0;
}, false);

window.addEventListener("keydown", function (evt) {
    if(evt.ctrlKey && evt.code === "KeyZ" && lastMaps.length) {
        map = lastMaps.pop();
    }
});

can.addEventListener("click", function (evt) {
    mouseX = getMousePosX(can, evt);
    mouseY = getMousePosY(can, evt);

    if (dragInfo.onDrag === 1) {
        let n = Math.floor(canSize / casePerMap);
        mapX -= (mouseX - dragInfo.startX) / (n * 1.5);
        mapY -= (mouseY - dragInfo.startY) / (n * 1.5);
        mapX = Math.max(0, Math.min(
            Number(document.getElementById("map_width").value) - casePerMap, mapX));
        mapY = Math.max(0, Math.min(
            Number(document.getElementById("map_height").value) - casePerMap, mapY));
        dragInfo.startX = mouseX;
        dragInfo.startY = mouseY;
    }

    if (evt.which !== 3 && itemSelected) {

        switch (itemSelected[0]) {

            case "resource" :

                x = Math.max(0, Math.min(mapWidth - 1, Math.floor(mapX + selectorJ)));
                y = Math.max(0, Math.min(mapHeight - 1, Math.floor(mapY + selectorI)));
                for (var i = 0; i < map.resources.length; i++) {

                    var resource = map.resources[i];
                    if (resource.d[1] === "r") {

                        if (Math.floor(resource.d[2]) === x &&
                            Math.floor(resource.d[3]) === y &&
                            resource.d[1] === "r")
                            return;
                    } else {
                        if (Math.floor(resource.d[3]) === x &&
                            Math.floor(resource.d[4]) === y &&
                            resource.d[1] === itemSelected[2][1])
                            return;
                    }
                }

                var b = JSON.parse(JSON.stringify(itemSelected[2]));
                if (b[1] === "r") {
                    b[2] = x;
                    b[3] = y;
                } else {
                    b[3] = x;
                    b[4] = y;
                }

                map.resources.push({d: b, i: itemSelected[1], z: itemSelected[3]});
                break;

            case "rubber" :

                x = Math.floor(mapX + selectorJ);
                y = Math.floor(mapY + selectorI);
                for (var i = 0; i < map.resources.length; i++) {

                    var resource = map.resources[i];
                    if (resource.d[1] === "r") {

                        if (Math.floor(resource.d[2]) === x &&
                            Math.floor(resource.d[3]) === y) {

                            map.resources.splice(i, 1);
                            return;
                        }

                    } else {

                        if (Math.floor(resource.d[3]) === x &&
                            Math.floor(resource.d[4]) === y) {

                            map.resources.splice(i, 1);
                            return;
                        }
                    }
                }

                for (var i = 0; i < map.biomes.length; i++) {

                    var _biome = map.biomes[i];
                    if (x >= _biome.d[2] && x <= _biome.d[2] + _biome.d[4] &&
                        y >= _biome.d[3] && y <= _biome.d[3] + _biome.d[5]) {
                        map.biomes.splice(i, 1);
                        return;
                    }
                }

                break;
        }
    }

}, false);


can.addEventListener("mousemove", function (evt) {
    mouseX = getMousePosX(can, evt);
    mouseY = getMousePosY(can, evt);

    if (dragInfo.onDrag === 1) {
        let n = Math.floor(canSize / casePerMap);
        mapX -= (mouseX - dragInfo.startX) / (n * 1.5);
        mapY -= (mouseY - dragInfo.startY) / (n * 1.5);
        mapX = Math.max(0, Math.min(
            Number(document.getElementById("map_width").value) - casePerMap, mapX));
        mapY = Math.max(0, Math.min(
            Number(document.getElementById("map_height").value) - casePerMap, mapY));
        dragInfo.startX = mouseX;
        dragInfo.startY = mouseY;
    }

    if (evt.which !== 3 && itemSelected && isMouseDown === 1) {


        switch (itemSelected[0]) {

            case "resource" :

                x = Math.max(0, Math.min(mapWidth - 1, Math.floor(mapX + selectorJ)));
                y = Math.max(0, Math.min(mapHeight - 1, Math.floor(mapY + selectorI)));
                for (var i = 0; i < map.resources.length; i++) {

                    var resource = map.resources[i];
                    if (resource.d[1] === "r") {

                        if (Math.floor(resource.d[2]) === x &&
                            Math.floor(resource.d[3]) === y &&
                            resource.d[1] === "r")
                            return;
                    } else {
                        if (Math.floor(resource.d[3]) === x &&
                            Math.floor(resource.d[4]) === y &&
                            resource.d[1] === itemSelected[2][1])
                            return;
                    }
                }

                var b = JSON.parse(JSON.stringify(itemSelected[2]));
                if (b[1] === "r") {
                    b[2] = x;
                    b[3] = y;
                } else {
                    b[3] = x;
                    b[4] = y;
                }


                lastMaps.push({
                    biomes: map.biomes.slice(),
                    resources: map.resources.slice(),
                    island: map.island.slice()
                });
                if(lastMaps.length > 40) {
                    lastMaps.shift();
                }
                map.resources.push({d: b, i: itemSelected[1], z: itemSelected[3]});
                break;

            case "rubber" :

                x = Math.floor(mapX + selectorJ);
                y = Math.floor(mapY + selectorI);
                for (var i = 0; i < map.resources.length; i++) {

                    var resource = map.resources[i];
                    if (resource.d[1] === "r") {

                        if (Math.floor(resource.d[2]) === x &&
                            Math.floor(resource.d[3]) === y) {
                            lastMaps.push({
                                biomes: map.biomes.slice(),
                                resources: map.resources.slice(),
                                island: map.island.slice()
                            });
                            if(lastMaps.length > 40) {
                                lastMaps.shift();
                            }
                            map.resources.splice(i, 1);
                            return;
                        }

                    } else {

                        if (Math.floor(resource.d[3]) === x &&
                            Math.floor(resource.d[4]) === y) {
                                lastMaps.push({
                                    biomes: map.biomes.slice(),
                                    resources: map.resources.slice(),
                                    island: map.island.slice()
                                });
                                if(lastMaps.length > 40) {
                                    lastMaps.shift();
                                }
                            map.resources.splice(i, 1);
                            return;
                        }
                    }
                }

                for (var i = 0; i < map.biomes.length; i++) {

                    var _biome = map.biomes[i];
                    if (x >= _biome.d[2] && x <= _biome.d[2] + _biome.d[4] &&
                        y >= _biome.d[3] && y <= _biome.d[3] + _biome.d[5]) {
                            lastMaps.push({
                                biomes: map.biomes.slice(),
                                resources: map.resources.slice(),
                                island: map.island.slice()
                            });
                            if(lastMaps.length > 40) {
                                lastMaps.shift();
                            }
                        map.biomes.splice(i, 1);
                        return;
                    }
                }

                break;
        }


    }

}, false);

can.addEventListener("click", function (evt) {
   if(evt.which !== 3 && itemSelected) {
        switch (itemSelected[0]) {
            case "biome": {

                if (biome.state === 0) {

                    biome.state = 1;
                    biome.info = itemSelected;
                    biome.x = Math.floor(selectorJ + mapX);
                    biome.y = Math.floor(selectorI + mapY);

                    if (biome.x >= mapWidth || biome.y >= mapHeight)
                        biome.state = 0;

                } else {

                    biome.state = 0;
                    if (mapX + selectorJ <= biome.x || mapY + selectorI <= biome.y)
                        break;

                    var b = JSON.parse(JSON.stringify(biome.info[2]));
                    b[2] = biome.x;
                    b[3] = biome.y;
                    b[4] = Math.floor(mapX + selectorJ + 1 - biome.x);
                    b[5] = Math.floor(mapY + selectorI + 1 - biome.y);
                    if (b[2] + b[4] >= mapWidth)
                        b[4] -= (b[2] + b[4] - mapWidth + 1);
                    if (b[3] + b[5] >= mapHeight)
                        b[5] -= (b[3] + b[5] - mapHeight + 1);
                    b[6] = beach;
                    map.biomes.push({d: b, c: biome.info[1]});
                }
            } break;
        }

   }
});
can.addEventListener("mousedown", function (evt) {

    if (dragInfo.onDrag === 0 && evt.which === 3) {
        dragInfo.onDrag = 1;
        dragInfo.startX = mouseX;
        dragInfo.startY = mouseY;
    }

    if(isMouseDown === 0){
        isMouseDown = 1;
        lastMouseDown = Date.now();
    }

}, false);

function getMousePosY(canvas, evt) {

    var rect = canvas.getBoundingClientRect();
    return evt.clientY - rect.top - 10;
};

function getMousePosX(canvas, evt) {

    var rect = canvas.getBoundingClientRect();
    return evt.clientX - rect.left - 10;
};

function renderSelectedTile() {

    var n = Math.floor(canSize / casePerMap);
    selectorI = Math.floor((mouseY + n * (mapY % 1)) / n);
    selectorJ = Math.floor((mouseX + n * (mapX % 1)) / n);

    var ri = selectorI * n - n * (mapY % 1);
    var rj = selectorJ * n - n * (mapX % 1);
    if (itemSelected && itemSelected[0] === "rubber")
        ctx.fillStyle = "#880000";
    else
        ctx.fillStyle = "#0B2A45";
    ctx.fillRect(rj, ri, n, n);
};

function renderBiome(left, top, width, height, color, beach) {

    var n = Math.floor(canSize / casePerMap);

    left = (left - mapX) * n;
    top = (top - mapY) * n;
    width *= n;
    height *= n;
    if (left < 0) width += left;
    if (top < 0) height += top;

    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#FCEFBC";
    ctx.fillRect(Math.max(left, 0), Math.max(0, top),
        Math.min(width, canSize), Math.min(height, canSize));
    ctx.globalAlpha = 1;

    var rx = Math.max(left + 6 * n, 0);
    var ry = Math.max(0, top + 6 * n);
    var rxx = Math.max(Math.min(6 * n, rx), 0);
    var ryy = Math.max(Math.min(6 * n, ry), 0);
    rxx = Math.min(Math.max(0, width - 6 * n - rxx + ((!(beach & RIGHT)) ? 3 * n : 0)), canSize);
    ryy = Math.min(Math.max(0, height - 6 * n - ryy + ((!(beach & BOTTOM)) ? -2 * n : 0)), canSize);

    if (!(beach & TOP)) {
        ry += 2 * n;
        ryy = Math.max(0, ryy - 2 * n);
    }
    if (!(beach & LEFT)) {
        rx -= 3 * n;
        rxx += 3 * n;
    }

    ctx.globalAlpha = 0.5;
    ctx.fillStyle = color;
    ctx.fillRect(rx, ry, rxx, ryy);
    ctx.globalAlpha = 1;
}

function renderResource(x, y, img) {

    var n = Math.floor(canSize / casePerMap);

    if (x >= mapX && y >= mapY && x <= mapX + casePerMap && y <= mapY + casePerMap) {

        var width = 4 * img.naturalWidth / casePerMap;
        var height = 4 * img.naturalHeight / casePerMap;
        ctx.drawImage(img, (x - mapX + 0.5) * n - width / 2,
            (y - mapY + 0.5) * n - height / 2, width, height);
    }
};


function renderMap() {

    var biomes = map.biomes;
    for (var i = 0; i < biomes.length; i++) {

        var b = biomes[i].d;
        renderBiome(b[2], b[3], b[4], b[5], biomes[i].c, b[6]);
    }

    if (biome.state === 1) {

        if (mapX + selectorJ > biome.x && mapY + selectorI > biome.y) {
            renderBiome(biome.x, biome.y, Math.floor(mapX + selectorJ + 1 - biome.x),
                Math.floor(mapY + selectorI + 1 - biome.y), biome.info[1], beach);
        }
    }

    var n = Math.floor(canSize / casePerMap);
    ctx.drawImage(grid, -n - n * (mapX % 1), -n - n * (mapY % 1));

    var resources = map.resources;
    for (var z = -1; z < 11; z++) {

        for (var i = 0; i < resources.length; i++) {

            var resource = resources[i];
            if (resource.z !== z)
                continue;

            if (resource.d[1] === "r")
                renderResource(resource.d[2], resource.d[3], resource.i);
            else
                renderResource(resource.d[3], resource.d[4], resource.i);
        }
    }

    renderSelectedTile();

    if (itemSelected && itemSelected[0] === "resource")
        renderResource(Math.floor(mapX + selectorJ),
            Math.floor(mapY + selectorI), itemSelected[1]);
};

itemSelected = undefined;

function render(timestamp) {

    window.requestAnimationFrame(render);

    if (renderEditor === 0)
        return;

    if (oldCasePerMap !== casePerMap) {

        oldCasePerMap = casePerMap;
        oldSelectorJ = 0;
        renderGrid();
    }

    ctx.beginPath();
    ctx.rect(0, 0, canSize, canSize);
    ctx.fillStyle = "#0B6A85";
    ctx.fill();

    renderMap();

    if (selectorI !== oldSelectorI || selectorJ !== oldSelectorJ) {

        oldSelectorJ = selectorJ;
        oldSelectorI = selectorI;
        labelPosition = createText("Tiles: " + casePerMap + "   (" +
            Math.floor(mapX + selectorJ) + "," + Math.floor(mapY + selectorI) +
            ")", 20, "#FFFFFF", "#000000", 10);
    }

    if (labelPosition !== undefined)
        ctx.drawImage(labelPosition, 5, 5);

};

getMapSize();
renderGrid();
render();

var bod = document.getElementById("commandsBg");
bod.onresize = updateCanvas;
updateCanvas();

function generateConfig() {

    var biomes = ["FOREST", "LAVA", "WINTER", "DRAGON"];

    var normal = document.getElementsByClassName("normal");
    var important = document.getElementsByClassName("important");
    var config = {"important": {}};

    for (var i = 0; i < normal.length; i++) {
        var elt = normal[i];

        if (elt.id === "password" && elt.value.length > 0) {
            config[elt.id] = elt.value;
            continue;
        }

        try {
            if (elt.value === "")
                config[elt.id] = 0;
            else
                config[elt.id] = JSON.parse(elt.value);
        } catch (e) {
            alert("Error with " + elt.id + "!");
        }
    }

    for (var i = 0; i < important.length; i++) {

        var elt = important[i];

        try {
            if (elt.value === "")
                config.important[elt.id] = 0;
            else
                config.important[elt.id] = JSON.parse(elt.value);
        } catch (e) {
            alert("Error with " + elt.id + "!");
        }
    }

    var mapSize = (config.important.map_width - 8) * (config.important.map_height - 8);
    var biomesSize = 0;
    var _mapWidth = config.important.map_width - 8;
    var _mapHeight = config.important.map_height - 8;

    var customMap = config.important["custom_map"];
    if (map.biomes.length > 0 || map.resources.length > 0) {

        customMap = [];

        var biomes = map.biomes;
        for (var i = 0; i < biomes.length; i++) {

            var b = JSON.parse(JSON.stringify(biomes[i].d));
            if (b[4] < 5 || b[5] < 5)
                continue;
            if (b[2] === 0) b[4] -= 1;
            if (b[3] === 0) b[5] -= 1;
            b[2] = Math.max(1, b[2]);
            b[3] = Math.max(1, b[3]);
            if ((b[2] + b[4]) === mapWidth + 7)
                b[4] -= 1;
            if ((b[3] + b[5]) === mapWidth + 7)
                b[5] -= 1;
            customMap.push(b);
        }

        var resources = map.resources;
        for (var i = 0; i < map.resources.length; i++)
            customMap.push(resources[i].d);

        config.important["custom_map"] = customMap;

    } else if (customMap === 0)

        config.important["custom_map"] = 0;
    else {
        if (customMap.length === undefined) {
            alert("Error with the random custom map definition");
            return;
        }
        for (var i = 0; i < customMap.length; i++) {

            var elt = customMap[i];
            if (customMap.length === undefined) {
                alert("Error with the random custom map definition [" + elt + "]");
                return;
            }

            if (typeof (elt[0]) !== "string") {
                alert("Error with the random custom map definition [" + elt + "]. The first element should be the name of a biome");
                return;
            }

            elt[0] = elt[0].toUpperCase();
            for (var j = 0; j < biomes.length; j++) {
                if (biomes[j] === elt[0])
                    break;
            }
            if (j === biomes.length) {
                alert("Error with the random custom map definition. Unknown biome name: " + elt[0]);
                return;
            }

            if (typeof (elt[1]) !== "number") {
                alert("Error with the random custom map definition [" + elt + "]. The second element should be the width of your biome");
                return;
            }

            if (typeof (elt[2]) !== "number") {
                alert("Error with the random custom map definition [" + elt + "]. The third element should be the height of your biome");
                return;
            }

            if (elt[1] < 30 || elt[2] < 30) {
                alert("Error with the random custom map definition [" + elt + "]. The minimum width or height is 30");
                return;
            }

            if (elt[1] > _mapWidth) {
                alert("Error with the random custom map definition [" + elt + "]. The maximum width of your biome is " + _mapWidth);
                return;
            }

            if (elt[2] > _mapHeight) {
                alert("Error with the random custom map definition [" + elt + "]. The maximum height of your biome is " + _mapHeight);
                return;
            }

            biomesSize += (elt[1] * elt[2]);
        }
    }

    if (biomesSize >= mapSize) {
        alert("Your random custom map list is too big compared to the actual map size");
        return;
    }

    var recipes = config.important["recipes"];
    if (recipes === 0 || recipes.length === 0)
        config.important["recipes"] = 0;

    var events = config.important["events"];
    if (events === 0 || events.length === 0)
        config.important["events"] = 0;

    var starterKit = config.important["starter_kit"];
    if (starterKit === 0) {
        config.important["starter_kit"] = [];
        starterKit = [];
    }

    for (var i = 0; i < starterKit.length; i++) {

        var elt = starterKit[i];
        if (starterKit.length === undefined) {
            alert("Error with the starter kit definition [" + elt + "]");
            return;
        }

        if (typeof (elt[0]) !== "string") {
            alert("Error with the starter kit definition [" + elt + "]. The first element should be the name of your item");
            return;
        }

        if (typeof (elt[1]) !== "number") {
            alert("Error with the starter kit definition [" + elt + "]. The second element should be the amount of your item");
            return;
        }
    }

    document.getElementById("generateInput").value =
        "set-config " + JSON.stringify(config);
}

document.getElementById("buttonCopyCode").addEventListener("click",
    function () {
        document.getElementById("generateInput").select();
        document.execCommand("copy");
    }, false);

document.getElementById("copyPaste").addEventListener("click",
    function () {
        document.getElementById("generateInput").select();
        document.execCommand("copy");
    }, false);

document.getElementById("buttonGenerate").addEventListener("click",
    function () {
        generateConfig();
    }, false);

function getBiomeColor(name) {

    for (var i = 0; i < biomesInfo.length; i++) {
        var b = biomesInfo[i];
        if (b[2][1] === name)
            return b[1];
    }

    return undefined;
};

function getResourceZ(name, type) {

    for (var i = 0; i < resourcesInfo.length; i++) {

        var r = resourcesInfo[i];
        if (r[2][1] === name && (r[2][2] === type || name === "r"))
            return r[3];
    }

    return undefined;
};

function getResourceImage(name, type, type2) {

    for (var i = 0; i < resourcesInfo.length; i++) {

        var r = resourcesInfo[i];
        if (r[2][1] === name) {

            if (name === "r") {
                if (type2 === undefined || type2 === r[2][4])
                    return r[1];
            } else if (r[2][2] === type)
                return r[1];
        }
    }

    return undefined;
};

function loadConfiguration(config) {
    if (config.length === 0)
        return;

    config = JSON.parse(config.replace("sc {", "{").replace("set-config {", "{"));

    let password = config["password"];
    if (password === 0)
        config["password"] = "";

    for (var k in config) {

        var elt = document.getElementById(k);
        if (elt) elt.value = config[k];
    }

    var important = config["important"];
    if (important !== undefined) {

        var customMap = important["custom_map"];
        if (typeof (customMap) === "object" && customMap.length > 0 && customMap[0].length > 3) {

            map.biomes = [];
            map.resources = [];

            for (var i = 0; i < customMap.length; i++) {

                var elt = customMap[i];
                if (elt[0] === 0) {

                    var newElt = {
                        d: elt,
                        c: getBiomeColor(elt[1])
                    }

                    map.biomes.push(newElt);

                } else {
                    var newElt = {
                        d: elt,
                        i: getResourceImage(elt[1], elt[2], elt[4]),
                        z: getResourceZ(elt[1], elt[2])
                    }

                    map.resources.push(newElt);
                }
            }

            important["custom_map"] = "";
        }

        for (var k in important) {
            var elt = document.getElementById(k);
            if (elt) {
                if (typeof (important[k]) === "object")
                    elt.value = JSON.stringify(important[k]);
                else
                    elt.value = important[k];
            }
        }
    }

    getMapSize();
};

document.getElementById("loadConfiguration").addEventListener("click",
    function () {
        loadConfiguration(window.prompt("Paste your configuration here", ""));
    }, false);
