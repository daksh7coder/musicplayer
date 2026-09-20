const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');
const readline = require('readline');

// --- Configuration ---
const MUSIC_DIR = path.join(__dirname, 'music');
let PLAYER_COMMAND = '';

// Standard VLC headless arguments:
// -I dummy: No graphical interface
// --play-and-exit: Closes VLC when the song finishes (triggers our 'close' event)
// --novideo: Disables video/album art window
// --quiet: Suppresses VLC's console output
const PLAYER_ARGS = ['-I', 'dummy', '--play-and-exit', '--novideo', '--quiet'];

// Determine the VLC command based on the Operating System
switch (os.platform()) {
    case 'darwin': // macOS
        // Use absolute path for Mac since VLC is rarely in the PATH by default
        PLAYER_COMMAND = '/Applications/VLC.app/Contents/MacOS/VLC'; 
        break;
    case 'linux': // Linux
        PLAYER_COMMAND = 'cvlc'; // Console VLC
        break;
    case 'win32': // Windows
        PLAYER_COMMAND = 'vlc'; // Must be in Environment Variables PATH
        break;
    default:
        console.error('Unsupported OS');
        process.exit(1);
}

// --- Application State ---
let playlist = [];
let currentIndex = 0;
let isPlaying = false;
let isPaused = false;
let audioProcess = null;
let userTriggeredStop = false;

// --- File Handling (Load Playlist) ---
function loadPlaylist() {
    if (!fs.existsSync(MUSIC_DIR)) {
        fs.mkdirSync(MUSIC_DIR);
        console.log(`Created 'music' directory. Please add some audio files and restart.`);
        process.exit(0);
    }

    // VLC supports many formats, expanded the filter list here
    playlist = fs.readdirSync(MUSIC_DIR).filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.mp3', '.wav', '.flac', '.ogg', '.m4a'].includes(ext);
    });

    if (playlist.length === 0) {
        console.log(`No audio files found in ${MUSIC_DIR}. Please add some and restart.`);
        process.exit(0);
    }
}

// --- Process Management & Audio Controls ---
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

    // Auto-play next song when VLC exits naturally
    audioProcess.on('close', (code) => {
        if (!userTriggeredStop && code === 0) {
            playSong(currentIndex + 1); 
        }
    });

    audioProcess.on('error', (err) => {
        console.clear();
        console.error(`\nError: Could not start VLC using command '${PLAYER_COMMAND}'.`);
        if (os.platform() === 'win32') {
            console.error(`Make sure VLC is installed and added to your Windows PATH.`);
        }
        process.exit(1);
    });

    drawUI();
}

function togglePause() {
    if (!audioProcess) return;

    if (isPaused) {
        // Send SIGCONT (Continue) signal
        audioProcess.kill('SIGCONT');
        isPaused = false;
    } else {
        // Send SIGSTOP signal to suspend process
        audioProcess.kill('SIGSTOP');
        isPaused = true;
    }
    drawUI();
}

function stopSong() {
    if (audioProcess) {
        userTriggeredStop = true;
        audioProcess.kill();
        audioProcess = null;
    }
    isPlaying = false;
    isPaused = false;
    drawUI();
}

// --- CLI UI & Input Handling ---
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
    });
}

// --- Initialization ---
function init() {
    loadPlaylist();
    setupCLI();
    drawUI();
}

init();