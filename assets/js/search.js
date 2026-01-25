/* /assets/js/search.js */

let posts = [];

// 1. JSON 데이터 로드
fetch('/search.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        posts = data;
        console.log("Search data loaded:", posts.length, "posts");
    })
    .catch(error => {
        console.error('Error loading search data:', error);
        // 사용자에게 검색 데이터 로드 실패 알림 (선택사항)
        if (searchResults) {
            searchResults.innerHTML = '<div class="search-error">Search data failed to load. Please refresh the page.</div>';
        }
    });

const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

// Null 체크: 검색 요소가 없으면 검색 기능 비활성화
if (!searchInput || !searchResults) {
    console.warn('Search elements not found - search functionality will not work');
}

// 2. 검색 실행 로직
function executeSearch() {
    if (!searchInput || !searchResults) return;
    const query = searchInput.value.toLowerCase().trim();

    // 검색어가 없으면 결과창 숨기기
    if (query.length === 0) {
        searchResults.style.display = 'none';
        searchResults.innerHTML = '';
        return;
    }

    // 제목(title) 또는 내용(content)에서 검색
    const filteredPosts = posts.filter(post => {
        return (post.title && post.title.toLowerCase().includes(query)) || 
               (post.content && post.content.toLowerCase().includes(query));
    });

    displayResults(filteredPosts);
}

// 3. 결과 표시 로직
function displayResults(results) {
    // 결과가 있든 없든 창을 보여줌 (없으면 '결과 없음' 표시)
    searchResults.style.display = 'block';

    if (results.length > 0) {
        const html = results.map(post => `
            <div class="search-result-item">
                <a href="${post.url}">
                    <div class="result-title">${highlight(post.title)}</div>
                    <div class="result-date">${post.date}</div>
                </a>
            </div>
        `).join('');
        searchResults.innerHTML = html;
    } else {
        searchResults.innerHTML = `<div class="search-no-result">No results found.</div>`;
    }
}

// (선택사항) 검색어 하이라이팅 헬퍼 함수
function highlight(text) {
    // 단순 출력이므로 원본 그대로 리턴 (필요시 하이라이팅 로직 추가 가능)
    return text; 
}


// ★ 핵심 변경점: 이벤트 리스너 ★

// Debouncing을 위한 타이머 변수
let debounceTimer;

if (searchInput) {
    // 1. 'input': 타이핑할 때마다 debouncing 적용 (300ms 지연)
    searchInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(executeSearch, 300);
    });

    // 2. 'focus': 검색창 다시 클릭했을 때 검색어 있으면 결과 보여주기
    searchInput.addEventListener('focus', function() {
        if (searchInput.value.trim().length > 0) {
             executeSearch();
        }
    });
}

// 3. 외부 클릭 시 결과창 닫기 (UX 개선)
document.addEventListener('click', function(event) {
    const isClickInside = searchInput.contains(event.target) || searchResults.contains(event.target);
    if (!isClickInside) {
        searchResults.style.display = 'none';
    }
});

// 4. 엔터키 눌렀을 때 폼 전송(새로고침) 막기
const searchForm = document.getElementById('searchForm');
if (searchForm) {
    searchForm.addEventListener('submit', function(event) {
        event.preventDefault();
    });
}