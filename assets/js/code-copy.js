/* assets/js/code-copy.js */

document.addEventListener('DOMContentLoaded', () => {
  // 모든 코드 블럭을 찾습니다.
  const codeBlocks = document.querySelectorAll('div.highlighter-rouge, figure.highlight');

  codeBlocks.forEach(block => {
    // 1. 코드 내용과 언어 가져오기
    const pre = block.querySelector('pre');
    if (!pre) return;

    let code = pre.querySelector('code');
    if (!code) code = pre; // code 태그가 없으면 pre 자체를 사용

    const codeText = code.innerText;
    let language = '';

    // 클래스에서 언어 이름 추출 (예: language-python -> python)
    block.classList.forEach(cls => {
      if (cls.startsWith('language-')) {
        language = cls.replace('language-', '');
      }
    });
    if (!language && block.getAttribute('data-lang')) {
      language = block.getAttribute('data-lang');
    }
    // 언어 이름 첫 글자 대문자로 (선택 사항)
    language = language ? language.charAt(0).toUpperCase() + language.slice(1) : 'Code';


    // 2. 상단 바 생성 (신호등 제거됨)
    const header = document.createElement('div');
    header.className = 'code-header';
    // 언어 레이블만 남기고 window-controls 삭제
    header.innerHTML = `
      <div class="language-label">${language}</div>
    `;


    // 3. 복사 버튼 생성
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.ariaLabel = 'Copy to clipboard';
    // SVG 아이콘 (클립보드 모양)
    copyBtn.innerHTML = `
      <svg class="icon-copy" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <svg class="icon-check" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;

    // 복사 기능 구현
    copyBtn.addEventListener('click', () => {
      // 성공 피드백 함수
      const showSuccess = () => {
        copyBtn.classList.add('copied');
        copyBtn.querySelector('.icon-copy').style.display = 'none';
        copyBtn.querySelector('.icon-check').style.display = 'block';

        // 2초 후 복귀
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          copyBtn.querySelector('.icon-copy').style.display = 'block';
          copyBtn.querySelector('.icon-check').style.display = 'none';
        }, 2000);
      };

      // Clipboard API가 지원되는 경우
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(codeText)
          .then(() => {
            showSuccess();
          })
          .catch(err => {
            console.error('Clipboard API failed: ', err);
          });
      } else {
        // 구형 브라우저 fallback: execCommand 사용
        try {
          const textarea = document.createElement('textarea');
          textarea.value = codeText;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();

          const successful = document.execCommand('copy');
          document.body.removeChild(textarea);

          if (successful) {
            showSuccess();
          } else {
            console.error('execCommand copy failed');
          }
        } catch (err) {
          console.error('Copy fallback failed: ', err);
        }
      }
    });

    // 상단 바에 버튼 추가
    header.appendChild(copyBtn);


    // 4. 줄 번호 생성 및 구조 재배치
    const lineNumbersWrapper = document.createElement('div');
    lineNumbersWrapper.className = 'line-numbers-wrapper';
    
    const lines = codeText.split('\n');
    // 마지막 빈 줄 제외 처리 (선택 사항)
    const lineCount = lines[lines.length - 1] === '' ? lines.length - 1 : lines.length;

    let lineNumbersHtml = '';
    for (let i = 1; i <= lineCount; i++) {
      lineNumbersHtml += `<span class="line-number">${i}</span>\n`;
    }
    lineNumbersWrapper.innerHTML = lineNumbersHtml;

    // 코드 영역 래퍼 생성
    const codeWrapper = document.createElement('div');
    codeWrapper.className = 'code-wrapper';
    
    // 기존 pre 태그를 이동
    codeWrapper.appendChild(pre);

    // 메인 컨테이너 생성
    const container = document.createElement('div');
    container.className = 'code-block-container';
    
    // 요소들 조립
    container.appendChild(header);
    const body = document.createElement('div');
    body.className = 'code-body';
    body.appendChild(lineNumbersWrapper);
    body.appendChild(codeWrapper);
    container.appendChild(body);

    // 기존 블럭을 새 컨테이너로 교체
    block.parentNode.insertBefore(container, block);
    block.parentNode.removeChild(block);
  });
});