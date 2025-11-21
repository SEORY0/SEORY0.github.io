document.addEventListener("DOMContentLoaded", function () {
  
  // 1. Lenis: 부드러운 스크롤 (Inertia Scroll) 초기화
  const lenis = new Lenis({
    duration: 1.2, // 속도 조절 (클수록 부드럽고 느림)
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // GSAP와 ScrollTrigger 플러그인 등록
  gsap.registerPlugin(ScrollTrigger);

  // 2. Hero Section: 텍스트 고정 및 페이드 아웃 효과 (Parallax)
  // Hero 섹션이 스크롤 될 때 텍스트는 천천히 움직이거나 고정되는 느낌
  if (document.querySelector('.hero-section')) {
    gsap.to(".hero-content", {
      scrollTrigger: {
        trigger: ".hero-section",
        start: "top top", // 화면 맨 위에서 시작
        end: "bottom top", // 섹션이 끝날 때까지
        scrub: true, // 스크롤에 따라 애니메이션 동기화
      },
      y: 150, // 아래로 살짝 밀림
      opacity: 0, // 투명해짐
    });
  }

  // 3. 공통: 요소들이 스크롤에 따라 아래에서 위로 등장 (Reveal Effect)
  // 대상: 섹션 헤더, 카드, 마인드맵 노드 등
  const revealElements = document.querySelectorAll(".section-header, .mai-card, .mindmap-header, .project-item");

  revealElements.forEach((element) => {
    gsap.fromTo(
      element,
      {
        y: 50, // 아래에서 시작
        opacity: 0, // 투명하게 시작
      },
      {
        scrollTrigger: {
          trigger: element,
          start: "top 85%", // 화면의 85% 지점에 오면 시작
          toggleActions: "play none none reverse", // 다시 올리면 사라졌다 나타남
        },
        y: 0,
        opacity: 1,
        duration: 1,
        ease: "power3.out",
      }
    );
  });

  // 4. 마인드맵 노드: 순차적으로 톡톡 튀어나오는 효과 (Stagger)
  if (document.querySelector('.mindmap-container')) {
    gsap.from(".node", {
      scrollTrigger: {
        trigger: ".mindmap-section",
        start: "top 70%",
      },
      scale: 0, // 크기 0에서 시작
      opacity: 0,
      duration: 0.8,
      stagger: 0.1, // 0.1초 간격으로 하나씩 등장
      ease: "back.out(1.7)", // 톡 튀어나오는 탄성 효과
    });
    
    // 연결선 그리기 효과
    gsap.from(".network-lines path", {
        scrollTrigger: {
            trigger: ".mindmap-section",
            start: "top 70%",
        },
        strokeDasharray: 1000,
        strokeDashoffset: 1000,
        duration: 2,
        ease: "power2.inOut"
    });
  }
  
  // 5. 헤더: 스크롤 내리면 반투명해지거나 숨김 처리 (선택사항)
  const header = document.querySelector("app-header header");
  let lastScroll = 0;

  window.addEventListener("scroll", () => {
      const currentScroll = window.pageYOffset;
      if (currentScroll > 50) {
          // 스크롤을 조금이라도 내리면 배경을 좀 더 진하게
          header.style.backgroundColor = "rgba(254, 249, 237, 0.98)";
          header.style.boxShadow = "0 10px 30px rgba(93, 82, 75, 0.1)";
      } else {
          // 맨 위에서는 투명도 유지
          header.style.backgroundColor = "rgba(254, 249, 237, 0.9)";
          header.style.boxShadow = "0 4px 30px rgba(93, 82, 75, 0.05)";
      }
      lastScroll = currentScroll;
  });
  const toggleBtn = document.getElementById('theme-toggle-btn');
  const indicator = document.getElementById('theme-indicator');
  const htmlElement = document.documentElement;

  // 1. 초기화: 저장된 테마 불러오기
  const currentTheme = localStorage.getItem('theme');
  if (currentTheme === 'dark') {
    htmlElement.setAttribute('data-theme', 'dark');
    if (indicator) indicator.textContent = "On";
  }

  // 2. 클릭 이벤트 리스너
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function(e) {
      // 클릭 씹힘 방지
      e.preventDefault();
      e.stopPropagation();
      
      console.log("Dark Mode Toggled!"); // 작동 확인용 로그

      if (htmlElement.getAttribute('data-theme') === 'dark') {
        // 라이트 모드로 전환
        htmlElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        if (indicator) indicator.textContent = "Off";
      } else {
        // 다크 모드로 전환
        htmlElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        if (indicator) indicator.textContent = "On";
      }
    });
  }

});