/* /assets/js/mobile-nav.js */

document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navColumn = document.querySelector('.vector-column-start');
    const overlay = document.getElementById('mobile-overlay');
    const body = document.body;

    function toggleMenu() {
        const isOpen = navColumn.classList.contains('menu-open');
        
        if (isOpen) {
            // [닫기 로직]
            navColumn.classList.remove('menu-open');
            menuBtn.classList.remove('active');
            overlay.classList.remove('visible');
            setTimeout(() => { overlay.style.display = 'none'; }, 300);
            
            // ★ 핵심 수정: body에서 클래스 제거 및 스크롤 잠금 해제
            body.classList.remove('mobile-menu-active'); 
            body.style.overflow = ''; 

        } else {
            // [열기 로직]
            navColumn.classList.add('menu-open');
            menuBtn.classList.add('active');
            overlay.style.display = 'block';
            setTimeout(() => { overlay.classList.add('visible'); }, 10);
            
            // ★ 핵심 수정: body에 'mobile-menu-active' 클래스 추가
            // 이 클래스가 붙으면 CSS가 아스키 아트를 숨길 것입니다.
            body.classList.add('mobile-menu-active');
            body.style.overflow = 'hidden'; 
        }
    }

    if (menuBtn) {
        // 1. 햄버거 버튼 클릭
        menuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMenu();
        });

        // 2. 오버레이(뒷배경) 클릭 시 닫기
        overlay.addEventListener('click', function() {
            toggleMenu();
        });

        // 3. 메뉴 내부의 링크를 클릭했을 때도 닫히게 하려면 (선택사항)
        /*
        const navLinks = navColumn.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                toggleMenu(); // 페이지 이동하면서 메뉴 닫기
            });
        });
        */
    }
});