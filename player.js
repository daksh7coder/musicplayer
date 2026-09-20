const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');
const readline = require('readline');

const MUSIC_DIR = path.join(__dirname, 'music');
let PLAYER_COMMAND = '';
const PLAYER_ARGS = [
    '-I', 'dummy',      
    '--extraintf', 'rc',
    '--rc-fake-tty',         
    '--play-and-exit',       
    '--novideo',             
    '--quiet'                
];

switch (os.platform()) {
    case 'darwin': 
        PLAYER_COMMAND = '/Applications/VLC.app/Contents/MacOS/VLC'; 
        break;
    case 'linux': 
        PLAYER_COMMAND = 'cvlc'; 
        break;
    case 'win32': 
        PLAYER_COMMAND = 'vlc'; 
        break;
    default:
        console.error('Unsupported OS');
        process.exit(1);
}
let playlist = [];
let currentIndex = 0;
let isPlaying = false;
let isPaused = false;
let audioProcess = null;
let userTriggeredStop = false;
function loadPlaylist() {
    if (!fs.existsSync(MUSIC_DIR)) {
        fs.mkdirSync(MUSIC_DIR);
        console.log(`Created 'music' directory. Please add some audio files and restart.`);
        process.exit(0);
    }

    playlist = fs.readdirSync(MUSIC_DIR).filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.mp3', '.wav', '.flac', '.ogg', '.m4a'].includes(ext);
    });

    if (playlist.length === 0) {
        console.log(`No audio files found in ${MUSIC_DIR}. Please add some and restart.`);
        process.exit(0);
    }
}
function playSong(index) {
    if (audioProcess) {
        userTriggeredStop = true;
        audioProcess.kill(); 
    }

    if (index < 0) index = playlist.length - 1;
    if (index >= playlist.length) index = 0;
    
    currentIndex = index;
    const songPath = path.join(MUSIC_DIR, playlist[currentIndex]);

    userTriggeredStop = false;
    isPlaying = true;
    isPaused = false;

    // Spawn VLC child process
    audioProcess = spawn(PLAYER_COMMAND, [...PLAYER_ARGS, songPath]);

    audioProcess.on('close', (code) => {
        if (!userTriggeredStop && code === 0) {
            playSong(currentIndex + 1); 
        }
    });

    drawUI();
}

function togglePause() {
    if (!audioProcess) return;
    audioProcess.stdin.write('pause\n');
    
    isPaused = !isPaused;
    drawUI();
}

function stopSong() {
    if (audioProcess) {
        userTriggeredStop = true;
        audioProcess.stdin.write('quit\n');
        audioProcess.kill();
        audioProcess = null;
    }
    isPlaying = false;
    isPaused = false;
    drawUI();
}

function adjustVolume(direction) {
    if (!audioProcess) return;

    if (direction === 'up') {
        audioProcess.stdin.write('volup 2\n');
    } else if (direction === 'down') {
        audioProcess.stdin.write('voldown 2\n');
    }
}


function drawUI() {
    console.clear();
    console.log('==================================');
    console.log('    TERMINAL MUSIC PLAYER (VLC)   ');
    console.log('==================================');
    
    if (isPlaying) {
        const status = isPaused ? '[ PAUSED ]' : '[ PLAYING ]';
        console.log(`Status:  ${status}`);
        console.log(`Track:   ${playlist[currentIndex]} (${currentIndex + 1}/${playlist.length})`);
    } else {
        console.log(`Status:  [ STOPPED ]`);
        console.log(`Ready to play ${playlist.length} tracks.`);
    }

    console.log('----------------------------------');
    console.log(' Controls:');
    console.log('  [Space] Play / Pause');
    console.log('  [ N ]   Next Track');
    console.log('  [ P ]   Previous Track');
    console.log('  [ + / - ] Volume Up / Down');
    console.log('  [ S ]   Stop');
    console.log('  [ Q ]   Quit');
    console.log('==================================');
}

function setupCLI() {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true); 
    }

    process.stdin.on('keypress', (str, key) => {
        if (key.ctrl && key.name === 'c') {
            stopSong();
            process.exit();
        }

        switch (key.name) {
            case 'space':
                if (!isPlaying) playSong(currentIndex);
                else togglePause();
                break;
            case 'n':
                playSong(currentIndex + 1);
                break;
            case 'p':
                playSong(currentIndex - 1);
                break;
            case 's':
                stopSong();
                break;
            case 'q':
                stopSong();
                console.clear();
                console.log('Goodbye!');
                process.exit();
                break;
        }
        if (str === '+' || str === '=') {
            adjustVolume('up');
        } else if (str === '-') {
            adjustVolume('down');
        }
    });
}
function init() {
    loadPlaylist();
    setupCLI();
    drawUI();
}

init();