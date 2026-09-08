document.addEventListener('DOMContentLoaded', () => {
  const contents = document.querySelector('.post-content');
  const toc = document.querySelector('.post-toc');
  if (!contents || !toc) return;

  const headings = Array.from(contents.querySelectorAll('h2[id], h3[id]'))
    .filter(heading => heading.id && heading.textContent.trim() &&
      !heading.closest('pre, code, .highlight, .highlighter-rouge'));
  if (headings.length < 2) return;

  const list = toc.querySelector('.post-toc-list');
  headings.forEach(heading => {
    const item = document.createElement('li');
    if (heading.tagName === 'H3') item.className = 'post-toc-subheading';

    const link = document.createElement('a');
    link.href = `#${encodeURIComponent(heading.id)}`;
    link.textContent = heading.textContent.trim();
    heading.tabIndex = -1;
    item.appendChild(link);
    list.appendChild(item);
  });
  toc.hidden = false;
});
