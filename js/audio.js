
//Get Canvas Context
const canvas = document.getElementById("canvas");
const canvasCtx = canvas.getContext('2d');

//Create canvas
canvasCtx.fillStyle = 'rgb(0, 0, 0)';
canvasCtx.fillRect(0, 0, canvas.width, canvas.height);


//Create new Audio Context
const audioCtx = new (window.AudioContext || window.webkitAudioContext);

//To get the audio Element
const audioElem = document.querySelector("audio");


//Create Analyser Node to extract data from Audio Source
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 256;

//Pass it to the Audio Context
const source = audioCtx.createMediaElementSource(audioElem);
source.connect(audioCtx.destination);
source.connect(analyser);

const bufferLength = analyser.frequencyBinCount;
let dataArray = new Uint8Array(bufferLength);



//Add the Play/Pause Functionality
const playButton = document.querySelector("button");

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
    }
    else if (playButton.dataset.playing === 'true') {
        audioElem.pause();
        playButton.dataset.playing =  'false';  
    }
}, false);


audioElem.addEventListener('ended', ()=> {
    playButton.dataset.playing = 'false';
}, false);



