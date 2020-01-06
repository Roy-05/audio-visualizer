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
    numOfBars;

//Initialize canvas
window.addEventListener('DOMContentLoaded', ()=>{
    setCanvasSize();
    drawCanvas();
    circle();
});

/**
 * minDecibels and maxDecibels are double values to scale FFT data
 * 0 dB is loudest possible sound. 
 * -100dB is the default value for mindB -30dB is the default value for maxdB
 * smoothingTimeConstraint represents an average between the current buffer and the last buffer 
 * the AnalyserNode processed, rsulting in a smoother set of value changes. Default: 0.8
 * Source: https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode
 */
analyser.minDecibels = -90;
analyser.maxDecibels = -10;
analyser.smoothingTimeConstant = 0.88;

const source = audioCtx.createMediaElementSource(audioElem);
source.connect(analyser);
analyser.connect(audioCtx.destination);

/*
function visualize() {

    //Create Analyser Node to extract data from Audio Source
    analyser.fftSize = 256;
    
    const bufferLength = analyser.frequencyBinCount;
    let dataArray = new Uint8Array(bufferLength);

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    const draw = () => {
        if(playButton.dataset.playing === 'false') {
            canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
            canvasCtx.fillStyle = 'rgb(0, 0, 0)';
            canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
            return;
        }
    
        drawVisual = requestAnimationFrame(draw);

        //Returns frequency data on a scale of 0-255
        analyser.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

        let barHeight,
            barWidth = Math.floor((WIDTH/bufferLength) * 2.25);

        barWidth = barWidth < 15 ? barWidth : 15;
        numOfBars = Math.floor(WIDTH/(barWidth+1)),
            
        let x = Math.floor((WIDTH - (barWidth+1)*numOfBars)/2); //dynamically assign starting position

        for(let i = 0; i<numOfBars; i++) {
            barHeight = Math.floor((dataArray[i]/255) * 150); //scale heights
            
            //Color Gradient red -> yellow
            canvasCtx.fillStyle = 'rgb(255, ' + Math.ceil(i*255/numOfBars) + ', 0)'; 
            canvasCtx.fillRect(x, HEIGHT-barHeight, barWidth, barHeight);
            
            x += barWidth + 1;
        }
    };

    draw();

}
*/

function setCanvasSize() {
    canvas.width =  window.innerWidth > 1000? 1000 : window.innerWidth;
    canvas.height = 600
    WIDTH = canvas.width;
    HEIGHT = canvas.height;
}

function drawCanvas(){
    canvasCtx.fillStyle = 'rgb(0, 0, 0)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
}

window.addEventListener('resize', ()=>{
    setCanvasSize();
    drawCanvas();
});

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

function circle() {
    canvasCtx.beginPath();
    canvasCtx.arc(WIDTH/2, HEIGHT/2,150, 0,2*Math.PI);
    canvasCtx.strokeStyle ='white';
    canvasCtx.stroke();
    let points = [],
        degree = 0;

    let barWidth = Math.floor((WIDTH/128) * 2.25);
    
    numOfBars = Math.floor(WIDTH/(barWidth+1));

    for(let i =1; i<=numOfBars; i++){
        let point = [WIDTH/2+Math.cos(degree*Math.PI/180)*150,HEIGHT/2+Math.sin(degree*Math.PI/180)*150];
        points[i-1] = point;
        degree += 360/numOfBars;
    }

    degree = 270;
    console.log(numOfBars);

    points.forEach(point => {
        canvasCtx.save();

        canvasCtx.translate(point[0], point[1]);
        canvasCtx.rotate(degree*Math.PI/180);
        canvasCtx.fillStyle = degree === 270? 'yellow' : 'red';
        canvasCtx.fillRect(-5, 0, 10, 50);
        degree+=360/numOfBars;
        console.log(degree);
        canvasCtx.restore();
    });
        
}


