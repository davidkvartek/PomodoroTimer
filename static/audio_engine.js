class SoundGenerator {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.currentSource = null;
        this.gainNode = this.ctx.createGain();
        this.gainNode.connect(this.ctx.destination);
        this.gainNode.gain.value = 0; // Start silent
        this.isPlaying = false;
        this.bufferSize = 2 * this.ctx.sampleRate;
    }

    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    stop() {
        if (this.currentSource) {
            // Ramp down to avoid clicks
            this.gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
            setTimeout(() => {
                if (this.currentSource) {
                    this.currentSource.stop();
                    this.currentSource.disconnect();
                    this.currentSource = null;
                }
            }, 200);
        }
        this.isPlaying = false;
    }

    play(type) {
        this.resume();
        this.stop(); // Stop any current sound

        let buffer;
        switch (type) {
            case 'white':
                buffer = this.createWhiteNoise();
                break;
            case 'pink':
                buffer = this.createPinkNoise();
                break;
            case 'rain': // Brown noise approximation
                buffer = this.createBrownNoise();
                break;
            default:
                return; // 'off' or unknown
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(this.gainNode);
        source.start();

        this.currentSource = source;
        this.isPlaying = true;

        // Ramp up
        this.gainNode.gain.setTargetAtTime(0.3, this.ctx.currentTime, 0.5); // Volume 0.3
    }

    createWhiteNoise() {
        const buffer = this.ctx.createBuffer(1, this.bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < this.bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    createPinkNoise() {
        const buffer = this.ctx.createBuffer(1, this.bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
        for (let i = 0; i < this.bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            data[i] *= 0.11; // (roughly) compensate for gain
            b6 = white * 0.115926;
        }
        return buffer;
    }

    createBrownNoise() {
        const buffer = this.ctx.createBuffer(1, this.bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < this.bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5; // (roughly) compensate for gain
        }
        return buffer;
    }
}
