
function Destination(x, y) {
  this.x = x;
  this.y = y;
  this.collected = 0;
}

/**
 * Отрисовка и анимация, работа с SVG
 * @param step Number
 * @param size Number
 * @param board Snap
 * @constructor
 */
function VectorField(step, size, board) {
  this.step = step || 50;
  this.size = size || 10;
  this.destinations = [];
  this.board = board;
}

VectorField.prototype.setDestinations = function () {
  this.destinations = [
    new Destination(-this.size/2, this.size/2), // (-1,1)
    new Destination(this.size/2, this.size/2), // (0,0)
  ]
};

VectorField.prototype.drawDestinations = function (destCount /* Number */) {

};

/**
 *  Начальная отрисовка
 */
VectorField.prototype.draw = function () {
  var parts = this.size ;
  var board = this.board ;
  var step = this.step;
  var width = this.step * parts;

  var field = board.rect(0, 0, width, width).drag();
  field.attr('fill','#fff')

  var counter = 0;

  while(counter <= width+offset) {
    x = board.rect(offset, counter, width, 1);
    y = board.rect(counter, offset, 1, width);
    x.attr('fill','#eaf2f7');
    y.attr('fill','#eaf2f7');
    counter += step;
  }

  // оси
  // var X = board.line(offset, step*(points/2)+offset, width+offset, step*(points/2)+offset);
  // var Y = board.line(step*(points/2)+offset, offset, step*(points/2)+offset, width+offset);
  // var axis = new Snap.Set([X,Y]);
  // axis.attr({'stroke':'#576d7f','stroke-width':1});

    // декартовы координаты пунктов назначения
    destinations = [
      {n:1,x:0, y: width/2, count:0},
      {n:2,x:width/2, y:0, count:0},
      {n:3,x:-(width/2), y:0,count:0},
      {n:4,x:0, y:-(width/2),count:0},
      {n:5,x:width/2, y:-width/2,count:0},
      {n:6,x:-width/2, y:width/2,count:0},
      {n:7,x:width/2, y:width/2,count:0},
      {n:8,x:-width/2, y:-width/2,count:0}
    ];

    // точки назначения
    var pRad = 3;
    var p1 = board.circle(width/2, width, pRad).attr({fill:"green"});
    var p2 = board.circle(width, width/2, pRad);
    var p3 = board.circle(0, width/2, pRad);
    var p4 = board.circle(width/2, 0, pRad);
    var p5 = board.circle(width, 0, pRad);
    var p6 = board.circle(0, width, pRad);
    var p7 = board.circle(width, width, pRad);
    var p8 = board.circle(0, 0, pRad);

    var set = new Snap.Set([p1,p2,p3,p4,p5,p6,p7,p8]);
    // set.attr({'fill':'#15354f'});
    set.animate({r:15},3000, mina.elastic);

/**
 *  Расчеты и посторение пути
 * @param dotCount
 * @constructor
 */
function MonteCarlo(dotCount){
  this.dotCount = dotCount;
}


MonteCarlo.prototype.getProbability = function (destination /* Destination */) {

};


/**
 *  Точка входа в приложение
 */
(function(){
  var step = 50;
  var destinations = [];
  var points = 10;
  var width = step * points;
  var board = Snap("#board");
  var field = new VectorField(step, points, board);


  function start(){
      var Point = function(posX, posY, step){
        this._x = posX || 0;
        this._y = posY || 0;
        this._step = step;
        this._path = [this._x, this._y];
        this.onEdge = null;
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

      var dotsCount = 20;
      var finished = [];
      var stack = [];

      // создаем 100 точек
      for(var i = 0; i < dotsCount; i++) {
        stack.push(new Point(0,0,step));
      }

      // отправляем их в свободное движение
      while(finished.length < dotsCount) {
        stack.forEach(function(point, index, arr){
          point.randomStep();

          var curPos = point.getPos();

          destinations.forEach(function (dest) {
            if(curPos.x == dest.x && curPos.y == dest.y) {
              finished.push(point);
              dest.count += 1;
              delete arr[index];
            } else if(curPos.x == dest.x &&  curPos.x != 0) {
              point.onEdge = "x";
            } else if(curPos.y == dest.y && curPos.y != 0) {
              point.onEdge = "y";
            }
          });
        })
      }

      function animatePath(ball, path, counter) {
        ball.animate({
          cx:path[counter]+width/2,
          cy:path[counter+1]+width/2,
          x:path[counter]+width/2,
          y:path[counter+1]+width/2,
        },100,mina.backin, function(){
          if(counter < path.length-3) {
            counter += 2;
            animatePath(ball, path, counter);
          } else {
            ball.animate({r:25},100, mina.easeinout, function () {
              ball.animate({r:15},100, mina.easeout, function () {
                ball.remove();
              })
            })
          }
        });
      }

      finished.forEach(function (dot) {
        var ball = board.circle(width/2,width/2,3).attr({fill:'red'});
        var counter = 2;
        var path = dot.getPath();
        animatePath(ball,path,counter);
      });

      window.stack = stack;
      window.fin = finished;
      window.dest = destinations;
  }

  field.draw();
  field.start();
})();