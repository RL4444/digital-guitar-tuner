import * as Pitchfinder from "pitchfinder";

const pitchMap = {
    "16 to 31.9": { C: 16, "C#": 17, D: 18, "D#": 20, E: 21, F: 22, "F#": 23, G: 25, "G#": 26, A: 28, "A#": 29, B: 31 },
    "32 to 63": { C: 33, "C#": 35, D: 37, "D#": 39, E: 41, F: 44, "F#": 46, G: 49, "G#": 52, A: 55, "A#": 58, B: 62 },
    "64 to 127.4": { C: 65, "C#": 69, D: 73, "D#": 78, E: 82, F: 87, "F#": 93, G: 98, "G#": 104, A: 110, "A#": 117, B: 124 },
    "127.5 to 254.4": { C: 131, "C#": 139, D: 147, "D#": 156, E: 165, F: 175, "F#": 185, G: 196, "G#": 208, A: 220, "A#": 233, B: 247 },
    "254.5 to 509.4": { C: 262, "C#": 278, D: 294, "D#": 311, E: 330, F: 349, "F#": 370, G: 392, "G#": 415, A: 440, "A#": 466, B: 494 },
    "509.5 to 1017.4": { C: 523, "C#": 554, D: 587, "D#": 622, E: 659, F: 699, "F#": 740, G: 784, "G#": 831, A: 880, "A#": 932, B: 988 },
    "1017.5 to 2034.4": {
        C: 1047,
        "C#": 1109,
        D: 1175,
        "D#": 1245,
        E: 1319,
        F: 1397,
        "F#": 1475,
        G: 1568,
        "G#": 1661,
        A: 1760,
        "A#": 1865,
        B: 1976,
    },
    "2034.5 to 4068.4": {
        C: 2093,
        "C#": 2218,
        D: 2349,
        "D#": 2489,
        E: 2637,
        F: 2794,
        "F#": 2960,
        G: 3136,
        "G#": 3322,
        A: 3520,
        "A#": 3729,
        B: 3951,
    },
    "4068.5 to 8000": {
        C: 4186,
        "C#": 4435,
        D: 4699,
        "D#": 4978,
        E: 5274,
        F: 5588,
        "F#": 5920,
        G: 6272,
        "G#": 6645,
        A: 7040,
        "A#": 7459,
        B: 7902,
    },
};

const getPitch = (inputFrequency) => {
    if (!inputFrequency) {
        return { isValidPitch: false };
    }

    // 1.05916; difference between each half note
    const SCALE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    let currentOctave;

    // find which octave the frequency belongs to
    Object.keys(pitchMap).forEach((eachOctave) => {
        const thisRange = eachOctave.split(" to ");
        const min = Number(thisRange[0]);
        const max = Number(thisRange[1]);

        if (inputFrequency >= min && inputFrequency <= max) {
            currentOctave = eachOctave;
        }
    });

    if (!currentOctave) {
        console.log("ERROR: invalid range -- input frequency must be between 16 - 8000 hz range. Your's was: ", inputFrequency);
        return { isValidPitch: false };
    }

    const frequencyIntervals = Object.values(pitchMap[currentOctave]);
    const baseFrequency = frequencyIntervals[0];
    const maxFrequency = frequencyIntervals[frequencyIntervals.length - 1];

    let closestPitch;
    let status; // sharp || flat || inTune

    for (let i = 0; i < frequencyIntervals.length; i++) {
        const currentFrequency = frequencyIntervals[i];
        const nextFrequency = frequencyIntervals[i + 1];

        if (inputFrequency < baseFrequency) {
            // must be flat and must be at the beginnning of the range
            closestPitch = "C";
            status = "flat";
            break;
        } else if (inputFrequency > maxFrequency) {
            // must be sharp and must be at the end of the range
            closestPitch = "B";
            status = "sharp";
            break;
        } else if (inputFrequency >= currentFrequency && inputFrequency <= nextFrequency) {
            const distanceFromMax = nextFrequency - inputFrequency;
            const distanceFromMin = inputFrequency - baseFrequency;

            // We use the mid point to determine when to tune up past the [i] note -> [i + 1] note.
            const midPoint = Math.abs(currentFrequency + (nextFrequency - currentFrequency) / 2);

            const frequencyWaveLength = nextFrequency - baseFrequency;

            if (Math.abs(distanceFromMax / frequencyWaveLength) * (100 / 1) < 3) {
                status = "inTune";
                // we are tuning up to the next note
                closestPitch = SCALE[i + 1];
            } else if (Math.abs(distanceFromMin / frequencyWaveLength) * (100 / 1) < 3) {
                status = "inTune";
                // we are tuning down to the [i] note frequency
                closestPitch = SCALE[i];
            } else if (inputFrequency < nextFrequency && inputFrequency > baseFrequency && inputFrequency > midPoint) {
                status = "flat";
                // we are tuning up to the next note
                closestPitch = SCALE[i + 1];
            } else if (inputFrequency > currentFrequency && inputFrequency < nextFrequency && inputFrequency < midPoint) {
                status = "sharp";
                // we are tuning down to the [i] note frequency
                closestPitch = SCALE[i];
            }
            break;
        }
    }

    const output = {
        closestPitch,
        status,
        isValidPitch: true,
        inputFrequency,
    };

    return output;
};

// mains switch
let IS_ON = false;

const flatIndicator = document.getElementById("flat-indicator");
const pitch = document.getElementById("pitch");
const sharpIndicator = document.getElementById("sharp-indicator");
const ledLightIndicator = document.getElementById("led-light-on-indicatior");

let audioContext;

const resetClasses = () => {
    if (flatIndicator.classList.contains("on")) {
        flatIndicator.classList.remove("on");
    }
    if (sharpIndicator.classList.contains("on")) {
        sharpIndicator.classList.remove("on");
    }
    if (flatIndicator.classList.contains("in-tune")) {
        flatIndicator.classList.remove("in-tune");
    }
    if (sharpIndicator.classList.contains("in-tune")) {
        sharpIndicator.classList.remove("in-tune");
    }
    pitch.innerText = "-";
};

const startListeningForPitch = async (myAudioBuffer) => {
    if (IS_ON) {
        pitch.innerText = "-";
        const float32Array = myAudioBuffer.getChannelData(0);

        const detectPitch = Pitchfinder.AMDF();
        const audioPitch = detectPitch(float32Array);

        if (!audioPitch) {
            return;
        }
        const result = getPitch(audioPitch);
        if (result.isValidPitch) {
            resetClasses();
            pitch.innerText = result.closestPitch ? result.closestPitch : "-";

            if (result.status === "inTune") {
                flatIndicator.classList.add("in-tune");
                sharpIndicator.classList.add("in-tune");
                console.log(flatIndicator.classList);
            } else if (result.status === "flat") {
                flatIndicator.classList.add("on");
            } else if (result.status === "sharp") {
                sharpIndicator.classList.add("on");
            }
        }
    } else {
        resetClasses();
    }
};

const toggleButton = (e) => {
    e.preventDefault();
    if (!IS_ON) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        ledLightIndicator.classList.toggle("on");
        let mediaStreamSource = null;
        let meter = null;

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
                mediaStreamSource = audioContext.createMediaStreamSource(stream);
                meter = createAudioMeter(audioContext);
                mediaStreamSource.connect(meter);
            });
        }

        function createAudioMeter(audioContext, clipLevel, averaging, clipLag) {
            const processor = audioContext.createScriptProcessor(512);
            processor.onaudioprocess = (stream) => startListeningForPitch(stream.inputBuffer);
            // stream object in proccessor
            // 			{
            // 				isTrusted: true
            // bubbles: true
            // cancelBubble: false
            // cancelable: false
            // composed: false
            // currentTarget: ScriptProcessorNode {clipping: false, lastClip: 0, volume: 0, clipLevel: 0.98, averaging: 0.95, …}
            // defaultPrevented: false
            // eventPhase: 0
            // inputBuffer: AudioBuffer {length: 512, duration: 0.011609977324263039, sampleRate: 44100, numberOfChannels: 2}
            // outputBuffer: AudioBuffer {length: 512, duration: 0.011609977324263039, sampleRate: 44100, numberOfChannels: 2}
            // playbackTime: 7.650975056689342
            // returnValue: true
            // srcElement: ScriptProcessorNode {clipping: false, lastClip: 0, volume: 0, clipLevel: 0.98, averaging: 0.95, …}
            // target: ScriptProcessorNode {clipping: false, lastClip: 0, volume: 0, clipLevel: 0.98, averaging: 0.95, …}
            // timeStamp: 9975.20000000298
            // type: "audioprocess"
            // 			}

            // this will have no effect, since we don't copy the input to the output,
            // but works around a current Chrome bug.
            processor.connect(audioContext.destination);

            processor.shutdown = function () {
                this.disconnect();
                this.onaudioprocess = null;
                audioContext.close();
            };

            return processor;
        }
    } else {
        if (audioContext) {
            audioContext.close();
        }
        resetClasses();
        pitch.innerText = "";
        ledLightIndicator.classList.toggle("on");
    }

    IS_ON = !IS_ON;
};

document.addEventListener("click", toggleButton);
