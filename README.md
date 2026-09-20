 # 🎵 Terminal Music Player

A lightweight **terminal-based music player built with Node.js and VLC**.

The application lets you play local audio files directly from your terminal, control playback using keyboard shortcuts, adjust volume, and automatically move to the next track when a song finishes.

---

## ✨ Features

* 🎵 Play local audio files
* ⏯️ Play / Pause music
* ⏭️ Next track
* ⏮️ Previous track
* 🔊 Increase / decrease volume
* ⏹️ Stop playback
* 🔄 Automatically play the next song
* 💻 Cross-platform support:

  * macOS
  * Linux
  * Windows
* 🖥️ Simple terminal-based interface
* 🔇 VLC runs without displaying its normal GUI

---

## 🛠️ Tech Stack

* **Node.js** — Application runtime
* **JavaScript** — Core programming language
* **VLC Media Player** — Audio playback engine
* **Node.js `child_process`** — Runs VLC as a child process
* **Node.js `readline`** — Handles keyboard input
* **Node.js `fs` & `path`** — Reads and manages music files
* **Node.js `os`** — Detects the operating system

---

## 📁 Project Structure

```text
music-player/
│
├── music/
│   ├── song1.mp3
│   ├── song2.wav
│   └── song3.flac
│
├── index.js
├── package.json
└── README.md
```

The `music` folder contains the audio files that the player can play.

Supported formats:

```text
.mp3
.wav
.flac
.ogg
.m4a
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd music-player
```

### 2. Install Node.js

Make sure Node.js is installed on your system.

Check your installation:

```bash
node --version
```

---

### 3. Install VLC

This project uses VLC as the audio playback engine.

Make sure VLC is installed before running the application.

The program expects VLC at:

#### macOS

```text
/Applications/VLC.app/Contents/MacOS/VLC
```

#### Linux

```text
cvlc
```

#### Windows

```text
vlc
```

If VLC is installed in a different location, update the `PLAYER_COMMAND` value in `index.js`.

---

### 4. Add music

Create a `music` directory inside the project:

```bash
mkdir music
```

Then place your audio files inside it.

For example:

```text
music/
├── song1.mp3
├── song2.mp3
└── song3.wav
```

---

### 5. Run the player

```bash
node index.js
```

You should see something similar to:

```text
==================================
    TERMINAL MUSIC PLAYER (VLC)
==================================
Status:  [ STOPPED ]
Ready to play 3 tracks.
----------------------------------
 Controls:
  [Space] Play / Pause
  [ N ]   Next Track
  [ P ]   Previous Track
  [ + / - ] Volume Up / Down
  [ S ]   Stop
  [ Q ]   Quit
==================================
```

---

## 🎮 Controls

| Key        | Action          |
| ---------- | --------------- |
| `Space`    | Play / Pause    |
| `N`        | Next Track      |
| `P`        | Previous Track  |
| `+` / `=`  | Increase Volume |
| `-`        | Decrease Volume |
| `S`        | Stop            |
| `Q`        | Quit            |
| `Ctrl + C` | Stop and Exit   |

---

## ⚙️ How It Works

The application uses **VLC as a child process** rather than playing audio directly through Node.js.

### 1. Load playlist

When the application starts, it scans the `music` directory and finds supported audio files.

```javascript
playlist = fs.readdirSync(MUSIC_DIR).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.mp3', '.wav', '.flac', '.ogg', '.m4a'].includes(ext);
});
```

### 2. Start VLC

When a track is selected, Node.js launches VLC using:

```javascript
spawn(PLAYER_COMMAND, [...PLAYER_ARGS, songPath]);
```

VLC then handles the actual audio playback.

### 3. Control VLC

The application communicates with VLC through its RC interface.

For example, pausing the current song sends:

```text
pause
```

and volume control sends:

```text
volup 2
```

or:

```text
voldown 2
```

### 4. Automatic next track

When VLC finishes playing a song, the child process emits a `close` event.

The application then starts the next track:

```javascript
playSong(currentIndex + 1);
```

This creates continuous playlist playback.

---

## 🧠 Architecture

```text
             ┌─────────────────────┐
             │      Terminal       │
             │   Keyboard Input    │
             └──────────┬──────────┘
                        │
                        ▼
             ┌─────────────────────┐
             │     Node.js App     │
             │                     │
             │ Playlist Management │
             │ Playback Controls   │
             │ UI / State          │
             └──────────┬──────────┘
                        │
                  Child Process
                        │
                        ▼
             ┌─────────────────────┐
             │         VLC         │
             │   Audio Playback    │
             └──────────┬──────────┘
                        │
                        ▼
                 🔊 Audio Output
```

---

## 🔑 Important Concepts Used

This project demonstrates several useful Node.js concepts:

### File System

The `fs` module is used to:

* Check whether the music directory exists
* Create the directory when necessary
* Read available music files

### Child Processes

Node's `child_process.spawn()` is used to launch VLC independently from the Node.js application.

### Events

The application listens for events from the VLC process:

```javascript
audioProcess.on('close', ...)
```

This allows the player to detect when a song has finished.

### Raw Keyboard Input

The `readline` module is used with raw terminal mode to detect individual key presses without requiring the user to press Enter.

### State Management

The application maintains playback state using variables such as:

```javascript
currentIndex
isPlaying
isPaused
audioProcess
```

---

## 🐛 Troubleshooting

### VLC is not found

If you receive an error related to VLC not being found, make sure VLC is installed and accessible.

You may need to change:

```javascript
PLAYER_COMMAND
```

to the correct VLC executable path on your system.

---

### No audio files found

Make sure your audio files are inside:

```text
music/
```

and use one of the supported extensions:

```text
.mp3
.wav
.flac
.ogg
.m4a
```

---

### Terminal controls aren't working

The application requires a terminal that supports raw keyboard input.

Run it directly in a terminal rather than through an environment that doesn't provide a TTY.

---

## 🚧 Future Improvements

Possible improvements for future versions:

* [ ] Display current playback time
* [ ] Seek forward/backward
* [ ] Shuffle mode
* [ ] Repeat mode
* [ ] Playlist selection
* [ ] Search songs
* [ ] Display song metadata
* [ ] Album artwork
* [ ] Persistent volume
* [ ] Queue management
* [ ] Better terminal UI
* [ ] Progress bar
* [ ] Configurable music directory

---

## 📌 Current Limitations

* VLC must be installed separately.
* Songs are loaded from the local `music` directory.
* The playlist is generated from the files available when the application starts.
* There is currently no persistent playlist or playback history.
* Playback depends on VLC's command-line/RC interface.

---

## 📄 License

This project is open source. You can modify and use it for personal or educational purposes.

---

## 👨‍💻 Author

**Daksh Goyal**

Built as a Node.js project to explore:

* Process management
* Event-driven programming
* File-system operations
* Terminal interfaces
* Integration with external applications
