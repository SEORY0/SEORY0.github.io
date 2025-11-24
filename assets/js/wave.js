document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById('wave-container');
  if (!container) return;

  let rows = 0;
  let cols = 0;
  let offset = 0;
  let frequency = 0.02; // 파장을 넓게
  let amplitude = 4;    // 높이 조절
  
  // 밀도에 따른 문자열 (뒤쪽 배경이 잘 보이도록 공백을 적절히 섞음)
  const chars = "  .:-=+*#%@"; 

  function init() {
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    animate();
  }

  function resize() {
    // 화면 크기에 맞춰 글자 수 계산 (분모를 줄여서 글자 수를 늘림 -> 꽉 차게)
    // 기존 10, 16 -> 8, 14로 변경하여 여유 공간 확보
    cols = Math.floor(window.innerWidth / 8); 
    rows = Math.floor(window.innerHeight / 14);
  }

  function onMouseMove(e) {
    // 마우스 위치에 따라 파도 모양 변화
    // X축: 주파수 (물결의 촘촘함)
    frequency = 0.01 + (e.clientX / window.innerWidth) * 0.05;
    // Y축: 진폭 (물결의 높이)
    amplitude = 2 + (e.clientY / window.innerHeight) * 8;
  }

  function animate() {
    let output = "";
    offset += 0.04; // 물결 속도

    for (let y = 0; y < rows; y++) {
      let line = "";
      for (let x = 0; x < cols; x++) {
        // 파동 계산
        const waveHeight = Math.sin(x * frequency + offset) * amplitude;
        const centerY = rows / 2;
        const distance = y - (centerY + waveHeight);

        let charIndex = 0;
        
        if (distance < 0) {
          charIndex = 0; 
        } else if (distance < 2) {
          charIndex = Math.floor(Math.random() * 2) + 1; // 표면 거품
        } else {
          // 깊이 표현
          charIndex = Math.min(chars.length - 1, Math.floor(distance / 2) + 2);
        }

        line += chars[charIndex] || " ";
      }
      output += line + "\n";
    }

    container.textContent = output;
    requestAnimationFrame(animate);
  }

  init();
});