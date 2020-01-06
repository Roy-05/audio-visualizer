//Created by Saket Roy on 12/25/19

//Global Variables:
const canvas = document.getElementById("canvas"),
    audioCtx = new (window.AudioContext || window.webkitAudioContext),
    audioElem = document.querySelector("audio"),
    playButton = document.querySelector("button"),
    analyser = audioCtx.createAnalyser(),
    canvasCtx = canvas.getContext('2d');

let drawVisual,
    WIDTH,
    HEIGHT,
    RADIUS = 150;

//Initialize values to paint default canvas
let numOfBars = 56,
    barHeight = 4,
    barWidth = 15;

//Initialize canvas
window.addEventListener('DOMContentLoaded', ()=>{
    setCanvasSize();
    drawDefaultCanvas();
});

/**
 * minDecibels and maxDecibels are double values to scale FFT data
 * 0 dB is loudest possible sound. 
 * -100dB is the default value for mindB -30dB is the default value for maxdB
 * smoothingTimeConstant represents an average between the current buffer and the last buffer 
 * the AnalyserNode processed, rsulting in a smoother set of value changes. Default: 0.8
 * Source: https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode
 */
analyser.minDecibels = -90;
analyser.maxDecibels = -10;
analyser.smoothingTimeConstant = 0.88;

const source = audioCtx.createMediaElementSource(audioElem);
source.connect(analyser);
analyser.connect(audioCtx.destination);

function visualize() {

    //Create Analyser Node to extract data from Audio Source
    analyser.fftSize = 256;
    
    const bufferLength = analyser.frequencyBinCount;
    let dataArray = new Uint8Array(bufferLength);

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    const draw = () => {
        if(playButton.dataset.playing === 'false') {
            drawDefaultCanvas()
            return;
        }
    
        drawVisual = requestAnimationFrame(draw);

        //Returns frequency data on a scale of 0-255
        analyser.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

        barWidth = Math.floor((WIDTH/bufferLength) * 2.25);
        numOfBars = Math.floor(WIDTH/barWidth);

        barWidth = barWidth < 10 ? barWidth : 10;
        numOfBars = numOfBars < 60 ? numOfBars : 60;
        
        let points = [],
            degree = 315;

        for(let i =0; i<numOfBars; i++){
            let point = [WIDTH/2+Math.cos(degree*Math.PI/180)*RADIUS,HEIGHT/2+Math.sin(degree*Math.PI/180)*RADIUS];
            points[i] = point;
            degree += 360/numOfBars;
        }

        degree = 225;
        for(let i = 0; i<numOfBars; i++) {
            barHeight = Math.floor((dataArray[i]/255) * 140); //scale heights
            barHeight = barHeight > 0 ? barHeight : 4;
            canvasCtx.save();
            canvasCtx.translate(points[i][0], points[i][1]);
            canvasCtx.rotate(degree*Math.PI/180);
            canvasCtx.fillStyle = 'rgb(255, ' + Math.ceil(i*255/numOfBars) + ', 0)'; 
   
            roundRect(canvasCtx, 0, 0, barWidth, barHeight, 5, true)
            
            degree+=360/numOfBars;
            canvasCtx.restore();
        }
    };

    draw();

}


function setCanvasSize() {
    canvas.width =  window.innerWidth > 750? 750 : window.innerWidth;
    canvas.height = window.innerHeight < 650 ? window.innerHeight : 650;
    WIDTH = canvas.width;
    HEIGHT = canvas.height;
}

function drawDefaultCanvas(){
    let points = [],
        degree = 315;

    for(let i =0; i<numOfBars; i++){
        let point = [WIDTH/2+Math.cos(degree*Math.PI/180)*RADIUS,HEIGHT/2+Math.sin(degree*Math.PI/180)*RADIUS];
        points[i] = point;
        degree += 360/numOfBars;
    }

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    canvasCtx.fillStyle = 'rgb(0, 0, 0)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
    
    degree = 225;
    for(let i = 0; i<numOfBars; i++) {
        canvasCtx.save();
        canvasCtx.translate(points[i][0], points[i][1]);
        canvasCtx.rotate(degree*Math.PI/180);
        canvasCtx.fillStyle = 'rgb(255, ' + Math.ceil(i*255/numOfBars) + ', 0)'; 

        roundRect(canvasCtx, 0, 0, barWidth, barHeight, 5, true)
        
        degree+=360/numOfBars;
        canvasCtx.restore();
    }
}

window.addEventListener('resize', ()=>{
    setCanvasSize();
    drawDefaultCanvas();
});

/**
 * Source: https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
 * by Juan Mendes. Edited by Me for the specific use-case.
 * 
 * Draws a rounded rectangle using the current state of the canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} radius The corner radius
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 */ 
function roundRect(ctx, x, y, width, height, radius) {

    if(height < 5){
        radius = 2;
    }

    radius = {tl: radius, tr: radius, br: radius, bl: radius};
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    ctx.fill();
}

//Add the Play/Pause Functionality
playButton.addEventListener('click', ()=>{

    //Chrome policy: suspended state = Autoplay is denied
    //Need to resume audioCtx initially
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    //PLAY/PAUSE based on current state
    if (playButton.dataset.playing === 'false') {
        audioElem.play();
        playButton.dataset.playing =  'true';
        visualize()
    }
    else if (playButton.dataset.playing === 'true') {
        audioElem.pause();
        playButton.dataset.playing =  'false';  
        visualize()
    }
}, false);

audioElem.addEventListener('ended', ()=> {
    playButton.dataset.playing = 'false'; 
    visualize()
}, false);
