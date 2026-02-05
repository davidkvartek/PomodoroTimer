const { TimerLogic } = require('../static/script');

jest.useFakeTimers();
jest.spyOn(global, 'setInterval');
jest.spyOn(global, 'clearInterval');

describe('TimerLogic', () => {
    let timer;

    beforeEach(() => {
        timer = new TimerLogic();
    });

    test('initial state', () => {
        expect(timer.defaultDuration).toBe(25);
        expect(timer.timeLeft).toBe(25 * 60);
        expect(timer.isRunning).toBe(false);
    });

    test('start starts the timer', () => {
        timer.start();
        expect(timer.isRunning).toBe(true);
        expect(setInterval).toHaveBeenCalledTimes(1);
    });

    test('timer ticks down', () => {
        const onTick = jest.fn();
        timer.onTick = onTick;
        timer.start();

        jest.advanceTimersByTime(1000);
        expect(timer.timeLeft).toBe(25 * 60 - 1);
        expect(onTick).toHaveBeenCalledWith(25 * 60 - 1, 25 * 60);
    });

    test('pause stops the timer', () => {
        timer.start();
        timer.pause();
        expect(timer.isRunning).toBe(false);
        expect(clearInterval).toHaveBeenCalled();
    });

    test('reset resets the timer', () => {
        timer.start();
        jest.advanceTimersByTime(5000);
        timer.reset();
        expect(timer.timeLeft).toBe(25 * 60);
        expect(timer.isRunning).toBe(false);
    });

    test('setDuration updates duration and resets time', () => {
        timer.setDuration(30);
        expect(timer.defaultDuration).toBe(30);
        expect(timer.totalTime).toBe(30 * 60);
        expect(timer.timeLeft).toBe(30 * 60);
    });

    test('complete is called when time reaches 0', () => {
        const onComplete = jest.fn();
        timer = new TimerLogic(1, null, onComplete); // 1 minute
        timer.timeLeft = 1; // force nearly done

        timer.start();
        jest.advanceTimersByTime(1000); // Tick 1 second (to 0)

        expect(timer.timeLeft).toBe(0);
        expect(onComplete).toHaveBeenCalled();
        expect(timer.isRunning).toBe(false);
    });
});
