class PomodoroTimer {
    constructor() {
        this.timeLeft = 25 * 60;
        this.totalTime = 25 * 60;
        this.intervalId = null;
        this.isRunning = false;

        this.timeDisplay = document.getElementById('time-display');
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.circle = document.querySelector('.progress-ring__circle');

        this.circumference = 2 * Math.PI * 140;
        this.circle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;

        // Simple beep sound using AudioContext
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        this.init();
    }

    init() {
        this.updateDisplay();
        this.startBtn.addEventListener('click', () => this.toggleTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
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
        this.startBtn.classList.add('secondary'); // Visual feedback

        // Resume AudioContext if suspended (browser policy)
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

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
        this.timeLeft = this.totalTime;
        this.updateDisplay();
    }

    completeTimer() {
        this.pauseTimer();
        this.playNotification();
        this.startBtn.textContent = 'Start'; // Reset button text
    }

    playNotification() {
        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, this.audioCtx.currentTime); // A4
        oscillator.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.5);

        gainNode.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        oscillator.start();
        oscillator.stop(this.audioCtx.currentTime + 0.5);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});
