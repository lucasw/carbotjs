/*
 Copyright Lucas Walter January-February 2014
 
 This file is part of Foobar.

 Foobar is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 Foobar is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with Foobar.  If not, see <http://www.gnu.org/licenses/>.
 
 */

var KEYCODE_UP = 38;                
var KEYCODE_DOWN = 40;                
var KEYCODE_LEFT = 37;  
var KEYCODE_RIGHT = 39;        

var scale = 4;

document.onkeydown = handleKeyDown;

var wd;
var ht;
var loader;

var the_program;
var steering_wheel;

var palette;

var go_button;

var car;
// the destination parking spot
var goal;
var barriers = [];

var tile_wd = 70;
var tile_ht = tile_wd;
var grid_x = 4;
var grid_y = 4;
var pad = 4;

// TBD make a grid class
var grid_container;
var grid_x_min = 1;
var grid_y_min = 0;
var grid_x_max = 12;
var grid_y_max = 8;

function init() {
  stage = new createjs.Stage("carbot");

  wd = stage.canvas.width;
  ht = stage.canvas.height;

  var context = stage.canvas.getContext("2d");
  context.imageSmoothingEnabled = false;
  context.mozImageSmoothingEnabled = false;
  context.webkitImageSmoothingEnabled = false;

  manifest = [
    {src:"assets/car.png", id:"car"},
    {src:"assets/left.png", id:"left"},
    {src:"assets/right.png", id:"right"},
    {src:"assets/gas.png", id:"gas"},
    {src:"assets/brake_reverse.png", id:"brake_reverse"},
    {src:"assets/steering_wheel.png", id:"steering_wheel"},
    {src:"assets/reset.png", id:"reset"},
    {src:"assets/go.png", id:"go"}
  ];

  loader = new createjs.LoadQueue(false);
  loader.addEventListener("complete", handleComplete);
  loader.loadManifest(manifest);
}

// TODO this and CommandMove I think will merge
function Item(name, x, y) {
  var res = loader.getResult(name);
  console.log("name " + name + " " + res);
  this.im = new createjs.Bitmap(res);
  this.bounds = this.im.getBounds();
  this.im.scaleX = tile_wd/this.bounds.width;
  this.im.scaleY = tile_wd/this.bounds.height;
  this.im.x = x * tile_wd;
  this.im.y = y * tile_wd;
  console.log("new " + name + " at " + x + " " + y);
}

function clip(val, min, max) {
  return Math.max(Math.min(val, max), min); 
}
function clipE(val, ext) {
  return clip(val, -ext, ext); 
}

function makeCell(i, j, color) {
  var cell = new createjs.Shape();
  cell.wd = tile_wd;
  cell.ht = tile_ht;
  cell.x = i * tile_wd;
  cell.y = j * tile_ht;
  cell.graphics.beginFill(color).drawRect(
      pad, pad, 
      cell.wd - pad, cell.ht - pad
      );
  return cell;
}

function addCommandToScreen(handle, asset, y) {
  var go_cell = makeCell(0, y, "#22ff22");
  go_cell.addEventListener("click", handle);
  stage.addChild(go_cell);
  go_button = new Item(asset, 0, y);
  stage.addChild(go_button.im);
}

function pointInsideRect(x, y, rx, ry, rwd, rht) {
  
  return (
    (x > rx) &&
    (y > ry) &&
    (x < rx + rwd) &&
    (y < ry + rht) 
    );
}

function pointsInsideRect(x, y, rx, ry, rwd, rht, pad) {
  return (
          pointInsideRect(x + pad, y + pad, rx, ry, rwd, rht) ||
          pointInsideRect(x + pad, y - pad, rx, ry, rwd, rht) ||
          pointInsideRect(x - pad, y + pad, rx, ry, rwd, rht) ||
          pointInsideRect(x - pad, y - pad, rx, ry, rwd, rht)
          );
}

function pointsInsideCell(x, y, cell, pad) {
  var rx  = cell.x;
  var ry  = cell.y;
  var rwd = cell.wd;
  var rht = cell.ht;

  return pointsInsideRect(x, y , rx, ry, rwd, rht, pad);
}

function Car(name, x, y) {
  var that = new Item(name, x, y);
  that.im.regX = that.bounds.width/2;
  that.im.regY = that.bounds.height/2;

  that.turn_angle = 0;
  that.gas = 0;
  var velocity = 0;
  var angle = 0;
  //that.brake = 0;
  
  var initial_x = x * tile_wd;
  var initial_y = y * tile_wd;
  
  var vx;
  var vy;
  var x;
  var y;

  var turn_max = 0.04;

  var steering_wheel = new Item("steering_wheel", grid_x_max/2, grid_y_max); 
  steering_wheel.im.regX = steering_wheel.bounds.width/2;
  steering_wheel.im.regY = steering_wheel.bounds.height/2;
  stage.addChild(steering_wheel.im);
  
  that.reset = function() {
    that.turn_angle = 0;
    that.gas = 0;
    velocity = 0;
    angle = 0;
    vx = 0;
    vy = 0;
    x = initial_x;
    y = initial_y;
  }

  addCommandToScreen(that.reset, "reset", grid_y_max - 2);
  that.reset();

  that.crash = function() {
    vx = 0;
    vy = 0;
    velocity = 0;
    that.gas = 0;
  }

  that.update = function() {
    velocity += that.gas;

    that.turn_angle = clipE(that.turn_angle, turn_max);
    steering_wheel.im.rotation = that.turn_angle / turn_max * 50.0;

    //console.log(that.turn_angle);
    angle += that.turn_angle * velocity;
    that.im.rotation = -angle * 180.0 / Math.PI;
    vx = velocity * Math.sin(angle); 
    vy = velocity * Math.cos(angle); 
    
    var pad = 5;
    for (var i = 0; i < barriers.length; i++) {
      if (pointsInsideCell(x + vx, y + vy, barriers[i], pad)) {
        that.crash();
      }
    }

    x += vx;
    y += vy;
    //console.log(x + " clipped to " + clip(x, 0, grid_x_max * tile_wd) + " " + 
    //    grid_x_max * tile_wd);
    x = clip(x, 0, grid_x_max * tile_wd);
    y = clip(y, 0, grid_y_max * tile_wd);

    // friction
    velocity *= 0.9;
    that.gas *= 0.99;
    that.turn_angle *= 0.99;

    that.im.x = x;
    that.im.y = y;
  }
 
  return that;
}

// TODO make this and drawGrid take x1,y1,x2,y2 parameters and merge them
function Program() {
  var command_list = [];
  prog_cells = [];
  prog_results = [];

  var prog_counter = 0;
  var is_executing = false;

  var prog_x_min = 1;
  var prog_y_min = grid_y_max + 1;
  var prog_x_max = grid_x_max;
  var prog_y_max = prog_y_min + 1;

function ProgCell(i, j, new_ind) {
  this.cell = makeCell(i, j, "#bbffbb");
  var ind = new_ind;
  this.cell.addEventListener("click", removeCommand);// removeCommand(cell_list.length));
  prog_container.addChild(this.cell);

  function removeCommand() {
    if (ind >= command_list.length) {
      console.log("bad ind " + ind + " " + command_list.length);
      return;
    } 
    // TBD make this work better, shouldn't depend on these
    // indices to work
    console.log("remove ind " + ind + " " + command_list.length);
    for (var i = ind; i < command_list.length; i++) {
      command_list[i].item.im.x = prog_x_min + (i) * tile_wd;
    }
    prog_container.removeChildAt(ind + prog_x_max - prog_x_min);
    command_list.splice(ind, 1);
    console.log("remove ind " + ind + " " + command_list.length);
  
  
      for (var i = 0; i < prog_cells.length; i++) {
        prog_cells[i].cell.graphics.beginFill("#bb99bb").drawRect(
            pad, pad, tile_wd - pad, tile_ht - pad);
      }

    stage.update();
  }
}

function commandAdd(command_move) {
  if (command_list.length < prog_x_max - prog_x_min) {
    prog_container.addChild(command_move.item.im);
    stage.update();
    command_list.push(command_move);
  }
}

this.addLeft = function() {
  commandAdd(new CommandMove(-0.01, 0, "left"));
}
this.addRight = function() {
  commandAdd(new CommandMove( 0.01, 0, "right"));
}
this.addGas = function() {
  commandAdd(new CommandMove( 0,-1, "gas"));
}
this.addBrakeReverse = function() {
  commandAdd(new CommandMove( 0, 1, "brake_reverse"));
}


  var prog_container = new createjs.Container();
  stage.addChild(prog_container);
  drawProgram();
 
  // TODO remove redundancy with function name and text string
  addCommandToScreen(this.addGas, "gas", 0);
  addCommandToScreen(this.addLeft, "left", 1);
  addCommandToScreen(this.addRight, "right", 2);
  addCommandToScreen(this.addBrakeReverse, "brake_reverse", 3);
  addCommandToScreen(runProgram, "go", grid_y_max - 1);


// draw the visual container of the program
function drawProgram() {
  for (var i = prog_x_min; i < prog_x_max; i++) {
    for (var j = prog_y_min; j < prog_y_max; j++) {
      var prog_cell = new ProgCell(i, j, prog_cells.length)
      prog_cells.push(prog_cell);
    }
  }
  prog_results.length = prog_cells.length;
}

function runProgram(event) {
  console.log("execute");
  prog_counter = 0;
  is_executing = true;

  for (var i = 0; i < prog_cells.length; i++) {
    prog_cells[i].cell.graphics.beginFill("#bb99bb").drawRect(
        pad, pad, tile_wd - pad, tile_ht - pad);
  }
}

var update_count = 0;
this.update = function() {

  car.update();
  if (is_executing && (update_count %= 5)) {
    
    if (prog_counter < command_list.length) {
      var success = command_list[prog_counter].execute();
      prog_results[prog_counter] = success;

      for (var i = 0; i < prog_counter; i++) {
        var color = "#559955";
        if (!prog_results[i]) {
          color = "#995555";
        }
        prog_cells[i].cell.graphics.beginFill(color).drawRect(
            pad, pad, tile_wd - pad, tile_ht - pad);
      }

      var color = "#22ff22";
      if (!success) {
        color = "#ff2222";
      }
      prog_cells[prog_counter].cell.graphics.beginFill(color).drawRect(
          pad, pad, tile_wd - pad, tile_ht - pad);
      prog_counter += 1;

      for (var i = prog_counter; i < prog_cells.length; i++) {
        prog_cells[i].cell.graphics.beginFill("#bb99bb").drawRect(
            pad, pad, tile_wd - pad, tile_ht - pad);
      }
    } else {

      console.log("done executing " + command_list.length);
      prog_counter = 0;
      is_executing = false;

    }
  }
  update_count += 1;
  stage.update(event);
}

function CommandMove(turn, gas, name) {
  
  this.item = new Item(name, prog_x_min + command_list.length, prog_y_min);
  
  var turn = turn;
  var gas = gas;

  this.execute = function() {
    car.turn_angle += turn;
    car.gas += gas;
    
    var success = true;
    update = true;
    return success;
  }

} // CommandMove

} // Program

function drawGrid() {
  grid_container = new createjs.Container();
  stage.addChild(grid_container);
  
  cell_list = []; 
  for (var j = grid_y_min; j < grid_y_max; j++) {
    for (var i = grid_x_min; i < grid_x_max; i++) {

      var cell;
      var make_barrier = (Math.random() > 0.95);
      if (make_barrier) {
        cell = makeCell(i, j, "#555555");
        barriers.push(cell);
      } else {
        cell = makeCell(i, j, "#eeeeee"); 
      }
      grid_container.addChild(cell);
      cell_list.push(cell);
    }
  }

  return cell_list;
}


function handleComplete() {
  

  the_program = new Program();
  grid_cells = drawGrid();

  car = new Car("car", 5, 5);
  stage.addChild(car.im);
  


  stage.update();

  createjs.Ticker.on("tick", tick);
  createjs.Ticker.setFPS(10);
}

// update limits commands from being added too quickly
var update = false;

function tick(event) {
 
  the_program.update();

  update = false;
}

function handleKeyDown(e) {
  // cross browse issue?
  if (!e) { var e = window.event; }

  if (update === false) 
  {
    update = true;
  switch (e.keyCode) {
    case KEYCODE_LEFT:
      the_program.addLeft();
      return false;
    case KEYCODE_RIGHT:
      the_program.addRight();
      return false;
   case KEYCODE_UP:
      the_program.addGas();
      return false;
   case KEYCODE_DOWN:
      the_program.addBrakeReverse();
      return false;
  }
  }
}

