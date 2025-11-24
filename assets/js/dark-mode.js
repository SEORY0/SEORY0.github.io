document.addEventListener("DOMContentLoaded", function() {
  var themeBtns = document.querySelectorAll('.btn-theme, #theme-toggle-btn');
  var indicators = document.querySelectorAll('#theme-indicator, .indicator');
  var htmlElement = document.documentElement;
  
  // 1. 초기화
  var currentTheme = localStorage.getItem('theme');
  if (currentTheme === 'dark') {
    htmlElement.setAttribute('data-theme', 'dark');
    updateIndicators("On");
  } else {
    updateIndicators("Off");
  }

  function updateIndicators(status) {
    indicators.forEach(function(el) {
        // 플로팅 버튼의 텍스트인 경우
        if(el.id === 'theme-indicator') el.textContent = status;
    });
  }

  function toggleTheme(e) {
      e.preventDefault();
      e.stopPropagation();

      if (htmlElement.getAttribute('data-theme') === 'dark') {
        htmlElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        updateIndicators("Off");
      } else {
        htmlElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        updateIndicators("On");
      }
  }

  // 2. 이벤트 연결
  themeBtns.forEach(function(btn) {
      btn.addEventListener('click', toggleTheme);
  });
});