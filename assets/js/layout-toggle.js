document.addEventListener("DOMContentLoaded", function() {
  var layoutBtn = document.getElementById('layout-toggle-btn');
  var body = document.body;
  
  // 1. 초기화
  var savedLayout = localStorage.getItem('layout-mode') || 'side';
  body.setAttribute('data-layout', savedLayout);

  // 2. 클릭 이벤트
  if(layoutBtn) {
      layoutBtn.addEventListener('click', function() {
          var current = body.getAttribute('data-layout');
          var next = current === 'side' ? 'top' : 'side';
          
          body.setAttribute('data-layout', next);
          localStorage.setItem('layout-mode', next);
          
          // 레이아웃 변경 시 캔버스(회로도) 등 재계산을 위해 리사이즈 이벤트 트리거
          setTimeout(function(){ 
              window.dispatchEvent(new Event('resize')); 
          }, 100);
      });
  }
});