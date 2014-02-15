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
    {src:"assets/go.png", id:"go"}
  ];

  loader = new createjs.LoadQueue(false);
  loader.addEventListener("complete", handleComplete);
  loader.loadManifest(manifest);
}

var palette;

var go_button;

var car;
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

// TODO this and CommandMove I think will merge
function Item(name, x, y) {
  var res = loader.getResult(name);
  console.log("name " + name + " " + res);
  this.im = new createjs.Bitmap(res);
  var bounds = this.im.getBounds();
  this.im.scaleX = tile_wd/bounds.width;
  this.im.scaleY = tile_wd/bounds.height;
  this.im.x = x * tile_wd;
  this.im.y = y * tile_wd;
  console.log("new " + name + " at " + x + " " + y);
}

function Car(name, x, y) {
  var that = new Item(name, x, y);

  that.vx = 0;
  that.vy = 0;
  that.x = x * tile_wd;
  that.y = y * tile_wd;

  that.update = function() {
    that.x += that.vx;
    that.y += that.vy;

    that.im.x = that.x;
    that.im.y = that.y;
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
  commandAdd(new CommandMove(-0.2, 0, "left"));
}
this.addRight = function() {
  commandAdd(new CommandMove( 0.2, 0, "right"));
}
this.addGas = function() {
  commandAdd(new CommandMove( 0,-1, "gas"));
}
this.addBrakeReverse = function() {
  commandAdd(new CommandMove( 0, 1, "brake_reverse"));
}

function addCommandToScreen(handle, asset, y) {
  var go_cell = makeCell(0, y, "#22ff22");
  go_cell.addEventListener("click", handle);
  stage.addChild(go_cell);
  go_button = new Item(asset, 0, y);
  stage.addChild(go_button.im);
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

this.update = function() {

  if (is_executing) {
    
    if (prog_counter < command_list.length) {
      var success = command_list[prog_counter].execute();
      prog_results[prog_counter] = success;
      car.update();

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
  stage.update(event);
}

function CommandMove(ndx, ndy, name) {
  
  this.item = new Item(name, prog_x_min + command_list.length, prog_y_min);
  
  var dx = ndx;
  var dy = ndy;

  this.execute = function() {
    car.vx += dx;
    car.vy += dy;
    
    var success = true;

    if (grid_x >= grid_x_max) {
      grid_x = grid_x_max - 1;
      success = false;
    }
    if (grid_y >= grid_y_max) {
      grid_y = grid_y_max - 1;
      success = false;
    }
    if (grid_y < grid_y_min) {
      grid_y = grid_y_min;
      success = false;
    }
    if (grid_x < grid_x_min) {
      grid_x = grid_x_min;
      success = false;
    }
    update = true;
    return success;
  }

} // CommandMove

} // Program

function makeCell(i, j, color) {
  var cell = new createjs.Shape();
  cell.x = i * tile_wd;
  cell.y = j * tile_ht;
  cell.graphics.beginFill(color).drawRect(pad, pad, tile_wd - pad, tile_ht - pad);
  return cell;
}

function drawGrid() {
  cell_list = []; 
  for (var j = grid_y_min; j < grid_y_max; j++) {
    for (var i = grid_x_min; i < grid_x_max; i++) {
      var cell = makeCell(i, j, "#cccccc"); 
      cell_list.push(cell);
      grid_container.addChild(cell);
    }
  }

  return cell_list;
}

var the_program;

function handleComplete() {
  
  grid_container = new createjs.Container();
  stage.addChild(grid_container);
  grid_cells = drawGrid();

  the_program = new Program();

  car = new Car("car", 5, 5);
  stage.addChild(car.im);

  stage.update();

  createjs.Ticker.on("tick", tick);
  createjs.Ticker.setFPS(2);
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

