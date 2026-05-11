/* assets/js/theme-toggle.js */

document.addEventListener('DOMContentLoaded', function() {
    // 1. DOM 요소 선택
    const checkbox = document.getElementById('theme-toggle-checkbox'); // 데스크탑 (스위치)
    const mobileBtn = document.getElementById('mobile-theme-toggle'); // 모바일 (원형 버튼)
    const statusText = document.getElementById('theme-status-text');
    const body = document.body;

    // 2. 통합 테마 변경 함수 (핵심 로직)
    function applyTheme(isDark) {
        // (1) CSS 클래스 제어 (body 태그)
        if (isDark) {
            body.classList.add('theme-dark');
            // dark mode active
            localStorage.setItem('theme', 'dark');
            
            if (statusText) statusText.textContent = "Dark";
        } else {
            body.classList.remove('theme-dark');
            // light mode active
            localStorage.setItem('theme', 'light');
            
            if (statusText) statusText.textContent = "Light";
        }

        // (2) UI 동기화: 데스크탑 스위치 상태 맞춤
        if (checkbox) {
            checkbox.checked = isDark;
        }

        // (3) 배너 이미지 필터 제어 (배너가 존재하는 페이지라면)
        const bannerImg = document.querySelector('.main-hero-banner img');
        if (bannerImg) {
            if (isDark) {
                // 다크모드: 필터 끔 (원본 검은 배경 이미지)
                bannerImg.style.setProperty('filter', 'none', 'important');
            } else {
                // 라이트모드: 반전 (하얀 배경)
                bannerImg.style.setProperty('filter', 'invert(100%) hue-rotate(180deg)', 'important');
            }
        }
    }

    // 3. 초기 로딩 시 상태 설정 (LocalStorage 우선 확인)
    const savedTheme = localStorage.getItem('theme');
    
    // 저장된 값이 'dark' 이거나, 저장된 값이 없는데 시스템 설정이 다크모드인 경우
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        applyTheme(true);
    } else {
        applyTheme(false);
    }

    // 4. 이벤트 리스너: 데스크탑 스위치 변경 시
    if (checkbox) {
        checkbox.addEventListener('change', function() {
            applyTheme(this.checked);
        });
    }

    // 5. 이벤트 리스너: 모바일 원형 버튼 클릭 시
    if (mobileBtn) {
        mobileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const isCurrentlyDark = body.classList.contains('theme-dark');
            applyTheme(!isCurrentlyDark);
        });
    }

    // 6. 이벤트 리스너: 상단 nav 테마 버튼 클릭 시 (또는 레거시 사이드바 버튼)
    const navBtn = document.getElementById('nav-theme-btn') || document.getElementById('sidebar-theme-btn');
    if (navBtn) {
        navBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const isCurrentlyDark = body.classList.contains('theme-dark');
            applyTheme(!isCurrentlyDark);
        });
    }
});