// web audio APIを学ぼう！
// https://bombrary.github.io/blog/posts/web-audio-api-note01/

/*
const audioContext = new AudioContext();
const oscillatorNode = audioContext.createOscillator();
oscillatorNode.connect(audioContext.destination);

document.getElementById('play_btn')
  .addEventListener('click', function() {
    oscillatorNode.start();
  }, false);
*/
const audioContext = new AudioContext();
const oscillatorNode = audioContext.createOscillator();
oscillatorNode.connect(audioContext.destination);
oscillatorNode.type = "square";
oscillatorNode.start();

document.getElementById('play_stop_btn')
  .addEventListener('click', function() {
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    } else {
      audioContext.suspend();
    }
  }, false);
