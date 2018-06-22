var xScreenSize = innerWidth - 5; // canvas size
var yScreenSize = innerHeight - 5;
var viewX = 0;
var viewY = 0;
var viewZoom = 1.0;
var counter = 0; // loop counter counts ammountof times the main loop has been executed.
var gates = []; // list that keeps all the gates.
var connections = []; // list that keeps all the connections
var backup = [[],[]]; // list containing lists containng connections and gates before last action.
var typesF = []; // list tat stores all gate types with cumputation functions.
var typesI = []; // list tat stores all gate types with images.
var ticksToBeDone = 0;
var ticksPerFrame = 1/3; // 20 tps (at 60 fps)
var backupWasDone = false;

// connections*2 + gates < tickALgorithim complexity < connections*2 + gates * connections

document.addEventListener('contextmenu', event => event.preventDefault()); // prevent rightclick menu to make rihtclick control less annoying to use.

function isPosit(x) { // returns true if x is 0 or higher
  return (x>=0); // statement that makes boolean
}

function posit(x) { // returns positive number
  if (isPosit(x)) {return(x)}; // simply return input if input is positive (or 0)
  return(-x); // return negative input
}

function gate(initX, initY, type) {
  this.xPos = initX; // x position of center of dot
  this.yPos = initY; // y position of center of dot
  this.size = size; // size/diameter of dor
  this.gateType = type;
  this.value = false;
  this.inputs = [];
  this.selected = false;
  this.render = function() { // graphics, no calculations.
    if (this.selected === true) {
      stroke(0,0,255);
      strokeWeight(10);
    } else {
      stroke(0,0,50);
      strokeWeight(2);
    }
    if (this.value === true) {
      fill(0,255,0);
    } else {
      fill(0,100,0);
    }
    rectMode(CENTER);
    rect(this.xPos, this.yPos, 100, 100);
    imageMode(CENTER)
    image(typesI[this.gateType], this.xPos, this.yPos, 100, 100);
    textAlign(CENTER, CENTER);
    fill(0)
    textSize(size/2);
    text(this.gateType);
  }
}

function connection(comesFrom, goesTo) {
  this.connectionStart = comesFrom;
  this.connectionEnd = goesTo;
  this.color = color(random(50,200), random(50,200), random(50,200),150);
  this.render = function() {
    stroke(this.color);
    strokeWeight(5);
    var gate1 = gates[this.connectionStart];
    var gate2 = gates[this.connectionEnd];
    line(gate1.xPos, gate1.yPos, gate2.xPos, gate2.yPos);
    var averageX = (gate1.xPos + gate2.xPos) / 2;
    var averageY = (gate1.yPos + gate2.yPos) / 2;
    push();
      if (gates[this.connectionStart].value === true) {
        fill(255);
      } else {
        fill(100);
      }
      translate(averageX, averageY);
      rotate(-atan2(gate2.xPos-gate1.xPos, gate2.yPos-gate1.yPos));
      triangle(-10,-15, 10,-15, 0, 15);
    pop();
  }
}

function tickConnections() {
  for (var i = 0; i < gates.length; i++) {
    gates[i].inputs = [];
  }
  for (var i = 0; i < connections.length; i++) {
    var currentConn = connections[i];
    gates[currentConn.connectionEnd].inputs.push(gates[currentConn.connectionStart].value);
  }
}

function gateAND(trueConnections, inputs, gate) {
  return(trueConnections == inputs && inputs>=1);
}
function gateOR(trueConnections, inputs, gate) {
  return(trueConnections >= 1);
}
function gateXOR(trueConnections, inputs, gate) {
  return(trueConnections == 1);
}
function gateNAND(trueConnections, inputs, gate) {
  return(!(trueConnections == inputs));
}
function gateNOR(trueConnections, inputs, gate) {
  return(!(trueConnections >= 1));
}
function gateNXOR(trueConnections, inputs, gate) {
  return(!(trueConnections == 1));
}
function gateLamp(trueConnections, inputs, gate) {
  return(gateAND(trueConnections, inputs))
}
function gateButton(trueConnections, inputs, gate) {
  var isSelected = dist(Wmouse[0],Wmouse[1],gate.xPos,gate.yPos) < 50 && mouseIsPressed && mouseButton === LEFT;
  if (isSelected) {
    dragging = false;
  }
  return(isSelected);
}
typesF = [gateAND, gateOR, gateNAND, gateNOR, gateXOR, gateNXOR, gateLamp, gateButton];

function calcGate(gateType, trueConnections, inputs, gate) {
  return(typesF[gateType](trueConnections, inputs, gate));
}

function tickGates() {
  for (var i = 0; i < gates.length; i++) {
    var trueConnections = 0;
    for (var j = 0; j < gates[i].inputs.length; j++) {
      if (gates[i].inputs[j] === true) {
        trueConnections += 1;
      }
    }
    gates[i].value = calcGate(gates[i].gateType, trueConnections, gates[i].inputs.length, gates[i]);
  }
}

function fullTick() {
  tickConnections();
  tickGates();
}

function renderAll() {
  for (var i = 0; i < gates.length; i++) {
    gates[i].render();
  }
  for (var i = 0; i < connections.length; i++) {
    connections[i].render();
  }
}

// dragging
var drags = 0;
var dragging = false;
var selectDrags = 0;
var selecting = false;
var selectingStart = [0,0];
var firstSelected = undefined;
function mousePressed() {
  if (mouseButton === RIGHT) {
    var gatePressed = isPressingGate();
    if (gatePressed[0] === true) {
      select(gatePressed[1]);
    } else {
      selecting = true;
      selectingStart = Wmouse;
      selectDrags = 0;
    }
  } else if (mouseButton === LEFT){
    dragging = true;
    drags = 0;
  } else if (mouseButton === CENTER) {
    var isPressingGateRes = isPressingGate();
    if (isPressingGateRes[0] === true) {
      removeGate(isPressingGateRes[1]);
    }
  }
}
function mouseDragged() {
  if (dragging) {
    viewX += ((pmouseX-mouseX)*-1)/viewZoom;
    viewY += ((pmouseY-mouseY)*-1)/viewZoom;
    drags += 1;
  } else if (selecting) {
    selectDrags += 1;
  }
}
function mouseReleased() {
  if (selecting && selectDrags > 10) {
    selectDrag(Wmouse, selectingStart);
  }
  if (dragging && drags < 5) { // dragging is always true when left mouse button was cklicked, exept when cklinging on a button.
    newGate();
  }
  dragging = false;
  selecting = false;
}
function mouseWheel(event) {
  if (event.delta < 0) {
    zoomFactor = 1.2;
  } else {
    zoomFactor = 0.8;
  }
  viewZoom = viewZoom * zoomFactor;
  viewX -= (mouseX-(xScreenSize/2))*(zoomFactor-1)/viewZoom;
  viewY -= (mouseY-(yScreenSize/2))*(zoomFactor-1)/viewZoom;
}
function onWorldMouse() {
  return([(mouseX/viewZoom)-viewX-(xScreenSize/2/viewZoom),(mouseY/viewZoom)-viewY-(yScreenSize/2/viewZoom)])
}
function keyPressed() {
  if (keyCode === 82) { // r reset values
    doBackup();
    for (var i = 0; i < gates.length; i++) {
      gates[i].value = 0;
    }
  }
  else if (keyCode === 88 || keyCode === 8) {// x or backspace delete gate
    for (var i = 0; i < gates.length; i++) {
      if (gates[i].selected === true) {
        removeGate(i);
        i -= 1;
      }
    }
    firstSelected = undefined;
  }
  else if (keyCode === 69) { // e reset selection
    doBackup();
    for (var i = 0; i < gates.length; i++) {
      gates[i].selected = false;
      firstSelected = undefined;
    }
  }
  else if (keyCode === 81) { // q do connection
    if (firstSelected !== undefined) {
      for (var i = 0; i < gates.length; i++) {
        if (gates[i].selected === true) {
          doConnection(firstSelected, i);
        }
      }
    }
  }
  else if (keyCode === 70) { // f cycle type of selected gates
    doBackup();
    for (var i = 0; i < gates.length; i++) {
      if (gates[i].selected === true) {
        gates[i].gateType += 1;
        if (gates[i].gateType >= typesF.length) {
          gates[i].gateType = 0;
        }
      }
    }
  }
  else if (keyCode === 90) { // z newGate
    newGate();
  }
  else if (keyCode === 66) { // b loadBackup/undo
    loadBackup();
  }
  // return false; // prevent any default behaviour
}
function isPressingGate() {
  for (var i = 0; i < gates.length; i++) {
    if (dist(Wmouse[0],Wmouse[1],gates[i].xPos,gates[i].yPos) < 50) {
      return([true, i]);
    }
  }
  return([false, 0]);
}
function newGate() {
  for (var i = 0; i < gates.length; i++) {
    if (gates[i].xPos === round(Wmouse[0]/100)*100 && gates[i].yPos === round(Wmouse[1]/100)*100) {
      return(false);
    }
  }
  doBackup();
  gates.push(new gate(round(Wmouse[0]/100)*100, round(Wmouse[1]/100)*100, 0));
  select(gates.length-1);
}
function doConnection(gate1, gate2) {
  if (gate1 === gate2) {
    return(false);
  }
  doBackup();
  for (var i = 0; i < connections.length; i++) {
    if (connections[i].connectionStart === gate1 && connections[i].connectionEnd === gate2) {
      connections.splice(i,1);
      return(false);
    } else if (connections[i].connectionStart === gate2 && connections[i].connectionEnd === gate1) {
      connections[i].connectionStart = gate1;
      connections[i].connectionEnd = gate2;
      return(false);
    }
  }
  connections.push(new connection(gate1, gate2));
}
function removeGate(gateID) {
  doBackup();
  for (var i = 0; i < connections.length; i++) {
    if (connections[i].connectionStart === gateID || connections[i].connectionEnd === gateID) {
      connections.splice(i,1);
      i -= 1;
    }
  }
  for (var i = 0; i < connections.length; i++) {
    if (connections[i].connectionStart > gateID) {
      connections[i].connectionStart -= 1;
    } if (connections[i].connectionEnd > gateID) {
      connections[i].connectionEnd -= 1;
    }
  }
  gates.splice(gateID,1);
}
function select(gateID) {
  // gates[gateID].selected = !gates[gateID].selected;
  if (gates[gateID].selected === false) {
    gates[gateID].selected = true;
    if (firstSelected === undefined) {
      firstSelected = gateID;
    }
  } else {
    gates[gateID].selected = false
    if (firstSelected === gateID) {
      firstSelected = undefined;
    }
  }
}
function selectDrag(startPos, endPos) {
  var xMax = Math.max(startPos[0], endPos[0]);
  var xMin = Math.min(startPos[0], endPos[0]);
  var yMax = Math.max(startPos[1], endPos[1]);
  var yMin = Math.min(startPos[1], endPos[1]);
  for (var i = 0; i < gates.length; i++) {
    if (gates[i].xPos < xMax && gates[i].xPos > xMin && gates[i].yPos < yMax && gates[i].yPos > yMin ) {
      select(i);
    }
  }
}
function doBackup() {
  if (backupWasDone === false) {
    console.log(connections);
    backup = [[],[]];
    backup[0] = gates.slice();
    backup[1] = connections.slice();
    console.log(backup[1]);
    backupWasDone = true;
  }
}
function loadBackup() {
  var oldGates = gates.slice();
  var oldConnections = connections.slice();
  gates = backup[0].slice();
  connections = backup[1].slice();
  backup[0] = oldGates.slice();
  backup[1] = oldConnections.slice();
}

function setup() { // p5.js setup
  createCanvas(xScreenSize, yScreenSize); // make new canvas to draw on
  noSmooth();
  typesI = [loadImage('gateImages/AND.png'), loadImage('gateImages/OR.png'), loadImage('gateImages/NAND.png'), loadImage('gateImages/NOR.png'), loadImage('gateImages/XOR.png'), loadImage('gateImages/NXOR.png'), loadImage('gateImages/hollow.png'), loadImage('gateImages/button.png')]; // list tat stores all gate types with images.
  for (var i = 0; i < 10; i++) {
    gates.push(new gate( round(random(-4,4))*100, round(random(-4,4))*100, i%typesI.length));
  }
  for (var i = 0; i < 10; i ++) {
    connections.push(new connection(floor(random(gates.length)), floor(random(gates.length))));
  }
  doBackup();
}

var Wmouse = [0,0];

function draw() { // main loop
  Wmouse = onWorldMouse();
  backupWasDone = false;

  ticksToBeDone += ticksPerFrame;
  while (ticksToBeDone >= 1) {
    fullTick();
    ticksToBeDone -= 1;
  }

  background(0); // set backgroun / delete old drawing
  // menu interface

  translate((xScreenSize/2),(yScreenSize/2));
  scale(viewZoom);
  translate(viewX,viewY);

  renderAll();

  if (selecting === true) {
    fill(0,0,255,50);
    stroke(0,0,255,255);
    strokeWeight(5);
    rectMode(CORNERS);
    rect(selectingStart[0], selectingStart[1], Wmouse[0], Wmouse[1]);
  } else {
    rectMode(CENTER);
    fill(0,0,0,0);
    stroke(127,127,127,100);
    strokeWeight(10);
    rect(round(Wmouse[0]/100)*100, round(Wmouse[1]/100)*100, 100, 100);
  }

  counter ++; // increment counter
}
