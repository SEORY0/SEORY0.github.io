document.addEventListener("DOMContentLoaded", function() {
  var searchBtns = document.querySelectorAll('.btn-search, #search-trigger');
  var searchOverlay = document.getElementById('search-overlay');
  var searchClose = document.getElementById('search-close');
  var searchInput = document.getElementById('search-input');

  // 1. 검색창 열기
  if (searchOverlay) {
    searchBtns.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
          e.stopPropagation();
          searchOverlay.classList.add('active');
          setTimeout(function() { if(searchInput) searchInput.focus(); }, 100);
          document.body.style.overflow = 'hidden'; // 스크롤 막기
      });
    });
    
    // 2. 검색창 닫기 (버튼)
    if (searchClose) {
      searchClose.addEventListener('click', function() {
        searchOverlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    }
    
    // 3. 검색창 닫기 (ESC 키)
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
        searchOverlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // 4. SimpleJekyllSearch 초기화 (라이브러리가 로드된 후 실행됨)
  if (window.SimpleJekyllSearch && document.getElementById('search-input')) {
    SimpleJekyllSearch({
      searchInput: document.getElementById('search-input'),
      resultsContainer: document.getElementById('results-container'),
      json: '/assets/js/search.json',
      searchResultTemplate: '<li><a href="{url}"><span class="title">{title}</span><span class="date">{date}</span></a></li>',
      noResultsText: '<li class="no-results">No results found</li>',
      limit: 10,
      fuzzy: false
    });
  }
});