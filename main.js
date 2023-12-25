const HOME = 0;
const SETTINGS = 1;
const PLAYING = 2;
let narrator;
let counter;
let backgroundmusic;

function animateNextStep(imgs, i, interval) {
    if (i <= 14) {
        imgs[i].classList.add("animation-show");
        i++;
        interval *= 0.9;
        setTimeout(() => {
            animateNextStep(imgs, i, interval);
        }, interval);
    } else {
        setTimeout(() => {
            switchPage(HOME);
        }, 5000);
    }
}

$(document).ready(() => {
    animateNextStep($(".animation-img"), 0, 1000);

    let settings = {
        narrator: "carmen",
        narratorVol: 100,
        background: "shidudawu",
        backgroundVol: 50,
        votingTimer: 5,
        actionTimer: 10,
        complexRolesDouble: true,
    };

    $(".character-toggle").click(function () {
        // toggle character active status
        if ($(this).hasClass("active")) {
            $(this).removeClass("active");
        } else {
            $(this).addClass("active");
        }

        refreshTotalActiveCharacterCount();
    });

    $(".stop").click(function () {
        if (narrator) {
            narrator.stop();
        }

        if (backgroundmusic) {
            backgroundmusic.stop();
        }

        if (counter) {
            counter.stop();
        }
    });

    $(".start").click(async function () {
        // hide chaaracters
        switchPage(PLAYING);
        // initialize counter
        counter = new Counter($("#counter"), settings.votingTimer * 60);

        // are any characters selected
        const count = countTotalActiveCharacters();
        if (count > 0) {
            const activeCharacters = getActiveCharacters();
            narrator = new Narrator(settings);
            const audios = collectNarratorAudios(narrator, activeCharacters, settings.narratorVol / 100.0);
            await narrator.loadAudioQueue(audios);
            if (settings.background != "keine") {
                await loadBackgroundMusic(settings);
            }

            narrator.start();
            if (settings.background != "keine") {
                backgroundmusic.play();
            }
        } else {
            // just start the discussion timer
            if (settings.background != "keine") {
                await loadBackgroundMusic(settings);
                backgroundmusic.play();
            }
            counter.start();
        }
    });

    $(".navigate-settings").click(function () {
        switchPage(SETTINGS);
    });

    $(".navigate-home").click(function () {
        switchPage(HOME);
    });

    $(".dropbtn").each(function () {
        let = $(this).click(function () {
            $(this).siblings(".dropdown-content").addClass("show");
        });
    });

    window.onclick = function (event) {
        if (!event.target.matches(".dropbtn")) {
            var dropdowns = document.getElementsByClassName("dropdown-content");
            var i;
            for (i = 0; i < dropdowns.length; i++) {
                var openDropdown = dropdowns[i];
                if (openDropdown.classList.contains("show")) {
                    openDropdown.classList.remove("show");
                }
            }
        }
    };

    $(".dropdown-content span").click(function () {
        // update label text
        $(this).parent().siblings(".chosen-setting").text($(this).attr("id").toUpperCase());
        // update settings
        if ($(this).parent().hasClass("background")) {
            settings.background = $(this).attr("id");
        } else if ($(this).parent().hasClass("narrator")) {
            settings.narrator = $(this).attr("id");
        }
    });

    $(".rs-range").on("input", function () {
        // update label
        showSliderValue($(this)[0], $(this).siblings("span")[0]);
        // update settings
        if ($(this).parent().hasClass("background")) {
            settings.backgroundVol = $(this).val();
        } else if ($(this).parent().hasClass("narrator")) {
            settings.narratorVol = $(this).val();
        } else if ($(this).parent().hasClass("voting-timer")) {
            settings.votingTimer = $(this).val();
        } else if ($(this).parent().hasClass("action-timer")) {
            settings.actionTimer = $(this).val();
        }
        console.log(settings);
    });

    $(".rs-range").each(function (i, rs) {
        respondToVisibility(rs, showSliderValue);
    });

    $("#tmp-28").on("input", function () {
        settings.complexRolesDouble = !settings.complexRolesDouble;
        console.log(settings);
    });
});

function switchPage(page) {
    $(".page.visible").each(function (i, p) {
        p.classList.remove("visible");
    });
    switch (page) {
        case SETTINGS:
            $(".page.settings").addClass("visible");
            break;

        case PLAYING:
            $(".page.playing").addClass("visible");
            break;

        default:
            $(".page.home").addClass("visible");
            break;
    }
}

function refreshTotalActiveCharacterCount() {
    const count = countTotalActiveCharacters();

    let startText = "";
    if (count > 0) {
        startText = "Start " + count;
    } else {
        startText = "Timer";
    }
    $(".start").text(startText);
}

function countTotalActiveCharacters() {
    let count = 0;
    $(".character-toggle.active").each(function () {
        count++;
    });
    return count;
}

function getActiveCharacters() {
    let activeCharacters = [];
    $(".character-toggle.active")
        .parent()
        .each(function (i, parent) {
            activeCharacters.push(parent.id.split("-")[0]);
        });
    return activeCharacters;
}

function collectNarratorAudios(narrator, activeCharacters, volume) {
    // TODO check if narrator exists
    const path = "./src/audio/narrators/" + narrator.name + "/";

    let audioQueue = [];
    // check for every character audio, if it should be added
    // except for the common audios, which will always be added

    // "Schließt eure Augen..."
    audioQueue.push(createNewAudio(path + "com01.mp3", 0, volume, narrator));

    // Doppelgängerin
    if (activeCharacters.indexOf("doppelgaengerin") > -1) {
        audioQueue.push(createNewAudio(path + "dop01.mp3", 2, volume, narrator));

        // Günstling
        if (activeCharacters.indexOf("guenstling") > -1) {
            audioQueue.push(createNewAudio(path + "dop_gue01.mp3", 1, volume, narrator));
            audioQueue.push(createNewAudio(path + "dop_gue02.mp3", 0, volume, narrator));
        }

        audioQueue.push(createNewAudio(path + "dop02.mp3", 0, volume, narrator));
    }

    // Werwölfe
    if (activeCharacters.indexOf("werwolf") > -1) {
        audioQueue.push(createNewAudio(path + "wer01.mp3", 0, volume, narrator));
        audioQueue.push(createNewAudio(path + "wer02.mp3", 1, volume, narrator));

        // Ungünstling
        if (activeCharacters.indexOf("unguenstling") > -1) {
            audioQueue.push(createNewAudio(path + "wer_ung01.mp3", 0, volume, narrator));
        }

        audioQueue.push(createNewAudio(path + "wer03.mp3", 0, volume, narrator));
    }

    // Günstling
    if (activeCharacters.indexOf("guenstling") > -1) {
        audioQueue.push(createNewAudio(path + "gue01.mp3", 1, volume, narrator));
        audioQueue.push(createNewAudio(path + "gue02.mp3", 0, volume, narrator));
        audioQueue.push(createNewAudio(path + "gue03.mp3", 0, volume, narrator));
    }

    // Freimaurer
    if (activeCharacters.indexOf("freimaurer") > -1) {
        audioQueue.push(createNewAudio(path + "fre01.mp3", 1, volume, narrator));
        audioQueue.push(createNewAudio(path + "fre02.mp3", 0, volume, narrator));
    }

    // Erbin
    if (activeCharacters.indexOf("erbin") > -1) {
        audioQueue.push(createNewAudio(path + "erb01.mp3", 1, volume, narrator));
        audioQueue.push(createNewAudio(path + "erb02.mp3", 0, volume, narrator));
    }

    // Seherin
    if (activeCharacters.indexOf("seherin") > -1) {
        audioQueue.push(createNewAudio(path + "seh01.mp3", 2, volume, narrator));
        audioQueue.push(createNewAudio(path + "seh02.mp3", 0, volume, narrator));
    }

    // Taschendiebin
    if (activeCharacters.indexOf("taschendiebin") > -1) {
        audioQueue.push(createNewAudio(path + "tas01.mp3", 2, volume, narrator));
        audioQueue.push(createNewAudio(path + "tas02.mp3", 0, volume, narrator));
    }

    // Schenkerin
    if (activeCharacters.indexOf("schenkerin") > -1) {
        audioQueue.push(createNewAudio(path + "sche01.mp3", 2, volume, narrator));
        audioQueue.push(createNewAudio(path + "sche02.mp3", 0, volume, narrator));
    }

    // Räuber
    if (activeCharacters.indexOf("raeuber") > -1) {
        audioQueue.push(createNewAudio(path + "rae01.mp3", 2, volume, narrator));
        audioQueue.push(createNewAudio(path + "rae02.mp3", 0, volume, narrator));
    }

    // Unruhestifterin
    if (activeCharacters.indexOf("unruhestifterin") > -1) {
        audioQueue.push(createNewAudio(path + "unr01.mp3", 2, volume, narrator));
        audioQueue.push(createNewAudio(path + "unr02.mp3", 0, volume, narrator));
    }

    // Prinzessin
    if (activeCharacters.indexOf("prinzessin") > -1) {
        audioQueue.push(createNewAudio(path + "pri01.mp3", 1, volume, narrator));
        audioQueue.push(createNewAudio(path + "pri02.mp3", 0, volume, narrator));
    }

    // Betrunkener
    if (activeCharacters.indexOf("betrunkener") > -1) {
        audioQueue.push(createNewAudio(path + "bet01.mp3", 1, volume, narrator));
        audioQueue.push(createNewAudio(path + "bet02.mp3", 0, volume, narrator));
    }

    // Bekiffter
    if (activeCharacters.indexOf("bekiffter") > -1) {
        audioQueue.push(createNewAudio(path + "bek01.mp3", 1, volume, narrator));
        audioQueue.push(createNewAudio(path + "bek02.mp3", 0, volume, narrator));
    }

    // Schlaflose
    if (activeCharacters.indexOf("schlaflose") > -1) {
        audioQueue.push(createNewAudio(path + "schl01.mp3", 1, volume, narrator));
        audioQueue.push(createNewAudio(path + "schl02.mp3", 0, volume, narrator));

        // Doppelgängerin
        if (activeCharacters.indexOf("doppelgaengerin") > -1) {
            audioQueue.push(createNewAudio(path + "dop_schl01.mp3", 1, volume, narrator));
            audioQueue.push(createNewAudio(path + "dop_schl02.mp3", 0, volume, narrator));
        }
    }

    // "Haltet Augen geschlossen"
    audioQueue.push(createNewAudio(path + "com02.mp3", 0, volume, narrator));
    audioQueue.push(createNewAudio(path + "com03.mp3", 0, volume, narrator));

    return audioQueue;
}

function createNewAudio(path, complexity, volume, narrator) {
    const audio = new Howl({
        src: [path],
        volume: volume,
        onend: function () {
            narrator.advance();
        },
    });
    return { audio: audio, complexity: complexity };
}

class Narrator {
    constructor(settings) {
        this.name = settings.narrator;
        this.index = 0;
        this.delayTime = settings.actionTimer;
        this.timeOut;
        this.complexRolesDouble = settings.complexRolesDouble;
    }

    async loadAudioQueue(audioQueue) {
        this.audioQueue = audioQueue;
    }

    advance() {
        let delay = 0;

        if (this.audioQueue[this.index].complexity === 0) {
            delay = 300;
        } else if (this.complexRolesDouble) {
            delay = this.audioQueue[this.index].complexity * this.delayTime * 1000;
        } else {
            delay = this.delayTime * 1000;
        }

        if (this.index < this.audioQueue.length - 1) {
            this.timeOut = setTimeout(() => {
                this.index++;
                this.audioQueue[this.index].audio.play();
            }, delay);
        } else {
            // final audio played, start countdown
            counter.start();
        }
    }

    start() {
        this.index = 0;
        this.audioQueue[this.index].audio.play();
    }

    stop() {
        this.audioQueue[this.index].audio.stop();
        Howler.unload();
        clearTimeout(this.timeOut);
    }
}

function showSliderValue(rs, rl) {
    rl.innerHTML = rs.value;
    var bulletPosition = rs.value / rs.max;
    const ratio = rs.getBoundingClientRect().width / (rs.getBoundingClientRect().width + rl.getBoundingClientRect().width * 0.45);
    rl.style.left = bulletPosition * ratio * rs.getBoundingClientRect().width + "px";
}

function respondToVisibility(element, callback) {
    var options = {
        root: document.documentElement,
    };

    var observer = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            //callback(entry.intersectionRatio > 0);
            callback(element, $(element).siblings("span")[0]);
        });
    }, options);

    observer.observe(element);
}

class Counter {
    constructor(div, maxTime) {
        this.div = div;
        this.div.text("NACHT");
        this.time = maxTime;
        this.timeOut;
        this.beep;
        this.boop;
    }
    start() {
        this.beep = new Howl({
            src: ["./src/audio/fx/beep.wav"],
        });
        this.boop = new Howl({
            src: ["./src/audio/fx/boop.wav"],
        });
        this.step();
    }

    step() {
        if (this.time >= 0) {
            if (this.time < 3) {
                this.beep.play();
            }
            this.timeOut = setTimeout(() => {
                this.displayTime();
                this.time--;
                this.step();
            }, 1000);
        } else {
            if (backgroundmusic) {
                backgroundmusic.stop();
            }
            this.stop();
            this.boop.play();
            switchPage(HOME);
        }
    }

    displayTime() {
        const timeString = "" + this.doubleDigify(Math.floor(this.time / 60)) + ":" + this.doubleDigify(this.time % 60);
        this.div.text(timeString);
    }

    doubleDigify(num) {
        if (num < 10) {
            return "0" + num;
        } else {
            return num;
        }
    }

    stop() {
        clearTimeout(this.timeOut);
    }
}

async function loadBackgroundMusic(settings) {
    backgroundmusic = new Howl({
        src: ["./src/audio/background/" + settings.background + ".mp3"],
        loop: true,
        volume: settings.backgroundVol / 100.0,
    });
}
