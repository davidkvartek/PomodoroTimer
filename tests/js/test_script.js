const expect = chai.expect;

describe('PomodoroTimer', function() {
    let timer;

    beforeEach(function() {
        // Reset DOM state if needed, or rely on the instance to pick up current state
        // Since script.js runs on DOMContentLoaded, we might have an auto-created instance.
        // We will create a fresh instance for testing.
        timer = new PomodoroTimer();
        
        // Mock AudioContext to avoid browser policy issues during tests
        // The real AudioContext is created in the constructor, but we can override or mock components if needed.
        // For simple logic testing, we validte state changes.
    });

    afterEach(function() {
        if (timer.isRunning) {
            timer.pauseTimer();
        }
    });

    describe('Initialization', function() {
        it('should initialize with default duration of 25 minutes', function() {
            expect(timer.defaultDuration).to.equal(25);
            expect(timer.timeLeft).to.equal(25 * 60);
        });

        it('should not be running initially', function() {
            expect(timer.isRunning).to.be.false;
        });
    });

    describe('Duration Update', function() {
        it('should update duration within limits', function() {
            timer.durationInput.value = 30;
            timer.updateDuration();
            expect(timer.defaultDuration).to.equal(30);
            expect(timer.timeLeft).to.equal(30 * 60);
        });

        it('should clamp minimum duration to 1', function() {
            timer.durationInput.value = -5;
            timer.updateDuration();
            expect(timer.defaultDuration).to.equal(1);
        });

        it('should clamp maximum duration to 180', function() {
            timer.durationInput.value = 200;
            timer.updateDuration();
            expect(timer.defaultDuration).to.equal(180);
        });
    });

    describe('Timer Control', function() {
        it('should start the timer', function() {
            timer.startTimer();
            expect(timer.isRunning).to.be.true;
            expect(timer.startBtn.textContent).to.equal('Pause');
        });

        it('should pause the timer', function() {
            timer.startTimer();
            timer.pauseTimer();
            expect(timer.isRunning).to.be.false;
            expect(timer.startBtn.textContent).to.equal('Start');
        });

        it('should reset the timer', function() {
            timer.timeLeft = 100;
            timer.resetTimer();
            expect(timer.timeLeft).to.equal(timer.defaultDuration * 60);
            expect(timer.isRunning).to.be.false;
        });
    });
});
