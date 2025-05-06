let recognition;
let isRecognizing = false;
let lastTranscript = '';
let videoPaths = [];
let mergedVideoPaths = [];
let currentIndex = 0;
let isPlaying = false;
let bufferQueue = [];
const stopWords = new Set(['is', 'are', 'am', 'the', 'a', 'an', 'in', 'on', 'at', 'of', 'to', 'for', 'with', 'and', 'but']);

const assetsFolder = "/assets/";
const video1 = document.getElementById("video1");
const video2 = document.getElementById("video2");

function startRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Speech recognition not supported in this browser.");
        return;
    }

    recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = true;

    recognition.onstart = () => {
        isRecognizing = true;
        document.getElementById('status').innerText = 'Listening...';
    };

    recognition.onresult = async (event) => {
        const currentTranscript = event.results[event.results.length - 1][0].transcript.trim();
        if (!currentTranscript || currentTranscript === lastTranscript) return;

        lastTranscript = currentTranscript;

        const sentences = currentTranscript.match(/[^.!?]+[.!?]?/g);
        if (!sentences) return;

        for (const sentence of sentences) {
            const trimmed = sentence.trim();
            if (!trimmed) continue;

            if (isPlaying) {
                bufferQueue.push(trimmed);
            } else {
                await displaySignLanguageVideos(trimmed);
            }
        }
    };

    recognition.onerror = (event) => {
        document.getElementById('status').innerText = 'Error: ' + event.error;
    };

    recognition.onend = () => {
        isRecognizing = false;
        document.getElementById('status').innerText = 'Stopped.';
    };

    recognition.start();
}

function stopRecognition() {
    if (isRecognizing && recognition) {
        recognition.stop();
    }
}

function convertTextToSign() {
    const inputText = document.getElementById('manualText').value.trim();
    if (!inputText) {
        alert("Please enter some text.");
        return;
    }

    if (isPlaying) {
        bufferQueue.push(inputText);
    } else {
        displaySignLanguageVideos(inputText);
    }

    // Optional: clear textarea after submitting
    document.getElementById('manualText').value = '';
}

async function displaySignLanguageVideos(text) {
    isPlaying = true;
    document.getElementById('status').innerText = 'Loading videos...';

    const transcriptElement = document.getElementById('transcript');
    transcriptElement.innerHTML += "<br/>";

    videoPaths = [];
    currentIndex = 0;

    const cleanedText = text.toLowerCase().replace(/[^\w\s]/gi, '');
    const words = cleanedText.split(' ').filter(Boolean);

    for (let word of words) {
        const isStopWord = stopWords.has(word);
        const span = document.createElement('span');
        span.innerText = word;
        
        if (isStopWord) {
            span.classList.add('transcript-stopword');
            transcriptElement.appendChild(span);
        } else {
            const videoName = capitalizeFirstLetter(stemWord(word));
            const videoPath = videoName + ".mp4";
            const videoURL = assetsFolder + videoPath;

            try {
                const response = await fetch(videoURL);
                if (response.ok) {
                    span.classList.add('transcript-word');
                    transcriptElement.appendChild(span);
                    videoPaths.push({ path: videoPath, span, type: 'word' });
                    mergedVideoPaths.push(videoPath);
                } else {
                    for (const letter of word.toUpperCase()) {
                        const letterPath = letter + ".mp4";
                        const letterSpan = document.createElement('span');
                        letterSpan.innerText = letter;
                        letterSpan.classList.add('transcript-letter');
                        transcriptElement.appendChild(letterSpan);
                        videoPaths.push({ path: letterPath, span: letterSpan, type: 'letter' });
                        mergedVideoPaths.push(letterPath);
                    }
                }
            } catch (e) {
                console.error("Fetch failed for", word, e);
            }
        }

        // Add space after each word or letter group
        const space = document.createElement('span');
        space.innerHTML = '&nbsp;';
        space.style.marginRight = '6px';
        transcriptElement.appendChild(space);
    }

    if (videoPaths.length > 0) {
        playVideoQueue(() => {
            setTimeout(() => {
                isPlaying = false;
                if (bufferQueue.length > 0) {
                    const nextSentence = bufferQueue.shift();
                    displaySignLanguageVideos(nextSentence);
                } else {
                    document.getElementById('status').innerText = 'Listening...';
                }
            }, 1000);
        });
    } else {
        isPlaying = false;
        document.getElementById('status').innerText = 'No videos found.';
    }
}

function playVideoQueue(callback) {
    currentIndex = 0;
    video1.style.opacity = 1;
    video2.style.opacity = 0;
    playNext(video1, video2, callback);
}

function playNext(currentVideo, nextVideo, callback) {
    if (currentIndex >= videoPaths.length) {
        if (callback) callback();
        return;
    }

    const { path, span, type } = videoPaths[currentIndex];
    span.style.backgroundColor = type === 'letter' ? '#fff176' : '#64b5f6';
    span.style.fontWeight = 'bold';

    nextVideo.src = assetsFolder + path;
    nextVideo.load();

    nextVideo.oncanplay = () => {
        nextVideo.play();
        nextVideo.style.opacity = 1;
        currentVideo.style.opacity = 0;

        currentIndex++;
        nextVideo.onended = () => playNext(nextVideo, currentVideo, callback);
    };
}

function stemWord(word) {
    if (word.endsWith('ing')) return word.slice(0, -3);
    if (word.endsWith('ed')) return word.slice(0, -2);
    if (word.endsWith('s')) return word.slice(0, -1);
    return word;
}

function capitalizeFirstLetter(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

function downloadTranscript() {
    const transcript = document.getElementById('transcript').innerText;
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcript.txt';
    a.click();
    URL.revokeObjectURL(url);
}

function resetTranscript() {
    document.getElementById('transcript').innerText = '';
    videoPaths = [];
    mergedVideoPaths = [];
    lastTranscript = '';
    bufferQueue = [];
    currentIndex = 0;

    // Pause videos before clearing src
    video1.pause();
    video2.pause();

    // Reset video sources
    video1.src = '';
    video2.src = '';

    // Reset visual states
    video1.style.opacity = 1;
    video2.style.opacity = 0;

    // Reset final merged video and download link
    const finalVideo = document.getElementById('finalVideo');
    finalVideo.pause();
    finalVideo.src = '';
    finalVideo.style.display = 'none';

    const link = document.getElementById('downloadLink');
    link.href = '#';
    link.style.display = 'none';

    //  Reset recognition so it can be reinitialized properly
    recognition = null;

    // Reset status message
    document.getElementById('status').innerText = 'Reset. Press "Start Voice Recognition" to begin.';
}

async function downloadMergedVideo() {
    if (mergedVideoPaths.length === 0) {
        alert("No videos to merge.");
        return;
    }

    const response = await fetch('/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videos: mergedVideoPaths })
    });

    const result = await response.json();
    if (result.success) {
        const videoURL = '/merged/' + result.filename;
        const link = document.getElementById('downloadLink');
        const finalVideo = document.getElementById('finalVideo');

        finalVideo.src = videoURL;
        finalVideo.style.display = 'block';

        link.href = videoURL;
        link.style.display = 'inline-block';
        link.click();
    } else {
        alert("Merge failed: " + result.error);
    }
}