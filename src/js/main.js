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

class tetragon3d extends htmlElement{
  constructor(element ,speed){
    super(element);
    this.baseSpeed = speed > 1 ? 1 : speed;
    this.rotationSpeed = speed > 1 ? 1 : speed;
    this.clickedId = '';
    this.faces = this.element.children('.face');
    this.easing = [];
    this.speedMeasure = {
      start: undefined,
      stop: undefined,
      lastMeasuredAngle: undefined,
      speedArr: [],
      avgSpeed: undefined
    };
    this.motionData = {
      isAboutToStop: false,
      currentAngle: 0,
      targetAngle: undefined,
      move: true
    };
    this.dynamicContent = {
      content: 1,
      willUpdate: true
    }
  }
  calculateEntryValues() {
    this.speedMeasure.avgSpeed = (30 / ( this.rotationSpeed * 60 ) );

  }

  animateElement() {

    if ( !this.speedMeasure.avgSpeed ) this.calculateEntryValues();

    if ( this.motionData.move ){

      let rotationSpeed = this.computeRotatingTime();

      this.computeAvgSpeed(rotationSpeed);
      this.updateContent();

      if (this.easing.length !== 0) this.applyEasing();

      if(this.easing.length === 0 && this.rotationSpeed < this.baseSpeed) this.accelerate();


      this.motionData.currentAngle -= this.rotationSpeed;
      this.motionData.currentAngle = this.motionData.currentAngle <= -360 ? 0 : this.motionData.currentAngle;

      this.element.css( "transform", ` translateZ(-250px) rotateY(${this.motionData.currentAngle}deg)` );

      // targetAngle is set in click event, so after click event rotation will stop

      if( Math.round(this.motionData.currentAngle) === this.motionData.targetAngle ){
        this.motionData.move = false;
        this.element.css( "transform", ` translateZ(-250px) rotateY(${this.motionData.targetAngle}deg)` )
      }

      window.requestAnimationFrame( ()=> this.animateElement() )
    }
    else {
      this.animatePlane();
    }
  }


  computeEasing(direction){
    let distance = Math.abs( Math.abs(this.motionData.targetAngle) - Math.abs(this.motionData.currentAngle) );

    let steps = distance < 20 ? 5 : 10;
    let threshold, delay, speed, speedChange, startEase, slowAngles, easing = [];
    let baseSpeed = this.rotationSpeed;

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
    startEase = direction === "forth" ? this.motionData.currentAngle - delay : this.motionData.currentAngle + delay;
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
  applyEasing(){

    this.easing.forEach(  value => {
      if ( Math.round(this.motionData.currentAngle) === value[0] )
        this.rotationSpeed = value[1];
    })
  }
  computeRotatingTime(){

    let currentAngle = Math.abs( Math.floor(this.motionData.currentAngle) );
    let rotationTime;
    let flag = !(currentAngle % 31);

    // return if current angle haven't change from last measurement
    if (this.speedMeasure.lastMeasuredAngle === currentAngle){
      return null;
    }


    this.speedMeasure.lastMeasuredAngle = currentAngle;


    if(this.speedMeasure.measureAngle === currentAngle){
      this.speedMeasure.stop = new Date();
      rotationTime =  (this.speedMeasure.stop - this.speedMeasure.start)/1000;
      return rotationTime;
    }
    //every 31 degrees start time, and angle, at which speed will be measured, are set
    if ( flag ) {
      this.speedMeasure.measureAngle = this.motionData.currentAngle === 360 ? 30 : currentAngle + 30;
      this.speedMeasure.start = new Date();
    }
    return null
  }
  computeAvgSpeed(arg){

    if ( arg === null ) return;

    this.speedMeasure.speedArr.push(arg);

    if ( this.speedMeasure.speedArr.length > 4 ){
      this.speedMeasure.speedArr.shift();

    }
    this.speedMeasure.avgSpeed = this.speedMeasure.speedArr.reduce((a,b) => a + b, 0) / this.speedMeasure.speedArr.length;

  }

  getTargetAngle (e) {

    const targetId = $(e.target).attr("id");

    switch (targetId) {
      case "front":
        this.motionData.targetAngle = 0;
        break;
      case "right":
        this.motionData.targetAngle = -90;
        break;
      case "back":
        this.motionData.targetAngle = -180;
        break;
      case "left":
        this.motionData.targetAngle = -270;
        break;
    }
  }

  shouldChangeDirection(){
    let direction = "forth";
    if( this.motionData.targetAngle === 0 ){
      //if clicked in front plane, which set target angle to 0 , must have special check, cause current angle is always lesser than 0
      this.rotationSpeed = this.motionData.currentAngle < -180 ? this.rotationSpeed : -this.rotationSpeed;
      direction = this.motionData.currentAngle < -180 ? "forth" :  "back"
    } else if ( this.motionData.currentAngle < this.motionData.targetAngle ){
      //all the other cases
      this.rotationSpeed = -this.rotationSpeed;
      direction = "back"
    }
    return direction
  }

  animatePlane(){

    let myPlane = this.faces.filter( ( i,el ) => $(el).attr('id') === this.clickedId);

    myPlane.addClass("focus")
  }

  planeClickEvent(){
    this.faces.on( 'click', (e)=> {
      if( ! this.motionData.isAboutToStop ){

        let target = $(e.currentTarget);
        e.stopPropagation();
        this.getTargetAngle(e);
        this.clickedId = e.target.id;

        let direction = this.shouldChangeDirection();
        this.motionData.isAboutToStop = true;
        this.easing = this.computeEasing(direction);

        target.css('cursor', 'initial');

        $('body')
          .css('cursor', 'pointer')
          .one('click', (e) => {
            this.motionData.isAboutToStop = false;
            target.css('cursor', 'pointer');
            $(e.currentTarget).css('cursor', 'initial');
            this.restoreAnimation();
          });
      }

    })


  }

  restoreAnimation(){
    let targetPlane = this.faces
      .filter( ( i,el ) => $(el).attr('id') === this.clickedId);
      targetPlane.removeClass("focus");
    this.easing = [];
    this.motionData.move = true;
    this.motionData.targetAngle = undefined;
    this.clickedId = '';
    this.rotationSpeed = this.rotationSpeed < 0 ? -this.rotationSpeed : this.rotationSpeed;

    targetPlane.one('transitionend',  () => {
      this.animateElement();
    })

  }

  accelerate(){
    this.rotationSpeed =  parseFloat( ( this.rotationSpeed + 0.005 ).toFixed(3) );
  }

  updateContent(){

    if ( this.motionData.currentAngle < -10 && this.motionData.currentAngle > -20 && this.dynamicContent.willUpdate){

      this.dynamicContent.content = this.dynamicContent.content +2;  //3/7/11...
      this.dynamicContent.willUpdate = false;
      $(this.faces[2]).text(`face ${this.dynamicContent.content}`);
      $(this.faces[3]).text(`face ${this.dynamicContent.content +1}`);

    } else if (this.motionData.currentAngle < -20 && this.motionData.currentAngle > -30 && !this.dynamicContent.willUpdate){

      this.dynamicContent.willUpdate = true

    } else if ( this.motionData.currentAngle < -180 && this.motionData.currentAngle > -190 && this.dynamicContent.willUpdate ){

      this.dynamicContent.content = this.dynamicContent.content +2; // 5/9/13...
      this.dynamicContent.willUpdate = false;
      $(this.faces[0]).text(`face ${this.dynamicContent.content}`);
      $(this.faces[1]).text(`face ${this.dynamicContent.content + 1}`);
    } else if ( this.motionData.currentAngle < -190 && this.motionData.currentAngle > -200 && !this.dynamicContent.willUpdate){

      this.dynamicContent.willUpdate = true
    }
  }


}

let myElement = new tetragon3d($('#top-layer'),.5);

$(() => {


  myElement.animateElement();
  myElement.planeClickEvent();

});