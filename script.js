var xScreenSize = innerWidth; // canvas size
var yScreenSize = innerHeight;
var version = 'Beta 0.5.1';
var gateSize = 100;
var connectionsVisible = true;
var connectionOpacity = 127;
var arrowOpacity = 255;
var viewX = 0;
var viewY = 0;
var viewZoom = 1.0;
var counter = 0; // loop counter counts ammountof times the main loop has been executed.
var gates = []; // list that keeps all the gates.
var connections = []; // list that keeps all the connections
var backup = ['','']; // list containing lists containng connections and gates before last action.
var popups = [];
var typesF = []; // list tat stores all gate types with cumputation functions.
var typesI = []; // list tat stores all gate types with images.
// var ticksToBeDone = 0;
// var ticksPerFrame = 1/3; // 20 tps (at 60 fps)
var backupWasDone = false;
var popupPadding = 10;
var popupTextSize = 30;
var tickInterval = 0;
var ticksPaused = true;
var tickRate = 40; // tps
var timeSpeedFactor = 2;

// tickALgorithim complexity = gates*2 + connections

document.addEventListener('contextmenu', event => event.preventDefault()); // prevent rightclick menu to make rihtclick control less annoying to use.

var JSLeerder = localStorage.getItem("JSLeerder"); // checks if game was played earlier
if (JSLeerder != "ja"){
  localStorage.setItem("JSLeerder", "ja"); // set local storage to default
  localStorage.setItem("JSLsaveGates", '');
  localStorage.setItem("JSLsaveConns", '');
}

function isPosit(x) { // returns true if x is 0 or higher
  return (x>=0); // statement that makes boolean
}

function posit(x) { // returns positive number
  if (isPosit(x)) {return(x)}; // simply return input if input is positive (or 0)
  return(-x); // return negative input
}

class gate {
  constructor(initX, initY, type, initVal) {
    this.xPos = initX; // x position of center of dot
    this.yPos = initY; // y position of center of dot
    this.size = size; // size/diameter of dor
    this.gateType = type;
    this.value = initVal;
    this.totalInputs = 0;
    this.trueInputs = 0;
    this.selected = false;
    this.rotation = 0;
    this.gotPressed = false
  }
  render() { // graphics, no calculations.
    push();
      if (this.selected === true) {
        stroke(0,0,255);
        strokeWeight(10);
        tint(127,127,255,255);
      } else {
        stroke(0,0,50);
        strokeWeight(2);
      }
      if (this.value === true) {
        fill(0,255,0);
      } else {
        fill(0,100,0);
      }
      translate(this.xPos, this.yPos);
      rotate(this.rotation * HALF_PI);
      translate(-this.xPos, -this.yPos);
      rectMode(CENTER);
      rect(this.xPos, this.yPos, gateSize, gateSize);
      imageMode(CENTER)
      image(typesI[this.gateType], this.xPos, this.yPos, gateSize, gateSize);
    pop();
  }
}

class popUp {
  constructor(x,y,xSize,ySize,popupText) {
    this.xPos = x;
    this.yPos = y;
    this.xSize = xSize;
    this.ySize = ySize;
    this.popupText = popupText;
  }
  render() {
    rectMode(CORNER);
    stroke(255,255,255,255);
    strokeWeight(5);
    fill(0,0,0,227);
    rect(this.xPos-popupPadding, this.yPos-popupPadding, this.xSize+popupPadding, this.ySize+popupPadding);
    fill(255,255,255,255);
    noStroke();
    textSize(popupTextSize);
    textAlign(CENTER, CENTER);
    text(this.popupText, this.xPos, this.yPos, this.xSize, this.ySize);
  }
}

class connection {
  constructor(comesFrom, goesTo) {
    this.connectionStart = comesFrom;
    this.connectionEnd = goesTo;
    this.color = color(random(50,200), random(50,200), random(50,200),connectionOpacity);
  }
  render() {
    stroke(this.color);
    strokeWeight(5);
    var gate1 = gates[this.connectionStart];
    var gate2 = gates[this.connectionEnd];
    line(gate1.xPos, gate1.yPos, gate2.xPos, gate2.yPos);
    var averageX = (gate1.xPos + gate2.xPos) / 2;
    var averageY = (gate1.yPos + gate2.yPos) / 2;
    push();
      if (gates[this.connectionStart].value === true) {
        fill(255, 255, 255, arrowOpacity);
      } else {
        fill(100, 100, 100, arrowOpacity);
      }
      translate(averageX, averageY);
      rotate(-atan2(gate2.xPos-gate1.xPos, gate2.yPos-gate1.yPos));
      triangle(-10,-15, 10,-15, 0, 15);
    pop();
  }
}

function tickConnections() {
  for (var i = 0; i < gates.length; i++) {
    gates[i].trueInputs = 0;
    gates[i].totalInputs = 0;
  }
  for (var i = 0; i < connections.length; i++) {
    var currentConn = connections[i];
    gates[currentConn.connectionEnd].totalInputs += 1;
    if (gates[currentConn.connectionStart].value === true) {
      gates[currentConn.connectionEnd].trueInputs += 1;
    }
  }
}

function gateAND(trueConnections, inputs, gate) {
  return(trueConnections == inputs && inputs>=1);
}
function gateOR(trueConnections, inputs, gate) {
  return(trueConnections >= 1);
}
function gateXOR(trueConnections, inputs, gate) {
  return(trueConnections%2 == 1);
}
function gateNAND(trueConnections, inputs, gate) {
  return(!(trueConnections == inputs));
}
function gateNOR(trueConnections, inputs, gate) {
  return(!(trueConnections >= 1));
}
function gateNXOR(trueConnections, inputs, gate) {
  return(!(trueConnections%2 == 1));
}
function gateLamp(trueConnections, inputs, gate) {
  return(gateAND(trueConnections, inputs))
}
function gateButton(trueConnections, inputs, gate) {
  if (gate.gotPressed) {
    gate.gotPressed = false;
    console.log(gate.gotPressed);
    return true;
  }
  return false;
}
function gateSwitch(trueConnections, inputs, gate) {
  var isPressed = gate.gotPressed
  if (gate.wasPressed === undefined) {
    gate.wasPressed = isPressed;
  } else if (isPressed) {
    if (gate.wasPressed === false) {
      gate.value = !gate.value;
      gate.wasPressed = true;
    }
  } else {
    gate.wasPressed = false;
  }
  gate.gotPressed = false;
  return(gate.value);
}
typesF = [gateAND, gateOR, gateNAND, gateNOR, gateXOR, gateNXOR, gateLamp, gateButton, gateSwitch];

function calcGate(gateType, trueConnections, inputs, gate) {
  return(typesF[gateType](trueConnections, inputs, gate));
}

function tickGates() {
  for (var i = 0; i < gates.length; i++) {
    gates[i].value = calcGate(gates[i].gateType, gates[i].trueInputs, gates[i].totalInputs, gates[i]);
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
  if (connectionsVisible === true) {
    for (var i = 0; i < connections.length; i++) {
      connections[i].render();
    }
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
    if (popups.length >= 1) {
      popups.splice(0,1);
    } else {
      dragging = true;
      drags = 0;
    }
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
  if (keyCode === 82) { // r rotate
    doBackup();
    for (var i = 0; i < gates.length; i++) {
      if (gates[i].selected) {
        gates[i].rotation += 1;
        if (gates[i].rotation >= 4) {
          gates[i].rotation = 0;
        }
      }
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
          if (!keyIsDown(16)){ // not shift
            doConnection(firstSelected, i);
          } else {            // shift
            doConnection(i, firstSelected);
          }
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
  else if (keyCode === 84) { // t tutorial.
    tutorial();
  }
  else if (keyCode === 87) { // w move gates up;
    moveSelectedGates(0, -gateSize);
  }
  else if (keyCode === 83) { // s move gates down
    moveSelectedGates(0, gateSize);
  }
  else if (keyCode === 65) { // a move left
    moveSelectedGates(-gateSize, 0);
  }
  else if (keyCode === 68) { // d move right
    moveSelectedGates(gateSize, 0);
  }
  else if (keyCode === 75) { // k saveToLocalStorage
    saveToLocalStorage();
    addPopup("World saved. Press L to load it later.");
  }
  else if (keyCode === 76) { // l loadFromLocalStorage
    loadFromLocalStorage();
    addPopup('Saved world loaded. Press B to restore your old world.');
  }
  else if (keyCode === 67) { // c copy and paste selected gates
    copyGates();
  }
  else if (keyCode === 79) { // o show/hide connections
    connectionsVisible = !connectionsVisible;
  } else if (keyCode === 188) { // < slowTime
    slowTime();
  } else if (keyCode === 190) { // > speedTime
    speedTime();
  } else if (keyCode === 80) { // p pause time
    pausePlayTime();
  }
  // return false; // prevent any default behaviour
}

function isPressingGate() {
  for (var i = 0; i < gates.length; i++) {
    if (dist(Wmouse[0],Wmouse[1],gates[i].xPos,gates[i].yPos) < gateSize/2) {
      return([true, i]);
    }
  }
  return([false, 0]);
}
function newGate() {
  var roundedMouseX = round(Wmouse[0]/gateSize)*gateSize;
  var roundedMouseY = round(Wmouse[1]/gateSize)*gateSize;
  for (var i = 0; i < gates.length; i++) {
    if (gates[i].xPos === roundedMouseX && gates[i].yPos === roundedMouseY) {
      return(false);
    }
  }
  gates.push(new gate(roundedMouseX, roundedMouseY, 0, false));
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
    }
    if (connections[i].connectionEnd > gateID) {
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
    balckup = ['',''];
    backup[0] = JSON.stringify(gates);
    backup[1] = JSON.stringify(connections);
    backupWasDone = true;
  }
}
function loadBackup() {
  var oldGates = JSON.stringify(gates);
  var oldConnections = JSON.stringify(connections);
  importJSONStrings(backup[0], backup[1]);
  backup[0] = oldGates;
  backup[1] = oldConnections;

}
function addPopup(popupText) {
  var popupSize = sqrt(popupText.length*1.1)*popupTextSize/2;
  if (popupSize*2 >= xScreenSize-20) {
    popups.push(new popUp(10, 10, xScreenSize-20, yScreenSize-20, popupText));
  } else {
    popups.push(new popUp((xScreenSize/2)-popupSize, (yScreenSize/2)-popupSize, popupSize*2, popupSize*2, popupText));
  }
}
function tutorial() {
  addPopup('Welcome to the turotial for JSlogic. This tutorial is shown with many popups. If you want to close a popup / want to see the next popup, click anywhere on the screen.');
  addPopup('Note that this program is not designed for mobile phones/tablets as many controls for editing the curcuit are dependent on a keyboard. Viewing an existing curcuit is still possible on all devises.');
  addPopup('By left clicking you can close any popup or place a new gate. You can also use leftclick to press a button. By right clicking you can select/unselect a gate.');
  addPopup('You can move the camera by dragging with the left mouse button and you can select/unselect an area by dragging with the right mouse button.');
  addPopup('You can zoom by scrolling up and down (pinchng or CTRL-scrolling does not work).');
  addPopup('You can delete a gate by middle-clicking on it or by first selecting it and then pressing X or BACKSPACE.');
  addPopup('You can move selected gates with WASD. Holding W, A, S or D does not work.')
  addPopup('Press Z to place a new gate or press E to unselect everything');
  addPopup('Press F to cycle the types of all selected gates (gates that are placed are selected by default).');
  addPopup('Press Q to make a connection from the first selected gate to all other selected gates. B is the undo button. (stands for Backup)');
  addPopup('Press K to save your world, and press L to load it later. Now only 1 local save is supported.');
  addPopup('Press C to copy all selected gates and connections between selected gates.');
  addPopup('Press O to show/hide the connections.');
  addPopup('Press R to rotate all selected gates 90 degrees clockwise or press T to view this tutorial again.');
  addPopup('This is version ' + version + ', changes and improvements are happening all the time.');
  addPopup('More features like the ability to share curcuits or have multipole saves are coming soon.');
  addPopup('This program was made by: CodeMaker4');
}
function checkMovingPossible(gateToBechecked, xMovement, yMovement) {
  for (var i = 0; i < gates.length; i++) {
    if (gates[i] !== gateToBechecked && gates[i].selected === false) {
      if (gateToBechecked.xPos + xMovement === gates[i].xPos && gateToBechecked.yPos + yMovement === gates[i].yPos) {
        return(false);
      }
    }
  }
  return (true);
}
function checkSelectedMovingPossible(xMovement, yMovement) {
  for (var i = 0; i < gates.length; i++) {
    if (gates[i].selected === true) {
      if (checkMovingPossible(gates[i], xMovement, yMovement) === false) {
        return(false);
      }
    }
  }
  return(true);
}
function moveSelectedGates(xMovement, yMovement) {
  if (checkSelectedMovingPossible(xMovement, yMovement)) {
    for (var i = 0; i < gates.length; i++) {
      if (gates[i].selected === true) {
        gates[i].xPos += xMovement;
        gates[i].yPos += yMovement;
      }
    }
  }
}
function importJSONStrings(gatesString, connectionsString) {
  gates = JSON.parse(gatesString);
  connections = JSON.parse(connectionsString);
  for (var i = 0; i < gates.length; i++) {
    gates[i] = new gate(gates[i].xPos, gates[i].yPos, gates[i].gateType, gates[i].value);
  }
  for (var i = 0; i < connections.length; i++) {
    connections[i] = new connection(connections[i].connectionStart, connections[i].connectionEnd);
  }
}
function saveToLocalStorage() {
  localStorage.setItem("JSLsaveGates", JSON.stringify(gates));
  localStorage.setItem("JSLsaveConns", JSON.stringify(connections));
}
function loadFromLocalStorage() {
  doBackup();
  importJSONStrings(localStorage.getItem("JSLsaveGates"), localStorage.getItem("JSLsaveConns"));
}
function copyGates() {
  var newGates = [];
  var oldIDs = []
  for (var i = 0; i < gates.length; i++) {
    if (gates[i].selected) {
      newGates.push(Object.assign(new gate(), JSON.parse(JSON.stringify(gates[i]))));
      oldIDs.push(i)
    }
  }

  for (var i = 0; i < connections.length; i++) {
    if (oldIDs.includes(connections[i].connectionStart) && oldIDs.includes(connections[i].connectionEnd)) {
      connections.push(new connection(gates.length+oldIDs.indexOf(connections[i].connectionStart), gates.length+oldIDs.indexOf(connections[i].connectionEnd)))
    }
  }

  for (var i = 0; i < gates.length; i++) { // unselect all old gates to prevent the collsion checking being skipped
    gates[i].selected = false;
  }
  var foundPlace = false;
  while (!foundPlace) {
    for (var i = 0; i < newGates.length; i++) {
      newGates[i].xPos += gateSize;
    }
    foundPlace = true;
    for (var i = 0; i < newGates.length; i++) {
      if (!checkMovingPossible(newGates[i], 0, 0)) {
        foundPlace = false;
        break;
      }
    }
  }
  for (var i = 0; i < newGates.length; i++) {
    gates.push(newGates[i]);
  }
}

function pausePlayTime() {
  if (ticksPaused) {
    updateTimeSpeed();
    ticksPaused = false;
  } else {
    clearInterval(tickInterval);
    ticksPaused = true;
  }
}
function updateTimeSpeed() {
  clearInterval(tickInterval);
  tickInterval = setInterval(fullTick, 1000/tickRate);
}
function slowTime() {
  tickRate = tickRate/timeSpeedFactor;
  if (tickRate < 1) {
    tickRate = 1;
  }
  updateTimeSpeed();
}
function speedTime() {
  tickRate = tickRate*timeSpeedFactor;
  if (tickRate > 160) {
    tickRate = 160;
  }
  updateTimeSpeed();
}

function setup() { // p5.js setup
  createCanvas(xScreenSize, yScreenSize); // make new canvas to draw on
  noSmooth();
  strokeCap(SQUARE)
  typesI = [loadImage('gateImages/AND.png'), loadImage('gateImages/OR.png'), loadImage('gateImages/NAND.png'), loadImage('gateImages/NOR.png'), loadImage('gateImages/XOR.png'), loadImage('gateImages/NXOR.png'), loadImage('gateImages/hollow.png'), loadImage('gateImages/button.png'), loadImage('gateImages/switch.png')]; // list tat stores all gate types with images.
  for (var i = 0; i < 10; i++) {
    gates.push(new gate( round(random(-4,4))*gateSize, round(random(-4,4))*gateSize, i%typesI.length, false));
  }
  for (var i = 0; i < 10; i ++) {
    connections.push(new connection(floor(random(gates.length)), floor(random(gates.length))));
  }
  doBackup();
  addPopup('press T for a tutorial, click anywhere to close this message.');
  pausePlayTime();
  frameRate(30);
}

var Wmouse = [0,0];

function draw() { // main loop
  Wmouse = onWorldMouse();
  backupWasDone = false;

  // ticksToBeDone += ticksPerFrame;
  // while (ticksToBeDone >= 1) {
  //   fullTick();
  //   ticksToBeDone -= 1;
  // }

  background(0); // set backgroun / delete old drawing

  translate((xScreenSize/2),(yScreenSize/2));
  scale(viewZoom);
  translate(viewX,viewY);

  if (mouseIsPressed && isPressingGate()[0]) {
    gates[isPressingGate()[1]].gotPressed = true;
  }

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
    rect(round(Wmouse[0]/gateSize)*gateSize, round(Wmouse[1]/gateSize)*gateSize, gateSize, gateSize);
  }

  // translate(-viewX,-viewY);
  // scale(1/viewZoom);
  // translate(-(xScreenSize/2),-(yScreenSize/2));
  resetMatrix();

  // menu interface
  for (var i = popups.length-1; i >= 0; i--) {
    popups[i].render();
  }

  textSize(15);
  fill(127,255);
  noStroke();
  textAlign(RIGHT, BOTTOM);
  text('JSlogics by Codemaker4. Version ' + version + '.', xScreenSize, yScreenSize);

  counter ++; // increment counter
}
