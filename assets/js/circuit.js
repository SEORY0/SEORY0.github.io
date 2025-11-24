document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("circuit-canvas");
  const ctx = canvas.getContext("2d");
  const container = document.getElementById("circuit-container");
  const projectCards = document.querySelectorAll(".project-card");

  let width, height, scale;
  let nodes = [];
  let connections = [];
  let mouse = { x: -1000, y: -1000 };
  
  // --- Physics Variables (전자기 유도) ---
  let scrollFlux = 0;      // 자속 변화량 (스크롤 속도)
  let inducedCurrent = 0;  // 유도 전류 (밝기)
  let lastScrollY = window.scrollY;
  let magnetY = 0;         // 자석 아이콘 위치 (스크롤바 역할)

  // 테마 색상
  const colorBase = "rgba(93, 82, 75, 0.1)";    // 평상시 (전류 없음)
  const colorActive = "rgba(255, 200, 100, 1)"; // 전류 흐름 (금색 빛)
  const colorGlow = "rgba(255, 160, 50, 0.8)";  // 조명 빛

  // 1. Configuration
  const techData = [
    { id: "c-cpp", label: "C/C++", x: 0.15, y: 0.3 },
    { id: "kernel", label: "Kernel", x: 0.35, y: 0.2 },
    { id: "python", label: "Python", x: 0.65, y: 0.3 },
    { id: "reversing", label: "Reversing", x: 0.25, y: 0.6 },
    { id: "windbg", label: "WinDbg", x: 0.5, y: 0.5, type: "resistor" }, // 저항 노드
    { id: "ida", label: "IDA", x: 0.75, y: 0.6, type: "resistor" },
    { id: "automation", label: "Automation", x: 0.85, y: 0.8 },
    { id: "game", label: "Game", x: 0.15, y: 0.8 },
    // 전구 노드 (회로 끝)
    { id: "bulb", label: "", x: 0.9, y: 0.1, type: "bulb" }
  ];

  function init() {
    resize();
    createConnections();
    window.addEventListener("resize", resize);
    container.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onClick);
    
    // 스크롤 이벤트 (자속 변화 감지)
    window.addEventListener("scroll", onScroll);
    
    draw();
  }

  function resize() {
    // HiDPI (Retina) 대응: 캔버스 크기를 픽셀 비율만큼 키움
    scale = window.devicePixelRatio || 1;
    width = container.offsetWidth;
    height = container.offsetHeight;

    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.width = width * scale;
    canvas.height = height * scale;
    
    ctx.scale(scale, scale); // 좌표계 스케일링

    // 노드 위치 재계산
    nodes = techData.map(t => ({
      ...t,
      rx: t.x * width,
      ry: t.y * height,
      radius: t.type === "bulb" ? 25 : 30,
      active: false
    }));
  }

  function createConnections() {
    connections = [
      ["c-cpp", "kernel"], ["kernel", "windbg"], ["c-cpp", "reversing"],
      ["reversing", "windbg"], ["windbg", "ida"], ["ida", "python"],
      ["python", "automation"], ["reversing", "game"], ["c-cpp", "game"],
      ["python", "bulb"], ["automation", "bulb"] // 전구로 연결
    ];
  }

  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }

  function onScroll() {
    const currentScrollY = window.scrollY;
    const delta = Math.abs(currentScrollY - lastScrollY);
    
    // 스크롤 속도 = 자속 변화량 (dPhi/dt)
    scrollFlux += delta * 0.5; 
    
    // 자석 위치 업데이트 (시각적 효과용)
    magnetY = (currentScrollY / (document.body.scrollHeight - window.innerHeight)) * height;
    
    lastScrollY = currentScrollY;
  }

  // --- Drawing Helpers ---
  
  // 저항 그리기 (Zig-Zag)
  function drawResistor(ctx, x1, y1, x2, y2, color, glow) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(angle);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = glow;
    ctx.shadowColor = colorGlow;

    // 직선 - 지그재그 - 직선
    const zigSize = 8;
    const zigCount = 4;
    const segment = dist / 4; // 저항이 차지하는 비율

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(segment, 0);
    
    // 지그재그 그리기
    for (let i = 0; i < zigCount; i++) {
      ctx.lineTo(segment + (i * 10) + 2.5, -zigSize);
      ctx.lineTo(segment + (i * 10) + 7.5, zigSize);
    }
    ctx.lineTo(segment + (zigCount * 10), 0);
    ctx.lineTo(dist, 0);
    
    ctx.stroke();
    ctx.restore();
  }

  // 전구 그리기 (Filament Style)
  function drawBulb(node, current) {
    const brightness = Math.min(current, 1); // 0~1
    
    // 유리관
    ctx.beginPath();
    ctx.arc(node.rx, node.ry, node.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 240, ${0.2 + brightness * 0.5})`;
    ctx.fill();
    ctx.strokeStyle = "#5D524B";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 필라멘트 (빛나는 부분)
    ctx.beginPath();
    ctx.moveTo(node.rx - 10, node.ry + 10);
    ctx.bezierCurveTo(node.rx - 5, node.ry - 10, node.rx + 5, node.ry - 10, node.rx + 10, node.ry + 10);
    ctx.strokeStyle = brightness > 0.1 ? "#FFD700" : "#888";
    ctx.lineWidth = 2;
    ctx.shadowBlur = brightness * 30;
    ctx.shadowColor = "#FFD700";
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 소켓
    ctx.fillStyle = "#444";
    ctx.fillRect(node.rx - 10, node.ry + node.radius - 5, 20, 10);
  }

  // 자석 (Flux Source) 그리기
  function drawMagnet() {
      // 스크롤바 위치에 따라 움직이는 자석 효과 (오른쪽에 희미하게)
      const mx = width - 30;
      const my = magnetY;
      
      ctx.save();
      ctx.globalAlpha = Math.min(scrollFlux / 20, 0.5); // 움직일 때만 보임
      
      // N극/S극
      ctx.fillStyle = "#ff4444";
      ctx.fillRect(mx, my - 20, 15, 20);
      ctx.fillStyle = "#4444ff";
      ctx.fillRect(mx, my, 15, 20);
      
      // 자기력선 (Flux Lines)
      ctx.beginPath();
      ctx.strokeStyle = "rgba(200, 200, 200, 0.5)";
      ctx.setLineDash([5, 5]);
      ctx.arc(mx, my, 60, Math.PI * 0.5, Math.PI * 1.5);
      ctx.stroke();
      
      ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // 물리 엔진: 자속 감소 (마찰) 및 유도 전류 계산
    scrollFlux *= 0.92; // 감쇠
    if (scrollFlux < 0.1) scrollFlux = 0;
    
    // 유도 전류는 자속 변화량에 비례
    inducedCurrent = Math.min(scrollFlux / 10, 1);

    // 자석 그리기
    drawMagnet();

    // A. Connections
    connections.forEach(conn => {
      const n1 = nodes.find(n => n.id === conn[0]);
      const n2 = nodes.find(n => n.id === conn[1]);

      if (n1 && n2) {
        // 마우스(도체)와의 상호작용
        const dist = Math.hypot(mouse.x - (n1.rx+n2.rx)/2, mouse.y - (n1.ry+n2.ry)/2);
        const isHover = dist < 100;
        
        // 전류량 결정 (스크롤 유도 전류 + 마우스 근접 효과 + 활성 상태)
        let current = inducedCurrent;
        if (isHover || n1.active || n2.active) current = Math.max(current, 0.8);
        
        const color = current > 0.1 ? colorActive : colorBase;
        const glow = current * 15;

        // 저항이 필요한 구간인지 확인 (단순화: 연결된 노드 중 하나가 resistor면 저항 그림)
        if (n1.type === "resistor" || n2.type === "resistor") {
            drawResistor(ctx, n1.rx, n1.ry, n2.rx, n2.ry, color, glow);
        } else {
            // 일반 도선
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = glow;
            ctx.shadowColor = colorGlow;
            ctx.moveTo(n1.rx, n1.ry);
            ctx.lineTo(n2.rx, n2.ry);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
      }
    });

    // B. Nodes
    nodes.forEach(node => {
      if (node.type === "bulb") {
          drawBulb(node, inducedCurrent); // 전구는 유도 전류에 반응
          return;
      }

      const dist = Math.hypot(mouse.x - node.rx, mouse.y - node.ry);
      const isHover = dist < node.radius;
      
      ctx.beginPath();
      
      // 노드 모양: 저항은 사각형, 나머지는 원
      if (node.type === "resistor") {
          ctx.rect(node.rx - 15, node.ry - 15, 30, 30);
      } else {
          ctx.arc(node.rx, node.ry, node.radius, 0, Math.PI * 2);
      }

      // 스타일링
      ctx.fillStyle = "#FEF9ED"; // 배경색과 동일 (투명 느낌)
      ctx.strokeStyle = (node.active || isHover) ? colorActive : "rgba(93, 82, 75, 0.3)";
      ctx.lineWidth = 2;
      
      if (node.active || isHover || inducedCurrent > 0.5) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = colorGlow;
      }
      
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 텍스트
      ctx.fillStyle = "#5D524B";
      ctx.font = `600 13px Inter`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // 저항 기호(R) 또는 텍스트
      const label = node.type === "resistor" ? (isHover ? node.label : "R") : node.label;
      ctx.fillText(label, node.rx, node.ry);
    });

    requestAnimationFrame(draw);
  }

  // (onClick, filterProjects, resetFilter 함수는 기존 유지 - 생략 없음)
  function onClick(e) {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    let clickedNode = null;
    nodes.forEach(node => {
      if(node.type === 'bulb') return;
      const dist = Math.hypot(clickX - node.rx, clickY - node.ry);
      if (dist < node.radius) clickedNode = node;
    });
    if (clickedNode) {
      const wasActive = clickedNode.active;
      nodes.forEach(n => n.active = false);
      if (!wasActive) {
        clickedNode.active = true;
        filterProjects(clickedNode.id);
        document.getElementById("reset-filter").classList.add("visible");
      } else {
        document.getElementById("reset-filter").click();
      }
    }
  }

  function filterProjects(techId) {
    projectCards.forEach(card => {
      const techs = card.getAttribute("data-tech");
      if (techs && techs.includes(techId)) {
        card.style.display = "flex"; // Flex 복구
        card.style.opacity = 0;
        setTimeout(() => card.style.opacity = 1, 50);
      } else {
        card.style.display = "none";
      }
    });
  }

  document.getElementById("reset-filter").addEventListener("click", function() {
    nodes.forEach(n => n.active = false);
    projectCards.forEach(card => {
      card.style.display = "flex";
      setTimeout(() => card.style.opacity = 1, 50);
    });
    this.classList.remove("visible");
  });

  init();
});