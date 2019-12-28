
const AudioContext = window.AudioContext || window.webkitAudioContext;

//Create new Audio Context
const audioContext = new AudioContext();

//Get Canvas Context
const canvas = document.getElementById("canvas");
const canvasContext = canvas.getContext('2d');

//To get the audio Element
const audioElem = document.querySelector("audio");

//Pass it to the Audio Context
const track = audioContext.createMediaElementSource(audioElem);
track.connect(audioContext.destination);

//Create canvas
canvasContext.fillStyle = 'rgb(0, 0, 0)';
canvasContext.fillRect(0, 0, canvas.width, canvas.height);

//Add the Play/Pause Functionality
const playButton = document.querySelector("button");

playButton.addEventListener('click', ()=>{

    //Chrome policy: suspended state = Autoplay is denied
    //Need to resume audioContext initially
    if (audioContext.state === 'suspended') {
        audioContext.resume();
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


