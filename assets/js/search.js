document.addEventListener('DOMContentLoaded', () => {
  const box = document.querySelector('[data-search-url]');
  if (!box) return;
  const input = box.querySelector('#search-input');
  const results = box.querySelector('#results-container');
  const status = box.querySelector('#search-status');
  let posts = null;

  function search() {
    if (!posts) return;
    const query = input.value.trim().toLocaleLowerCase();
    results.replaceChildren();
    if (!query) {
      status.textContent = '';
      return;
    }
    const matches = posts.filter(post =>
      `${post.title} ${post.content}`.toLocaleLowerCase().includes(query));
    matches.slice(0, 10).forEach(post => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = post.url;
      link.textContent = post.title;
      item.appendChild(link);
      results.appendChild(item);
    });
    status.textContent = matches.length ? `검색 결과 ${matches.length}개` : '검색 결과가 없습니다.';
  }

  input.addEventListener('input', search);
  status.textContent = '검색 데이터를 불러오는 중입니다.';
  fetch(box.dataset.searchUrl)
    .then(response => {
      if (!response.ok) throw new Error('Search data unavailable');
      return response.json();
    })
    .then(data => {
      posts = data;
      search();
    })
    .catch(() => {
      status.textContent = '검색 데이터를 불러오지 못했습니다. 페이지를 새로고침해 주세요.';
    });
});
