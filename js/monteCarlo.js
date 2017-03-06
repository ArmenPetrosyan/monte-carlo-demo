/**
 * Точка назначения
 * @param x
 * @param y
 * @constructor
 */
function Destination(n, x, y) {
  this.n = n;
  this.x = x;
  this.y = y;
  this.collected = 0;
  this.animated = 0;
}

Destination.prototype.getTransformedCoords = function (size) {
  return {
    x: this.x + size/2,
    y: this.y + size/2
  }
};

Destination.prototype.collectOne = function () {
  return ++this.collected;
};

Destination.prototype.getProbability = function (all) {
  return this.collected/all;
};

/////////////////////////////////////////////////////////////////////////////

/**
 * Отрисовка и анимация, работа с SVG
 * @param step Number
 * @param size Number
 * @param board Snap
 * @constructor
 */
function VectorField(board) {
  this.board = board;
}

VectorField.prototype.init = function (step, size) {
  this.step = step || 50;
  this.size = size || 10;
  this.width = this.step * this.size;

  this.destinations = [
    new Destination(0, -this.width/2, this.width/2),  // (-1,1)
    new Destination(1,0, this.width/2),               // (0,1)
    new Destination(2,this.width/2, this.width/2),    // (1,1)
    new Destination(3,this.width/2, 0),               // (1,0)
    new Destination(4,this.width/2, -this.width/2),   // (1,-1)
    new Destination(5,0, -this.width/2),              // (0,-1)
    new Destination(6,-this.width/2, -this.width/2),  // (-1,-1)
    new Destination(7,-this.width/2, 0),              // (-1,0)
  ]
};

VectorField.prototype.destroy = function () {
  if(this.board) this.board.clear();
};

VectorField.prototype.drawDestinations = function (rad) {
  var rad = rad || 3;
  var set = new Snap.Set();
  this.destinations.forEach(function (destination) {
    var coords = destination.getTransformedCoords(this.width);
    var dest = this.board.circle(coords.x, coords.y, rad);
    var text = this.board.text(coords.x, coords.y+5, "0").attr({
      fill:'#fff',
      class:'text',
      "font-size": 12,
      style:"text-anchor: middle"
    });
    var group = this.board.g(dest,text);
    group.attr({
      class:"text-group",
      width: 15,
      height: 15
    })
    set.push(group)
  }.bind(this))
};

/**
 *  Начальная отрисовка
 */
VectorField.prototype.draw = function () {
  var board = this.board;
  var step = this.step;
  var width = this.width;

  var field = board.rect(0, 0, width, width);
  field.attr('fill', '#fff')

  var counter = 0;

  while (counter <= width) {
    x = board.rect(0, counter, width, 1);
    y = board.rect(counter, 0, 1, width);
    x.attr('fill', '#eaf2f7');
    y.attr('fill', '#eaf2f7');
    counter += step;
  }

  this.drawDestinations(15);
  // оси
  // var X = board.line(offset, step*(points/2)+offset, width+offset, step*(points/2)+offset);
  // var Y = board.line(step*(points/2)+offset, offset, step*(points/2)+offset, width+offset);
  // var axis = new Snap.Set([X,Y]);
  // axis.attr({'stroke':'#576d7f','stroke-width':1});

};

/**
 * Отрисовка пути
 * @param finishedDots [Point]
 */
VectorField.prototype.drawPathes = function (finishedDots) {
  var width = this.width;
  var board = this.board;
  var de = this.destinations;
  var texts = board.selectAll('.text');

  function animatePath(ball, path, counter, dest) {
    ball.animate({
      cx:path[counter]+width/2,
      cy:path[counter+1]+width/2,
      x:path[counter]+width/2,
      y:path[counter+1]+width/2
    },100,mina.backin, function(){
      if(counter < path.length-3) {
        counter += 2;
        animatePath(ball, path, counter, dest);
      } else {
        ball.animate({r:25},100, mina.easeinout, function () {
          ball.animate({r:15},100, mina.easeout, function () {
            ball.remove();

            // выводим вероятность
            var i = dest.n;
            de[i].animated += 1;
            var probability = (de[i].animated/finishedDots.length).toFixed(2);
            texts[i].attr({text:probability})
          })
        })
      }
    });
  }

  finishedDots.forEach(function (dot) {
    var ball = this.board.circle(width/2,width/2,3).attr({fill:'red'});
    var counter = 2;
    var path = dot.getPath();
    // console.log(dot.getDest())
    animatePath(ball,path,counter, dot.getDest());
  }.bind(this));
};

VectorField.prototype.getDestinations = function () {
  return this.destinations;
};

/////////////////////////////////////////////////////////////////////////////

/**
 *  Расчеты и посторение пути
 * @param dotCount
 * @constructor
 */
function MonteCarlo(dotCount){
  this.dotCount = dotCount;
  this.finishedDots = [];
  this.stack = [];
}


MonteCarlo.prototype.calculate = function (destinations, step) {
  // создаем 100 точек
  for(var i = 0; i < this.dotCount; i++) {
    this.stack.push(new Point(0,0,step));
  }

  // отправляем их в свободное движение
  while(this.finishedDots.length < this.dotCount) {
    this.stack.forEach(function(point, index, arr){
      point.randomStep();

      var curPos = point.getPos();

      destinations.forEach(function (dest) {
        if(curPos.x == dest.x && curPos.y == dest.y) {
          point.setDest(dest);
          this.finishedDots.push(point);
          dest.collectOne();
          delete arr[index];
        } else if(curPos.x == dest.x &&  curPos.x != 0) {
          point.onEdge = "x";
        } else if(curPos.y == dest.y && curPos.y != 0) {
          point.onEdge = "y";
        }
      }.bind(this));
    }.bind(this))
  }

  return this.finishedDots;
};

////////////////////////////////////////////////////////////////////////////////////

/**
 * Обработчик движения точки
 * @param posX
 * @param posY
 * @param step
 * @constructor
 */
var Point = function(posX, posY, step){
  this._x = posX || 0;
  this._y = posY || 0;
  this._step = step;
  this._path = [this._x, this._y];
  this.onEdge = null;
};

Point.prototype.setDest = function (dest) {
  this.destination = dest;
};

Point.prototype.getDest = function () {
  return this.destination;
};

Point.prototype.stepUp = function(){
  this._y += this._step;
  this._updatePath();
};

Point.prototype.stepDown = function(){
  this._y -= this._step;
  this._updatePath();
};

Point.prototype.stepLeft = function(){
  this._x -= this._step;
  this._updatePath();
};

Point.prototype.stepRight = function(){
  this._x += this._step;
  this._updatePath();
};

Point.prototype.getPos = function(){
  return {x:this._x, y: this._y}
};

Point.prototype.getPath = function(){
  return this._path;
};

Point.prototype._updatePath = function(){
  this._path.push(this._x, this._y);
};

Point.prototype.randomStep = function(){
  var luckyNum = Math.floor(Math.random()*10);

  switch(this.onEdge) {
    case null: freeMove.call(this,luckyNum);
      break;
    case 'x': verticalMove.call(this,luckyNum);
      break;
    case 'y': horizontalMove.call(this,luckyNum);
  }

  function freeMove(luckyNum) {
    if(luckyNum == 2) {
      this.stepUp();
    } else if(luckyNum == 4) {
      this.stepDown();
    } else if(luckyNum == 6) {
      this.stepLeft();
    } else if(luckyNum == 8) {
      this.stepRight();
    }
  }

  function horizontalMove(luckyNum) {
    if(luckyNum < 5) {
      this.stepLeft();
    } else {
      this.stepRight();
    }
  }

  function verticalMove(luckyNum) {
    if(luckyNum < 5) {
      this.stepUp();
    } else {
      this.stepDown();
    }
  }
};

/////////////////////////////////////////////////////////////////////////////

/**
 *  Точка входа в приложение
 */
(function(){

  var button = document.querySelector('#startButton');
  var board = Snap("#board");
  var field = new VectorField(board);
  field.init();
  field.draw();

  button.addEventListener("click", function(){

    var points = parseInt(document.querySelector("#cellNum").value);
    var step = parseInt(document.querySelector("#cellSize").value);
    var dotCount = parseInt(document.querySelector("#dots").value);
    

    field.destroy();
    field.init(step, points);
    var monte = new MonteCarlo(dotCount);

    field.draw();
    var dots = monte.calculate(field.getDestinations(), field.step);
    field.drawPathes(dots);

  });

})();