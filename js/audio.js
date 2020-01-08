//Created by Saket Roy on 12/25/19

//Global Variables:
const canvas = document.getElementById("canvas"),
    audioElem = document.querySelector("audio"),
    playButton = document.querySelector("button"),
    audioCtx = new (window.AudioContext || window.webkitAudioContext),
    source = audioCtx.createMediaElementSource(audioElem),
    analyser = audioCtx.createAnalyser(),
    canvasCtx = canvas.getContext('2d');

let drawVisual,
    points = [],
    WIDTH,
    HEIGHT,
    RADIUS = 130;

//Initialize values to paint default canvas
let numOfBars = 60,
    barHeight = 10,
    barWidth;

//Initialize canvas
window.addEventListener('DOMContentLoaded', ()=>{
    init(); 
});

window.addEventListener('resize', ()=>{
    setCanvasSize();
    drawDefaultCanvas();
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
        if(playButton.dataset.initialLoad === 'true'){
            addAudioInfo("Dog Soldier Stand Down", "Aglow Hollow")
            playButton.dataset.initialLoad = 'false';
        }
        audioElem.play();
        document.getElementById('song-name').className = 'animate';
        playButton.dataset.playing =  'true';
        visualize()
    }
    else if (playButton.dataset.playing === 'true') {
        audioElem.pause();
        document.getElementById('song-name').className = '';
        playButton.dataset.playing =  'false';  
        visualize()
    }
}, false);

audioElem.addEventListener('ended', ()=> {
    playButton.dataset.playing = 'false'; 
    playButton.dataset.initialLoad = 'true';
    removeAudioInfo();
    visualize()
}, false);


function init() {
    //Source: https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;
    analyser.smoothingTimeConstant = 0.88;

    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    //Set the height and width of the canvas
    setCanvasSize();
    //Set the bar width based on the size of the canvas;
    setBarWidth();
    //Draw the default canvas image
    drawDefaultCanvas();
}

function setCanvasSize() {
    canvas.width =  window.innerWidth < 600? window.innerWidth : 600;
    canvas.height = window.innerHeight < 600 ? window.innerHeight : 600;
    WIDTH = canvas.width;
    HEIGHT = canvas.height;
}

function setBarWidth() {
    let circumference = 2 * Math.PI * RADIUS;
    barWidth = Math.floor((circumference/numOfBars) * 2.25);
    barWidth = barWidth < 10 ? barWidth : 10;
}

function drawDefaultCanvas(){
    
    let degree = 315 
    for(let i =0; i<numOfBars; i++){
        let point = [WIDTH/2+Math.cos(degree*Math.PI/180)*RADIUS,HEIGHT/2+Math.sin(degree*Math.PI/180)*RADIUS];
        points[i] = point;
        degree += 360/numOfBars;
    }

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    degree = 225;
    for(let i = 0; i<numOfBars; i++) {
        canvasCtx.save();
        canvasCtx.translate(points[i][0], points[i][1]);
        canvasCtx.rotate(degree*Math.PI/180);
        
        let gdt = i/(numOfBars-1);
        canvasCtx.fillStyle = 'rgb('+ (245 - 4*gdt) +','+ (175 - 136*gdt) +', '+ (25 - 8*gdt) +')';

        roundRect(canvasCtx, 0, 0, barWidth, 5, 2, true)
        
        degree+=360/numOfBars;
        canvasCtx.restore();
    }
}

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

        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

        let degree = 225;
        for(let i = 0; i<numOfBars; i++) {

            //scale bar heights
            barHeight = Math.floor((dataArray[i]/255) * 175); 
            barHeight = barHeight > 5 ? barHeight : 5;

            canvasCtx.save();
            canvasCtx.translate(points[i][0], points[i][1]);
            canvasCtx.rotate(degree*Math.PI/180);

            let gdt = i/(numOfBars-1);
            canvasCtx.fillStyle = 'rgb('+ (245 - 4*gdt) +','+ (175 - 136*gdt) +', '+ (25 - 8*gdt) +')';
            
            roundRect(canvasCtx, 0, 0, barWidth, barHeight, 2, true)
            
            degree+=360/numOfBars;
            canvasCtx.restore();
        }
    };

    draw();

}

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

    radius = height <= 5 ? 2 : radius;
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
/**
 * 
 * @param {String} songName Name of the current Song
 * @param {String} artistName Name of the current Artist
 */
function addAudioInfo(songName, artistName) {
    const songNameElem = document.getElementById('song-name'),
        artistNameElem = document.getElementById('artist-name');

    let song = document.createTextNode(songName),
        artist = document.createTextNode(artistName);

    songNameElem.appendChild(song);
    artistNameElem.appendChild(artist);

}

function removeAudioInfo() {
    const songNameElem = document.getElementById('song-name'),
        artistNameElem = document.getElementById('artist-name');

    songNameElem.removeChild(songNameElem.firstChild);
    artistNameElem.removeChild(artistNameElem.firstChild);
}