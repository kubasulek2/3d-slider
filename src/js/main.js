//defining symbols for private members
const
  _rotationSpeed = Symbol('rotationSpeed'),
  _clickedId = Symbol('clickedId'),
  _easing = Symbol('easing'),
  _speedMeasure = Symbol('speedMeasure'),
  _motionData = Symbol('motionData'),
  _dynamicContent = Symbol('dynamicContent'),
  _calculateEntryValues = Symbol('calculateEntryValues'),
  _computeEasing = Symbol('computeEasing'),
  _computeRotatingTime = Symbol('_computeRotatingTime'),
  _applyEasing = Symbol('applyEasing'),
  _computeAvgSpeed = Symbol('computeAvgSpeed'),
  _getTargetAngle = Symbol('getTargetAngle'),
  _shouldChangeDirection = Symbol('shouldChangeDirection'),
  _restoreAnimation = Symbol('restoreAnimation'),
  _accelerate = Symbol('accelerate'),
  _updateContent = Symbol('updateContent');


class htmlElement {
  constructor(element){
    this.element = element
  }
  copy(){
    return this.element.clone()
  }
  remove(){
    this.element.remove()
  }
  append(parent){
      this.element.append(parent)
  }
}


class slider3d extends htmlElement{
  constructor(element ,speed){
    super(element);

    this.baseSpeed = speed > 1 ? 1 : speed;
    this.faces = this.element.children('.face');

    this[_rotationSpeed] = speed > 1 ? 1 : speed;
    this[_clickedId] = '';
    this[_easing] = [];
    this[_speedMeasure] = {
      start: undefined,
      stop: undefined,
      lastMeasuredAngle: undefined,
      speedArr: [],
      avgSpeed: undefined
    };
    this[_motionData] = {
      isAboutToStop: false,
      angleWhenClicked: undefined,
      currentAngle: 0,
      targetAngle: undefined,
      move: true
    };
    this[_dynamicContent] = {
      content: 1,
      willUpdate: true
    }
  }

  animateElement() {

    if ( !this[_speedMeasure].avgSpeed ) this[_calculateEntryValues]();

    if ( this[_motionData].move ){

      let rotationSpeed = this[_computeRotatingTime]();

      this[_computeAvgSpeed](rotationSpeed);
      this[_updateContent]();

      if (this[_easing].length !== 0) this[_applyEasing]();

      if(this[_easing].length === 0 && this[_rotationSpeed] < this.baseSpeed) this[_accelerate]();


      this[_motionData].currentAngle -= this[_rotationSpeed];
      this[_motionData].currentAngle = this[_motionData].currentAngle <= -360 ? 0 : this[_motionData].currentAngle;

      this.element.css( "transform", `rotateY(${this[_motionData].currentAngle}deg)` );

      // targetAngle is set in click event, so after click event rotation will stop

      if( Math.round(this[_motionData].currentAngle) === this[_motionData].targetAngle ){
        this[_motionData].move = false;
        this.element.css( "transform", `rotateY(${this[_motionData].targetAngle}deg)` )
      }

      window.requestAnimationFrame( ()=> this.animateElement() )
    }
    else {
      this.animateFace();
    }
  }

  animateFace(){

    let myPlane = this.faces.filter( ( i,el ) => $(el).attr('id') === this[_clickedId]);

    myPlane.addClass("focus")
  }

  faceClickEvent(){

    this.faces.on( 'click', (e)=> {

      this.faces.css('transition', 'transform 1s ease-in-out .3s');
      if( ! this[_motionData].isAboutToStop ){

        let target = $(e.currentTarget);
        e.stopPropagation();
        this[_getTargetAngle](e);
        this[_clickedId] = e.target.id;

        let direction = this[_shouldChangeDirection]();

        this[_motionData].isAboutToStop = true;
        this[_easing] = this[_computeEasing](direction);
        this[_motionData].angleWhenClicked = this[_motionData].currentAngle;

        target.css('cursor', 'initial');

        $('body')
          .css('cursor', 'pointer')
          .one('click', (e) => {
            this[_motionData].isAboutToStop = false;
            target.css('cursor', 'pointer');
            $(e.currentTarget).css('cursor', 'initial');
            this[_restoreAnimation]();
          });
      }
    })
  }

  [_calculateEntryValues]() {
    this[_speedMeasure].avgSpeed = (30 / ( this.baseSpeed * 60 ) );
  }

  [_computeRotatingTime](){

    let currentAngle = Math.abs( Math.floor(this[_motionData].currentAngle) );
    let rotationTime;
    let flag = !(currentAngle % 31);

    // return if current angle haven't change from last measurement
    if (this[_speedMeasure].lastMeasuredAngle === currentAngle){
      return null;
    }


    this[_speedMeasure].lastMeasuredAngle = currentAngle;


    if(this[_speedMeasure].measureAngle === currentAngle){
      this[_speedMeasure].stop = new Date();
      rotationTime =  (this[_speedMeasure].stop - this[_speedMeasure].start)/1000;
      return rotationTime;
    }
    //every 31 degrees start time, and angle, at which speed will be measured, are set
    if ( flag ) {
      this[_speedMeasure].measureAngle = this[_motionData].currentAngle === 360 ? 30 : currentAngle + 30;
      this[_speedMeasure].start = new Date();
    }
    return null
  }

  [_computeEasing](direction){
    let distance = Math.abs( Math.abs(this[_motionData].targetAngle) - Math.abs(this[_motionData].currentAngle) );

    let steps = distance < 20 ? 5 : 10;
    let threshold, delay, speed, speedChange, startEase, slowAngles, easing = [];
    let baseSpeed = this[_rotationSpeed];

    switch (true) {
      case distance <= 10 :
        delay = 0;
        break;
      case distance <= 20 :
        delay = 3;
        break;
      case distance <= 30 :
        delay = 8;
        break;
      case distance <= 40 :
        delay = 15;
        break;
      case distance <= 50 :
        delay = 24;
        break;
      case distance <= 60 :
        delay = 32;
        break;
      case distance <= 70 :
        delay = 40;
        break;
      case distance <= 80 :
        delay = 50;
        break;
      case distance <= 90 :
        delay = 60;
        break;

    }

    threshold = ( distance - delay ) / steps;
    speedChange = baseSpeed/steps;
    speed = baseSpeed;
    startEase = direction === "forth" ? this[_motionData].currentAngle - delay : this[_motionData].currentAngle + delay;
    slowAngles = startEase;

    threshold = direction === "forth" ? -threshold : threshold;


    for(let i = 1; i < steps; i++){
      slowAngles += threshold;
      speed -= speedChange;

      if ( speed > 0 ) speed = speed < 0.1 ? 0.1 : speed;
      else speed = speed > -0.1 ? -0.1 : speed;

      easing[i-1] = [];

      easing[i-1].push( Math.round( slowAngles ) );
      easing[i-1].push( parseFloat( speed.toFixed(2) ) );
    }
    return easing;

  }
  [_applyEasing](){

    this[_easing].forEach(  value => {
      if ( Math.round(this[_motionData].currentAngle) === value[0] )
        this[_rotationSpeed] = value[1];
    })
  }

  [_computeAvgSpeed](arg){

    if ( arg === null ) return;

    this[_speedMeasure].speedArr.push(arg);

    if ( this[_speedMeasure].speedArr.length > 4 ){
      this[_speedMeasure].speedArr.shift();

    }
    this[_speedMeasure].avgSpeed = this[_speedMeasure].speedArr.reduce((a,b) => a + b, 0) / this[_speedMeasure].speedArr.length;

  }

  [_getTargetAngle](e) {

    const targetId = $(e.target).attr("id");

    switch (targetId) {
      case "front":
        this[_motionData].targetAngle = 0;
        break;
      case "right":
        this[_motionData].targetAngle = -90;
        break;
      case "back":
        this[_motionData].targetAngle = -180;
        break;
      case "left":
        this[_motionData].targetAngle = -270;
        break;
    }
  }

  [_shouldChangeDirection](){
    let direction = "forth";
    if( this[_motionData].targetAngle === 0 ){
      //if clicked in front plane, which set target angle to 0 , must have special check, cause current angle is always lesser than 0

      this[_rotationSpeed] = this[_motionData].currentAngle < -180 ? this[_rotationSpeed] : - this[_rotationSpeed];

      direction = this[_motionData].currentAngle < -180 ? "forth" :  "back"

    } else if ( this[_motionData].currentAngle < this[_motionData].targetAngle ){
      //all the other cases
      this[_rotationSpeed] = -this[_rotationSpeed];
      direction = "back"
    }
    return direction
  }

  [_restoreAnimation](){
    let targetPlane = this.faces
      .filter( ( i,el ) => $(el).attr('id') === this[_clickedId]);
      targetPlane.removeClass("focus");
    this[_easing] = [];
    this[_motionData].move = true;
    this[_motionData].targetAngle = undefined;
    this[_clickedId] = '';
    this[_rotationSpeed] = this[_rotationSpeed] < 0 ? -this[_rotationSpeed] : this[_rotationSpeed];

    targetPlane.one('transitionend',  () => {
      this.animateElement();
    })

  }

  [_accelerate](){
    this[_rotationSpeed] =  parseFloat( ( this[_rotationSpeed] + 0.005 ).toFixed(3) );
  }

  [_updateContent](){

    if ( this[_motionData].currentAngle < -10 && this[_motionData].currentAngle > -20 && this[_dynamicContent].willUpdate){

      this[_dynamicContent].content = this[_rotationSpeed] > 0 ? this[_dynamicContent].content +2 : this[_dynamicContent].content;  //3/7/11...
      this[_dynamicContent].willUpdate = false;

      $(this.faces[2]).text(`face ${this[_dynamicContent].content}`);
      $(this.faces[3]).text(`face ${this[_dynamicContent].content +1}`);

    } else if (this[_motionData].currentAngle < -20 && this[_motionData].currentAngle > -30 && !this[_dynamicContent].willUpdate){

      this[_dynamicContent].willUpdate = true

    } else if ( this[_motionData].currentAngle < -190 && this[_motionData].currentAngle > -200 && this[_dynamicContent].willUpdate ){

      this[_dynamicContent].content = this[_rotationSpeed] > 0 ? this[_dynamicContent].content +2 : this[_dynamicContent].content; // 5/9/13...
      this[_dynamicContent].willUpdate = false;

      $(this.faces[0]).text(`face ${this[_dynamicContent].content}`);
      $(this.faces[1]).text(`face ${this[_dynamicContent].content + 1}`);

    } else if ( this[_motionData].currentAngle < -200 && this[_motionData].currentAngle > -210 && !this[_dynamicContent].willUpdate){

      this[_dynamicContent].willUpdate = true
    }
  }


}

let myElement = new slider3d($('#top-layer'),.7);

$(() => {


  myElement.animateElement();
  myElement.faceClickEvent();

});
