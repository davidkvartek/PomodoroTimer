class TimerLogic {
    constructor(defaultDuration = 25, onTick = null, onComplete = null) {
        this.defaultDuration = defaultDuration;
        this.timeLeft = defaultDuration * 60;
        this.totalTime = defaultDuration * 60;
        this.isRunning = false;
        this.intervalId = null;
        this.onTick = onTick;
        this.onComplete = onComplete;
    }

    setDuration(minutes) {
        minutes = parseInt(minutes);
        if (isNaN(minutes) || minutes < 1) minutes = 1;
        if (minutes > 180) minutes = 180;

        this.defaultDuration = minutes;
        this.totalTime = minutes * 60;
        this.timeLeft = this.totalTime;
        return minutes;
    }

    start() {
        if (this.isRunning || this.timeLeft <= 0) return;
        this.isRunning = true;
        this.intervalId = setInterval(() => {
            this.tick();
        }, 1000);
    }

    pause() {
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    reset() {
        this.pause();
        this.timeLeft = this.totalTime;
    }

    tick() {
        this.timeLeft--;
        if (this.onTick) this.onTick(this.timeLeft, this.totalTime);

        if (this.timeLeft <= 0) {
            this.complete();
        }
    }

    complete() {
        this.pause();
        if (this.onComplete) this.onComplete();
    }
}

class PomodoroTimer {
    constructor() {
        // Initialize Logic
        this.logic = new TimerLogic(
            25,
            (timeLeft) => this.updateDisplay(),
            () => this.completeTimer()
        );

        // DOM Elements
        this.timeDisplay = document.getElementById('time-display');
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.circle = document.querySelector('.progress-ring__circle');

        // Controls
        this.durationInput = document.getElementById('duration-input');
        this.soundSelect = document.getElementById('sound-select');
        this.volumeInput = document.getElementById('volume-input');
        this.notificationToggle = document.getElementById('notification-toggle');

        this.circumference = 2 * Math.PI * 140;
        this.circle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;

        // Audio
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.soundGenerator = new SoundGenerator();

        this.init();
    }

    // Compatibility Getters/Setters for existing tests
    get timeLeft() { return this.logic.timeLeft; }
    set timeLeft(val) { this.logic.timeLeft = val; }
    get isRunning() { return this.logic.isRunning; }
    get defaultDuration() { return this.logic.defaultDuration; }
    set defaultDuration(val) { this.logic.defaultDuration = val; }
    get totalTime() { return this.logic.totalTime; }
    set totalTime(val) { this.logic.totalTime = val; }

    init() {
        this.loadPreferences();
        this.updateDisplay();

        this.startBtn.addEventListener('click', () => this.toggleTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());

        this.durationInput.addEventListener('change', () => this.updateDuration());
        this.soundSelect.addEventListener('change', (e) => this.handleSoundChange(e.target.value));
        this.volumeInput.addEventListener('input', (e) => this.handleVolumeChange(e.target.value));
        this.notificationToggle.addEventListener('change', () => this.handleNotificationToggle());
    }

    loadPreferences() {
        if (typeof localStorage === 'undefined') return;

        const savedDuration = localStorage.getItem('pomodoro-duration');
        if (savedDuration) {
            this.durationInput.value = savedDuration;
            this.logic.setDuration(savedDuration);
        }

        const savedSound = localStorage.getItem('pomodoro-sound');
        if (savedSound) {
            this.soundSelect.value = savedSound;
        }

        const savedVolume = localStorage.getItem('pomodoro-volume');
        if (savedVolume) {
            this.volumeInput.value = savedVolume;
            this.soundGenerator.setVolume(savedVolume);
        }

        const savedNotification = localStorage.getItem('pomodoro-notification');
        if (savedNotification !== null) {
            this.notificationToggle.checked = savedNotification === 'true';
        }
    }

    handleVolumeChange(value) {
        this.soundGenerator.setVolume(value);
        if (typeof localStorage !== 'undefined') localStorage.setItem('pomodoro-volume', value);
    }

    async handleNotificationToggle() {
        if (this.notificationToggle.checked) {
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    this.notificationToggle.checked = false;
                }
            } else if (Notification.permission === 'denied') {
                alert('Notification permission was denied. Please enable it in your browser settings.');
                this.notificationToggle.checked = false;
            }
        }
        if (typeof localStorage !== 'undefined') localStorage.setItem('pomodoro-notification', this.notificationToggle.checked);
    }

    updateDuration() {
        // Logic handles clamping
        const newDuration = this.logic.setDuration(this.durationInput.value);
        this.durationInput.value = newDuration; // Update input with clamped value
        if (typeof localStorage !== 'undefined') localStorage.setItem('pomodoro-duration', newDuration);

        if (!this.logic.isRunning) {
            this.updateDisplay();
        }
    }

    handleSoundChange(type) {
        if (typeof localStorage !== 'undefined') localStorage.setItem('pomodoro-sound', type);
        if (type === 'off') {
            this.soundGenerator.stop();
        } else {
            this.soundGenerator.play(type);
        }
    }

    updateDisplay() {
        const minutes = Math.floor(this.logic.timeLeft / 60);
        const seconds = this.logic.timeLeft % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (this.timeDisplay) {
            this.timeDisplay.textContent = timeString;
            if (typeof document !== 'undefined') {
                document.title = `(${timeString}) Pomodoro Timer`;
            }
        }

        if (this.circle) {
            const offset = this.circumference - (this.logic.timeLeft / this.logic.totalTime) * this.circumference;
            this.circle.style.strokeDashoffset = offset;
        }
    }

    toggleTimer() {
        if (this.logic.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        if (this.logic.timeLeft === 0) return;

        this.logic.start();

        this.startBtn.textContent = 'Pause';
        this.startBtn.classList.remove('primary');
        this.startBtn.classList.add('secondary');

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    pauseTimer() {
        this.logic.pause();
        this.startBtn.textContent = 'Start';
        this.startBtn.classList.add('primary');
        this.startBtn.classList.remove('secondary');
    }

    resetTimer() {
        this.pauseTimer();
        this.logic.reset();
        this.updateDisplay();
    }

    completeTimer() {
        this.pauseTimer();
        this.playNotification();
        this.startBtn.textContent = 'Start';
    }

    playNotification() {
        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, this.audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.5);

        gainNode.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        oscillator.start();
        oscillator.stop(this.audioCtx.currentTime + 0.5);

        this.sendNotification();
    }

    sendNotification() {
        if (this.notificationToggle.checked && Notification.permission === 'granted') {
            new Notification('Pomodoro Timer', {
                body: 'Time is up! Take a break or start a new session.',
                icon: '/static/icon.png'
            });
        }
    }
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Check if we are in a test environment (Node/Jest) or Browser
        if (document.getElementById('time-display')) {
            new PomodoroTimer();
        }
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TimerLogic, PomodoroTimer };
}
