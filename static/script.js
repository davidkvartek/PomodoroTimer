class PomodoroTimer {
    constructor() {
        this.defaultDuration = 25;
        this.timeLeft = this.defaultDuration * 60;
        this.totalTime = this.defaultDuration * 60;
        this.intervalId = null;
        this.isRunning = false;

        this.timeDisplay = document.getElementById('time-display');
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.circle = document.querySelector('.progress-ring__circle');

        // New Controls
        this.durationInput = document.getElementById('duration-input');
        this.soundSelect = document.getElementById('sound-select');
        this.volumeInput = document.getElementById('volume-input');
        this.notificationToggle = document.getElementById('notification-toggle');

        this.circumference = 2 * Math.PI * 140;
        this.circle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;

        // Audio Engines
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.soundGenerator = new SoundGenerator();

        this.init();
    }

    init() {
        this.updateDisplay();

        this.startBtn.addEventListener('click', () => this.toggleTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());

        this.durationInput.addEventListener('change', () => this.updateDuration());
        this.soundSelect.addEventListener('change', (e) => this.handleSoundChange(e.target.value));
        this.volumeInput.addEventListener('input', (e) => this.handleVolumeChange(e.target.value));
        this.notificationToggle.addEventListener('change', () => this.handleNotificationToggle());
    }

    handleVolumeChange(value) {
        this.soundGenerator.setVolume(value);
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
    }

    updateDuration() {
        let minutes = parseInt(this.durationInput.value);
        if (isNaN(minutes) || minutes < 1) minutes = 1;
        if (minutes > 180) minutes = 180;

        this.durationInput.value = minutes;
        this.defaultDuration = minutes;

        if (!this.isRunning) {
            this.totalTime = minutes * 60;
            this.timeLeft = this.totalTime;
            this.updateDisplay();
        }
    }

    handleSoundChange(type) {
        if (type === 'off') {
            this.soundGenerator.stop();
        } else {
            this.soundGenerator.play(type);
        }
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const offset = this.circumference - (this.timeLeft / this.totalTime) * this.circumference;
        this.circle.style.strokeDashoffset = offset;
    }

    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        if (this.timeLeft === 0) return;

        this.isRunning = true;
        this.startBtn.textContent = 'Pause';
        this.startBtn.classList.remove('primary');
        this.startBtn.classList.add('secondary');

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        // Ensure background sound is playing if selected? 
        // Current design: background sound is independent toggle. 
        // We just ensure audio context is resumed.

        this.intervalId = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();

            if (this.timeLeft <= 0) {
                this.completeTimer();
            }
        }, 1000);
    }

    pauseTimer() {
        this.isRunning = false;
        this.startBtn.textContent = 'Start';
        this.startBtn.classList.add('primary');
        this.startBtn.classList.remove('secondary');
        clearInterval(this.intervalId);
    }

    resetTimer() {
        this.pauseTimer();
        this.totalTime = this.defaultDuration * 60; // Reset to current set duration
        this.timeLeft = this.totalTime;
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
                icon: '/static/icon.png' // Optional: assuming an icon might exist later
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});
