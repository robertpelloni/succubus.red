export class LipSyncAnalyser {
  constructor(audio) {
    this.audio = audio;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;

    this.source = this.audioContext.createMediaElementSource(this.audio);
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  update() {
    this.analyser.getByteFrequencyData(this.dataArray);

    // Simplistic frequency band mapping to visemes (a, i, u)
    // You can refine these bins based on actual audio characteristics

    let sumA = 0;
    for (let i = 0; i < 10; i++) sumA += this.dataArray[i]; // Low freq for 'A'

    let sumI = 0;
    for (let i = 10; i < 30; i++) sumI += this.dataArray[i]; // Mid freq for 'I'

    let sumU = 0;
    for (let i = 30; i < 50; i++) sumU += this.dataArray[i]; // High freq for 'U'

    const maxVal = 255 * 20;

    return {
      a: Math.min(1, sumA / (255 * 10)),
      i: Math.min(1, sumI / (255 * 20)),
      u: Math.min(1, sumU / (255 * 20)),
    };
  }

  resumeContext() {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}
