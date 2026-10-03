/* KKACHI dashboard sample data (v4) — one ES module for every dashboard screen (/kkachi/dashboard/, …/finding/,
   …/session/), so the three show the same numbers. Spec: docs/superpowers/specs/2026-10-02-kkachi-v4-symbol-system-
   design.md §1 (sample numbers), §4 (dashboard); research §3, §9.

     import { SESSION_7F2A as S, FINDING_F01 as F, SESSIONS, FINDINGS, fmtWhen, stateSym, symHref } from '../../assets/kkachi/dash-data.js';

   Honesty (v3 §6, v4 §1 — keep it when you use this data):
   - Session 7F2A and finding F-01 are the prototype's illustrative sample (kkachi/index.html: console, report, step log,
     reproduction). Their facts are copied exactly: target sample-imgcodec 2.4 (가상), scope 승인된 로컬 빌드, 4분 12초,
     함수 1,284, hypotheses H1–H4 with their reasons and times, runs 0.41 / 0.39 / 0.40 s at rows.c:212, the command,
     the code 205–214, the fix, CWE-190 → CWE-122, the report date 2026-09-26. Every screen still says 샘플 데이터.
   - The clock time of day is not in the prototype: SAMPLE_CLOCK places the session on its report date (2026-09-26) so
     that F-01 is confirmed at 14:03:00 KST, and SAMPLE_NOW (14:31 KST the same day) is the fixed "now" every relative
     time is measured from (a sample that never ages). Show both as sample.
   - Values the prototype does not have stay placeholders (PH, shown as "샘플 자리표시"): build hash, agent version, VM
     image ids, the scope's approver. Never fill them with plausible-looking hashes.
   - The seven other sessions are 데모용 가상 (demo: true): they fill the overview and the list, have no names, no
     detail records, and carry over the v3 sample's states and counts (8 sessions, 20 hypotheses, 2 findings). The
     funnel uses 7F2A's numbers only (1,284 → 4 → 기각 2 · 보류 1 → 3/3 → 1).
   - The agent proposed no severity in the prototype; F-01's severity is unset (검토 전) and a person sets it.

   Times inside a session are seconds from its start (t); absolute times are ISO strings with +09:00. Helpers below
   format both ways (KST absolute + relative), and map states to their symbol (assets/kkachi/symbols.svg) and word. */

export const SAMPLE_NOW = '2026-09-26T14:31:00+09:00';
export const SAMPLE_CLOCK = { date: '2026-09-26', note: '날짜는 프로토타입 보고서의 날짜이고, 시각은 대시보드를 위한 샘플 자리표시입니다.' };
export const PH = null;                                   // a value the sample does not have: render "샘플 자리표시"
export const PH_WORD = '샘플 자리표시';
export const SYMBOLS = new URL('./symbols.svg', import.meta.url).pathname;   // /assets/kkachi/symbols.svg from any page depth
export const symHref = (id, base = SYMBOLS) => `${base}#${id}`;

/* ── words and symbols ── */
// claim tablet lifecycle (a hypothesis becomes a finding; one tablet)
export const STATES = {
  cand:     { sym: 'kk-s-claim-cand',     word: '후보',      tone: null },
  hyp:      { sym: 'kk-s-claim-hyp',      word: '검증 중',   tone: null },
  traced:   { sym: 'kk-s-claim-traced',   word: '추적됨',    tone: null },
  rep0:     { sym: 'kk-s-claim-rep0',     word: '재현 0/3',  tone: null },
  rep1:     { sym: 'kk-s-claim-rep1',     word: '재현 1/3',  tone: null },
  rep2:     { sym: 'kk-s-claim-rep2',     word: '재현 2/3',  tone: null },
  ok:       { sym: 'kk-s-claim-ok',       word: '재현 확인', tone: 'ok' },     // agent, 3/3 — violet + nacre strips
  approved: { sym: 'kk-s-claim-approved', word: '승인',      tone: 'ok' },     // a person — violet + nacre face
  hold:     { sym: 'kk-s-claim-hold',     word: '보류',      tone: null },
  rejected: { sym: 'kk-s-claim-rejected', word: '기각',      tone: 'mute' },
  fail:     { sym: 'kk-s-fail',           word: '실패',      tone: 'fail' },   // system failures only
};
export function stateSym(state) { return STATES[state] || STATES.cand; }

// severity: counted bars; colour only once a person set it
export const SEVERITY = {
  crit: { sym: 'kk-s-sev-4', word: '심각', level: 4 },
  high: { sym: 'kk-s-sev-3', word: '높음', level: 3 },
  med:  { sym: 'kk-s-sev-2', word: '중간', level: 2 },
  low:  { sym: 'kk-s-sev-1', word: '낮음', level: 1 },
  info: { sym: 'kk-s-sev-0', word: '정보', level: 0 },
};
/* sev = { level: 'med' | … | null, by: 'human' | 'agent' | null }. Returns the symbol, word and whether the hue may show. */
export function sevSym(sev) {
  if (!sev || !sev.level) return { sym: 'kk-s-sev-unrev', word: '검토 전', hue: false, by: null };
  const s = SEVERITY[sev.level];
  if (sev.by === 'agent') return { sym: `kk-s-sev-prop-${Math.max(1, s.level)}`, word: `제안 · ${s.word}`, hue: false, by: 'agent', data: sev.level };
  return { sym: s.sym, word: s.word, hue: true, by: 'human', data: sev.level };
}

// review (a person's turn) and reports
export const REVIEW = {
  awaiting: { sym: 'kk-s-human-turn',     word: '검토 대기' },
  decided:  { sym: 'kk-s-human-decided',  word: '검토 끝남' },
  rejected: { sym: 'kk-s-human-rejected', word: '사람이 기각' },
};
export const REPORT = {
  draft:    { sym: 'kk-s-report-draft', word: '보고서 초안' },
  approved: { sym: 'kk-s-report',       word: '보고서' },
  ready:    { sym: 'kk-s-report-ready', word: '공개 준비' },
};

// the five stages; their glyphs are the gate ledger's and the session log's
export const STAGES = [
  { key: 'read',  word: '읽기', sym: 'kk-s-stage-read' },
  { key: 'hyp',   word: '가설', sym: 'kk-s-claim-hyp' },
  { key: 'trace', word: '추적', sym: 'kk-s-path' },
  { key: 'rep',   word: '재현', sym: 'kk-s-runs-ok' },
  { key: 'report', word: '보고', sym: 'kk-s-report-draft' },
];

// session-log event kinds → symbol + verb (the log reads as a chain of verbs)
export const EVENT_KINDS = {
  read:   { sym: 'kk-s-stage-read',     word: '읽기' },
  hyp:    { sym: 'kk-s-claim-hyp',      word: '가설' },
  trace:  { sym: 'kk-s-path',           word: '추적' },
  reject: { sym: 'kk-s-claim-rejected', word: '기각' },
  hold:   { sym: 'kk-s-claim-hold',     word: '보류' },
  try:    { sym: 'kk-s-strip-broken',   word: '입력 시도' },
  rep:    { sym: 'kk-s-runs-0',         word: '재현' },
  run:    { sym: 'kk-s-strip',          word: '재현 1회' },
  ok:     { sym: 'kk-s-claim-ok',       word: '재현 확인' },
  human:  { sym: 'kk-s-human-turn',     word: '사람 차례' },
};

// the autonomy strip (always in the app bar)
export const AUTONOMY = [
  { v: 'yes',   sym: 'kk-s-deg-full',   word: '읽기' },
  { v: 'yes',   sym: 'kk-s-deg-full',   word: '격리 실행' },
  { v: 'no',    sym: 'kk-s-noexfil',    word: '외부 전송 안 함' },
  { v: 'human', sym: 'kk-s-human-turn', word: '공개는 사람' },
];

/* ── session 7F2A (prototype facts) ── */
const START_7F2A = '2026-09-26T13:58:48+09:00';           // sample clock: + 252 s = 14:03:00 KST (F-01 confirmed)

export const SESSION_7F2A = {
  id: '7F2A',
  demo: false,
  sample: true,
  target: { name: 'sample-imgcodec 2.4', note: '가상', build: PH, scope: '승인된 로컬 빌드', scopeApprover: PH, scopeApprovedAt: PH },
  agentVersion: PH,
  start: START_7F2A,
  end: '2026-09-26T14:03:00+09:00',
  duration: 252,                                           // 4분 12초
  state: 'turn',                                           // agent done, a person's turn (보고 · 검토 대기)
  stage: 'report',
  functions: 1284,
  counts: { hypotheses: 4, confirmed: 1, rejected: 2, hold: 1, runs: 3, runsPassed: 3, findings: 1 },
  // the five stages and their gates (the gate ledger); t in seconds
  gates: [
    { key: 'read',   word: '읽기', from: 0,   to: 36,   state: 'done', status: '통과', gate: '입력 경계가 표시된 지도', outputs: ['함수 지도 1,284'] },
    { key: 'hyp',    word: '가설', from: 36,  to: 50,   state: 'done', status: '통과', gate: '반증 조건이 있는 가설', outputs: ['가설 목록 4'] },
    { key: 'trace',  word: '추적', from: 50,  to: 227,  state: 'done', status: '통과', gate: '입력에서 도달 가능한 경로', outputs: ['경로 5단계', '기각 2 · 보류 1'] },
    { key: 'rep',    word: '재현', from: 227, to: 252,  state: 'done', status: '통과', gate: '결정적으로 재현됨', outputs: ['재현 3/3', '실행마다 새 VM'] },
    { key: 'report', word: '보고', from: 252, to: null, state: 'now',  status: '검토 대기', gate: '사람의 검토', outputs: ['보고서 초안 F-01'] },
  ],
  gatesPassed: 4,                                          // the fifth gate is a person's review
  // the session log (prototype step log and ruler); kind → EVENT_KINDS
  events: [
    { t: 0,   kind: 'read',   text: '색인 · 함수 1,284개' },
    { t: 36,  kind: 'hyp',    text: 'H1–H4 · 가설 4개' },
    { t: 50,  kind: 'trace',  text: 'fuzz_entry → decode_image', code: true, h: 'H2' },
    { t: 97,  kind: 'reject', text: 'H2 · read_palette()에서 경계 검사 확인', h: 'H2' },
    { t: 108, kind: 'trace',  text: 'decode_image → parse_header', code: true, h: 'H3' },
    { t: 148, kind: 'reject', text: 'H3 · 출력 버퍼 크기가 고정됨', h: 'H3' },
    { t: 166, kind: 'hold',   text: 'H4 · 입력 샘플 부족 · 다음 세션', h: 'H4' },
    { t: 167, kind: 'trace',  text: 'read_chunk → copy_rows → memcpy', code: true, h: 'H1' },
    { t: 216, kind: 'try',    text: '입력 1 · 크래시 없음', h: 'H1' },
    { t: 223, kind: 'try',    text: '입력 2 · 크래시 없음', h: 'H1' },
    { t: 227, kind: 'rep',    text: '격리 환경 · 매 실행마다 새 VM', h: 'H1' },
    { t: 229, kind: 'run',    text: '재현 1회 · 0.41초 · rows.c:212', h: 'H1' },
    { t: 236, kind: 'run',    text: '재현 2회 · 0.39초 · rows.c:212', h: 'H1' },
    { t: 243, kind: 'run',    text: '재현 3회 · 0.40초 · rows.c:212', h: 'H1' },
    { t: 252, kind: 'ok',     text: 'F-01 · 재현 3/3', h: 'H1' },
    { t: 252, kind: 'human',  text: '사람 차례 · F-01 검토 대기', h: 'H1' },   // the fact the session head and the finding's audit log show
  ],
  // hypotheses with their reasons and times; lanes = texture over time (cand → claim → traced → proven), end = the mark.
  // A lane's 'proven' segment (H1: 227–252) is how the finished record draws it; nacre itself only becomes true at the
  // 'ok' event (252, 04:12): a replay before that moment draws the segment as traced (research §7.2: 2/3 is not nacre).
  hypotheses: [
    {
      id: 'H1', state: 'ok', text: 'copy_rows()가 헤더의 width 값을 검증 없이 신뢰한다', code: ['copy_rows()', 'width'],
      reason: '경로 5단계 · 재현 3/3', at: 252, finding: 'F-01',
      path: ['fuzz_entry()', 'decode_image()', 'parse_header()', 'read_chunk()', 'copy_rows()', 'memcpy()'],
      lanes: [{ x: 'claim', a: 36, b: 167 }, { x: 'traced', a: 167, b: 227 }, { x: 'proven', a: 227, b: 252 }], end: { kind: 'ok', at: 252 },
    },
    {
      id: 'H2', state: 'rejected', text: '팔레트 인덱스가 배열 경계를 넘는다',
      reason: 'read_palette()에서 경계 검사 확인', at: 97,
      path: ['fuzz_entry()', 'decode_image()', 'read_palette()'],
      lanes: [{ x: 'claim', a: 36, b: 50 }, { x: 'traced', a: 50, b: 97 }], end: { kind: 'rejected', at: 97 },
    },
    {
      id: 'H3', state: 'rejected', text: 'inflate_block()의 출력 버퍼가 넘친다', code: ['inflate_block()'],
      reason: '출력 버퍼 크기가 고정됨', at: 148,
      path: ['fuzz_entry()', 'decode_image()', 'parse_header()', 'inflate_block()'],
      lanes: [{ x: 'claim', a: 36, b: 108 }, { x: 'traced', a: 108, b: 148 }], end: { kind: 'rejected', at: 148 },
    },
    {
      id: 'H4', state: 'hold', text: 'validate_len()의 부호 비교가 뒤집혀 있다', code: ['validate_len()'],
      reason: '입력 샘플 부족 · 다음 세션', at: 166,
      path: ['fuzz_entry()', 'decode_image()', 'parse_header()', 'validate_len()'],
      lanes: [{ x: 'claim', a: 36, b: 148 }, { x: 'traced', a: 148, b: 166 }], end: { kind: 'hold', at: 166 },
    },
  ],
  // the call graph: nodes (observed = reached by running; else static) and the parts of the path
  graph: {
    entry: 'fuzz_entry()',
    sink: 'memcpy()',
    nodes: [
      { id: 'fuzz_entry()', observed: true }, { id: 'decode_image()', observed: true }, { id: 'parse_header()', observed: true },
      { id: 'read_palette()', observed: true, h: 'H2', end: 'rejected' }, { id: 'inflate_block()', observed: true, h: 'H3', end: 'rejected' },
      { id: 'validate_len()', observed: false, h: 'H4', end: 'hold' }, { id: 'read_chunk()', observed: true },
      { id: 'copy_rows()', observed: true }, { id: 'memcpy()', observed: true, finding: 'F-01' },
    ],
    unexplored: null,                                      // the prototype does not count untouched calls: show "기록 없음"
  },
  runs: ['R1', 'R2', 'R3'],
  findings: ['F-01'],
  playback: { end: 252, ticks: [0, 60, 120, 180, 240] },
};

/* ── finding F-01 (prototype report and console) ── */
export const FINDING_F01 = {
  id: 'F-01',
  session: '7F2A',
  demo: false,
  sample: true,
  hypothesis: 'H1',
  state: 'ok',                                             // 재현 확인 (agent, 3/3) — not 승인 until a person decides
  title: 'copy_rows()의 행 길이 계산에서 정수 오버플로',
  sentence: '헤더의 width가 copy_rows()의 memcpy()까지 닿아 행 버퍼를 넘어 씁니다.',
  summary: '조작된 이미지 헤더의 width 값이 32비트 곱셈에서 넘쳐 행 버퍼가 실제보다 작게 할당되고, 이어지는 memcpy()가 힙 경계를 넘어 씁니다.',
  location: { file: 'src/rows.c', root: 207, sink: 212, text: 'src/rows.c:207 → 212' },
  cwe: ['CWE-190', 'CWE-122'],
  cweText: 'CWE-190 → CWE-122',
  trigger: 'width 0x40000001 · bpp 4',
  impact: { text: '조작된 이미지 한 장으로 힙 버퍼 뒤쪽 메모리를 덮어쓸 수 있습니다.', estimate: true, note: '추정 · 검토 필요' },
  severity: { level: null, by: null, cvss: null },        // 검토 전: a person sets it; CVSS only once a person has
  verification: { runs: 3, runsPassed: 3, gates: 5, gatesPassed: 4, gatesNote: '다섯째 관문은 사람의 검토' },
  review: { state: 'awaiting', reviewer: null, since: '2026-09-26T14:03:00+09:00', decidedAt: null, note: null },
  report: { state: 'draft', date: '2026-09-26' },
  firstConfirmed: '2026-09-26T14:03:00+09:00',
  confirmedAt: 252,
  // 3–5 evidence rows: glyph · claim · fact · a way to check it
  evidence: [
    { sym: 'kk-s-path',           claim: '도달', fact: 'fuzz_entry()에서 memcpy()까지 · rows.c:207 → 212', code: true, check: '경로 보기', go: 'path' },
    { sym: 'kk-s-runs-ok',        claim: '재현', fact: '격리 VM에서 3회 모두 같은 자리에서 크래시', check: '실행 기록 3개', go: 'runs' },
    { sym: 'kk-s-loc-observed',   claim: '원인', fact: 'width * bpp를 32비트로 곱함 · rows.c:207', check: '코드 보기', go: 'code' },
    { sym: 'kk-s-claim-rejected', claim: '버린 대안', fact: 'H2 · H3 기각, H4 보류', check: '가설 보기', go: 'hyp' },
  ],
  code: {
    file: 'src/rows.c', from: 205, to: 214, root: 207, sink: 212,
    lines: [
      'int copy_rows(img_t *im, hdr_t *h, const u8 *src)',
      '{',
      '  u32 stride = h->width * h->bpp;   // u32 overflow',
      '  u8 *row = malloc(stride);',
      '  if (!row) return -1;',
      '  for (u32 y = 0; y < h->height; y++) {',
      '    const u8 *s = src + (size_t)y * h->pitch;',
      '    memcpy(row, s, (size_t)h->width * h->bpp);',
      '    emit_row(im, y, row);',
      '  }',
    ],
    notes: { 207: '32비트 곱셈이 넘쳐 4바이트 버퍼만 할당됩니다.', 212: '64비트로 다시 계산한 길이만큼 복사해 힙 경계를 넘어 씁니다.' },
  },
  // the path in numbered steps (the graph's table twin) and its three-part summary
  steps: [
    { fn: 'fuzz_entry()', role: '진입', note: '입력 이미지를 받습니다' },
    { fn: 'decode_image()' }, { fn: 'parse_header()', note: '헤더의 width와 bpp를 읽습니다' }, { fn: 'read_chunk()' },
    { fn: 'copy_rows()', note: 'rows.c:207 · 행 길이를 32비트로 계산합니다' },
    { fn: 'memcpy()', role: '싱크', note: 'rows.c:212 · 힙 경계를 넘어 씁니다' },
  ],
  pathSummary: ['입력은 헤더에서 들어옵니다', '여기서 넘칩니다 (rows.c:207)', '힙 경계를 넘습니다 (rows.c:212)'],
  fix: {
    diff: [
      { op: 'del', text: '  u32 stride = h->width * h->bpp;' },
      { op: 'add', text: '  if (h->width > MAX_W) return -1;' },
      { op: 'add', text: '  size_t stride = (size_t)h->width * h->bpp;' },
    ],
    note: '수정은 제안일 뿐입니다. 적용은 사람이 결정합니다.',
    cut: { from: 'copy_rows()', to: 'memcpy()' },          // the edge the fix cuts
  },
  repro: {
    command: './repro --seed 7f2a poc-f01.img',
    signal: 'ASan: heap-buffer-overflow · rows.c:212',
    env: 'x86_64 · ASan · 고정 시드 · 매 실행마다 새 VM',
    patchRerun: null,                                      // not in the prototype: "기록 없음"
  },
  did: ['재현 3/3', '실행마다 새 일회용 VM', '보고서 초안 작성', '수정 방향 제안'],
  didNot: ['심각도 결정', '수정 적용', '외부 공개', '제보 채널과 공개 시점 결정'],
  // report writing rules (prototype, shown beside the report)
  rules: [
    '첫 문단은 한 문장으로 끝납니다. 무엇이, 어디서, 왜.',
    '추정은 추정이라고 씁니다. 확인된 사실과 섞지 않습니다.',
    '모든 주장에는 코드 위치가 붙습니다.',
    '재현 절차는 복사해서 그대로 실행할 수 있어야 합니다.',
    '수정은 제안일 뿐입니다. 적용은 사람이 결정합니다.',
    '검토 칸이 채워지기 전에는 밖으로 나가지 않습니다.',
  ],
  updates: [                                               // newest first (the sample has one entry)
    { at: '2026-09-26T14:03:00+09:00', what: '재현 3/3으로 확인하고 보고서 초안을 만들었습니다. 사람의 검토를 기다립니다.' },
  ],
  reviewActions: [
    { key: 'approve',  word: '승인',       result: '보고서 초안을 담당자에게 넘깁니다 · 외부 공개는 아닙니다', primary: true },
    { key: 'changes',  word: '수정 요청',  result: '에이전트가 보고서를 고쳐 다시 올립니다' },
    { key: 'reject',   word: '기각',       result: '사유를 적어야 합니다 · 기록에 남고 다시 열 수 있습니다' },
    { key: 'severity', word: '심각도 정하기', result: '사람이 정한 값으로 기록합니다 · 누가 · 언제 · 사유' },
  ],
  sampleReviewReason: '샘플 화면이라 결정할 수 없습니다',
};

/* reproduction runs of F-01 (prototype: RUN 1–3) */
export const RUNS_F01 = [
  { id: 'R1', n: 1, state: 'pass', t: 229, seconds: 0.41, signal: 'ASan heap-buffer-overflow', at: 'rows.c:212', vmImage: PH },
  { id: 'R2', n: 2, state: 'pass', t: 236, seconds: 0.39, signal: 'ASan heap-buffer-overflow', at: 'rows.c:212', vmImage: PH },
  { id: 'R3', n: 3, state: 'pass', t: 243, seconds: 0.40, signal: 'ASan heap-buffer-overflow', at: 'rows.c:212', vmImage: PH },
];
export const RUN_ENV = { arch: 'x86_64', sanitizer: 'ASan', seed: '고정 시드', vm: '매 실행마다 새 VM' };

/* the funnel: 7F2A only (spec v4 §1), in the one session-line vocabulary of every surface (r2 plan §1a): the drops
   hang under 추적, where the paths were followed and two were rejected, one held. ok: the violet stage (only 재현 3/3,
   r2 plan §1b); end: the report stage (F-01: shell text, the claim-ok plate keeps its violet edge); turn: the ring that
   ends the line (사람 차례 · 검토 대기: a person's turn; kk-system.css §26 .kk-funnel-turn) */
export const FUNNEL_7F2A = {
  session: '7F2A',
  stages: [
    { n: 1284, word: '읽기 · 함수' },
    { n: 4, word: '가설' },
    { n: 1, word: '추적 · 경로', out: [
      { end: 'rejected', n: 2, word: '기각', why: '경계 검사 확인 · 출력 버퍼 고정' },
      { end: 'hold', n: 1, word: '보류', why: '입력 샘플 부족' },
    ] },
    { n: '3/3', word: '재현', ok: true },
    { n: 'F-01', word: '보고 · 초안', end: true },
    { n: '사람 차례', word: '검토 대기', turn: true },
  ],
};

/* ── the overview: 7F2A and seven demo sessions (데모용 가상; v3's sample states and counts) ──
   stages: per stage done | now | wait | cut | hold | fail | after; end: turn | decided | dim | none */
const demo = { demo: true, note: '데모용 가상 세션' };
export const SESSIONS = [
  { id: '7F2A', ...{ demo: false, note: '프로토타입의 샘플 세션' }, target: 'sample-imgcodec 2.4', targetNote: '가상',
    start: START_7F2A, end: '2026-09-26T14:03:00+09:00', duration: 252, group: 'done', state: 'turn',
    result: '발견 1 · 사람 검토 대기', hypotheses: 4, findings: ['F-01'],
    line: { stages: ['done', 'done', 'done', 'proven', 'done'], end: 'turn' }, detail: true },
  { id: '81C4', ...demo, target: '데모 대상 A', targetNote: '가상', start: '2026-09-26T14:28:02+09:00', end: null, duration: 178,
    group: 'live', state: 'run', stage: 'trace', result: '추적 중', hypotheses: 3, findings: [],
    line: { stages: ['done', 'done', 'now', 'wait', 'wait'], end: 'dim' } },
  { id: '2A8F', ...demo, target: '데모 대상 G', targetNote: '가상', start: '2026-09-26T14:29:56+09:00', end: null, duration: 64,
    group: 'live', state: 'run', stage: 'hyp', result: '가설 세우는 중', hypotheses: 3, findings: [],
    line: { stages: ['done', 'now', 'wait', 'wait', 'wait'], end: 'dim' } },
  { id: '9A13', ...demo, target: '데모 대상 D', targetNote: '가상', start: null, queued: '2026-09-26T14:30:10+09:00', end: null, duration: 0,
    group: 'live', state: 'wait', stage: 'read', result: '시작 전', hypotheses: 0, findings: [],
    line: { stages: ['wait', 'wait', 'wait', 'wait', 'wait'], end: 'dim' } },
  { id: '6D09', ...demo, target: '데모 대상 B', targetNote: '가상', start: '2026-09-26T13:12:05+09:00', end: '2026-09-26T13:17:46+09:00', duration: 341,
    group: 'stop', state: 'hold', stage: 'rep', result: '보류 · 재현 단계에서 멈춤', hypotheses: 2, findings: [],
    line: { stages: ['done', 'done', 'done', 'hold', 'after'], end: 'none' } },
  { id: '5B7E', ...demo, target: '데모 대상 C', targetNote: '가상', start: '2026-09-26T12:40:30+09:00', end: '2026-09-26T12:42:06+09:00', duration: 96,
    group: 'done', state: 'rejected', stage: 'trace', result: '발견 없음 · 가설 5개 모두 기각', hypotheses: 5, findings: [],
    line: { stages: ['done', 'done', 'cut', 'after', 'after'], end: 'none' } },
  { id: '4E60', ...demo, target: '데모 대상 E', targetNote: '가상', start: '2026-09-26T11:55:00+09:00', end: '2026-09-26T11:58:25+09:00', duration: 205,
    group: 'stop', state: 'fail', stage: 'trace', result: '실패 · 분석 환경 시간 초과', hypotheses: 1, findings: [],
    line: { stages: ['done', 'done', 'fail', 'after', 'after'], end: 'none' } },
  { id: '3C21', ...demo, target: '데모 대상 F', targetNote: '가상', start: '2026-09-26T10:20:00+09:00', end: '2026-09-26T10:24:28+09:00', duration: 268,
    group: 'done', state: 'decided', stage: 'report', result: '발견 1 · 검토 끝남', hypotheses: 2, findings: ['F-02'],
    line: { stages: ['done', 'done', 'done', 'proven', 'done'], end: 'decided' } },
];
export const SESSION_GROUPS = [
  { key: 'all', word: '전체' }, { key: 'live', word: '실행·대기' }, { key: 'done', word: '완료' }, { key: 'stop', word: '멈춤' },
];

/* findings across sessions: F-01 (sample) and one demo finding with no detail */
export const FINDINGS = [
  { id: 'F-01', session: '7F2A', demo: false, state: 'ok', severity: { level: null, by: null }, title: FINDING_F01.title,
    location: 'src/rows.c:207 → 212', cwe: 'CWE-190 → CWE-122', goal: '메모리 쓰기', runs: '3/3', review: 'awaiting',
    since: '2026-09-26T14:03:00+09:00', detail: true },
  { id: 'F-02', session: '3C21', demo: true, note: '데모용 가상 발견 · 상세 기록 없음', state: 'approved',
    severity: { level: 'med', by: 'human' }, title: '데모용 가상 발견', location: PH, cwe: PH, goal: PH, runs: '3/3',
    review: 'decided', since: '2026-09-26T10:24:28+09:00', decidedAt: '2026-09-26T11:02:00+09:00', detail: false },
];

/* overview figures (derived, so every screen agrees) */
export const OVERVIEW = (() => {
  const by = (k, v) => SESSIONS.filter((s) => s[k] === v).length;
  const hyps = SESSIONS.reduce((n, s) => n + s.hypotheses, 0);
  return {
    sessions: SESSIONS.length,                             // 8
    live: by('group', 'live'), running: SESSIONS.filter((s) => s.state === 'run').length, waiting: by('state', 'wait'),
    done: by('group', 'done'), stopped: by('group', 'stop'),
    hypotheses: hyps,                                      // 20
    findings: FINDINGS.length,                             // 2
    confirmed: FINDINGS.filter((f) => f.state === 'ok' || f.state === 'approved').length,
    awaitingReview: FINDINGS.filter((f) => f.review === 'awaiting').length,   // 1 (F-01)
    severity: { crit: 0, high: 0, med: 1, low: 0, info: 0, unrev: 1 },
    fresh: SAMPLE_NOW,
  };
})();

export const METHOD_LIMITS = [
  '재현 3/3을 통과한 것만 발견으로 보고합니다.',
  '확신이 없으면 보고하지 않고 보류로 남깁니다.',
  '승인된 범위 밖의 코드는 판단하지 않습니다.',
  '기각은 그 경로에서 재현되지 않았다는 뜻이며, 안전하다는 뜻은 아닙니다.',
  '이 화면은 실적 수치를 보여 주지 않습니다. 모든 데이터는 샘플입니다.',
];

/* ── formatting: KST absolute + relative; seconds as a clock or a duration ── */
const KST_MS = 9 * 3600 * 1000;
function kst(d) { const t = new Date(d).getTime() + KST_MS; return new Date(t); }   // read with getUTC*
const pad = (n) => String(n).padStart(2, '0');
export const fmtNum = (n) => (typeof n === 'number' ? n.toLocaleString('ko-KR') : String(n));

/* '9월 26일 14:03 KST' (opts.date=false: '14:03 KST'; opts.sec: '14:03:00'; opts.year: '2026년 9월 26일 …') */
export function fmtKST(iso, { date = true, sec = false, year = false, tz = true } = {}) {
  if (!iso) return PH_WORD;
  const k = kst(iso);
  const hm = `${pad(k.getUTCHours())}:${pad(k.getUTCMinutes())}${sec ? ':' + pad(k.getUTCSeconds()) : ''}`;
  const d = date ? `${year ? k.getUTCFullYear() + '년 ' : ''}${k.getUTCMonth() + 1}월 ${k.getUTCDate()}일 ` : '';
  return `${d}${hm}${tz ? ' KST' : ''}`;
}
/* '28분 전', '방금', '3시간 전', '2일 전' (from SAMPLE_NOW unless given) */
export function fmtRel(iso, now = SAMPLE_NOW) {
  if (!iso) return '';
  const s = Math.round((new Date(now) - new Date(iso)) / 1000);
  const a = Math.abs(s), after = s < 0;
  let w;
  if (a < 45) w = '방금';
  else if (a < 3600) w = `${Math.round(a / 60)}분`;
  else if (a < 86400) w = `${Math.floor(a / 3600)}시간${Math.round((a % 3600) / 60) ? ' ' + Math.round((a % 3600) / 60) + '분' : ''}`;
  else w = `${Math.floor(a / 86400)}일`;
  return w === '방금' ? w : `${w} ${after ? '뒤' : '전'}`;
}
/* both, the way every screen writes a time: '9월 26일 14:03 KST · 28분 전'. Drop the date when it is the same day as
   prevIso (a list that already said the date). */
export function fmtWhen(iso, { now = SAMPLE_NOW, prevIso = null, sec = false } = {}) {
  if (!iso) return PH_WORD;
  const same = prevIso && kst(prevIso).toISOString().slice(0, 10) === kst(iso).toISOString().slice(0, 10);
  return `${fmtKST(iso, { date: !same, sec })} · ${fmtRel(iso, now)}`;
}
/* the <time class="kk-when"> markup (a string; escape nothing else into it) */
export function whenHTML(iso, opts = {}) {
  if (!iso) return `<span class="kk-ph">${PH_WORD}</span>`;
  const rel = fmtRel(iso, opts.now || SAMPLE_NOW);
  return `<time class="kk-when" datetime="${iso}">${fmtKST(iso, opts)}<span>${rel}</span></time>`;
}
/* 252 → '04:12' (a session clock) */
export const fmtClock = (sec) => `${pad(Math.floor(sec / 60))}:${pad(Math.floor(sec % 60))}`;
/* 252 → '4분 12초'; 64 → '1분 4초'; 41 → '41초' */
export function fmtDur(sec) {
  if (sec == null) return '';
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  return m ? `${m}분${s ? ' ' + s + '초' : ''}` : `${s}초`;
}
/* a session second → its absolute ISO time */
export function atSession(session, t) {
  const start = typeof session === 'string' ? session : session.start;
  if (!start) return null;
  const d = new Date(new Date(start).getTime() + t * 1000);
  const k = kst(d);
  return `${k.getUTCFullYear()}-${pad(k.getUTCMonth() + 1)}-${pad(k.getUTCDate())}T${pad(k.getUTCHours())}:${pad(k.getUTCMinutes())}:${pad(k.getUTCSeconds())}+09:00`;
}

/* ── markup helpers (strings) — the same glyph + word everywhere ── */
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/* <svg class="kk-sym …"><use href="…#id"/></svg> */
export function symSVG(id, { cls = '', sev = null, base = SYMBOLS } = {}) {
  const wide = /^kk-s-(session-(run|turn|decided|cut|hold|fail|wait))$/.test(id) ? ' kk-sym--w3' : /^kk-s-(ln|end)-/.test(id) ? ' kk-sym--w2' : '';
  return `<svg class="kk-sym${wide}${cls ? ' ' + cls : ''}"${sev ? ` data-sev="${sev}"` : ''} aria-hidden="true" focusable="false"><use href="${symHref(id, base)}"/></svg>`;
}
/* symbol + word: <span class="kk-sig" data-tone>…</span>; sr: the word for screen readers + tooltip only */
export function sigHTML(id, word, { tone = null, sr = false, cls = '', sev = null, base = SYMBOLS } = {}) {
  const t = tone ? ` data-tone="${tone}"` : '';
  if (sr) return `<span class="kk-sig kk-sig--sr${cls ? ' ' + cls : ''}"${t} data-tip="${esc(word)}">${symSVG(id, { sev, base })}<span class="sr-only">${esc(word)}</span></span>`;
  return `<span class="kk-sig${cls ? ' ' + cls : ''}"${t}>${symSVG(id, { sev, base })}${esc(word)}</span>`;
}
export function stateHTML(state, opts = {}) { const s = stateSym(state); return sigHTML(s.sym, opts.word || s.word, { tone: s.tone, ...opts }); }
export function sevHTML(sev, opts = {}) {
  const s = sevSym(sev);
  const mark = s.by === 'human' ? symSVG('kk-s-person', { cls: 'kk-sym--12 kk-sym--mute', base: opts.base }) : '';
  return `<span class="kk-sig">${symSVG(s.sym, { sev: s.hue ? s.data : null, base: opts.base })}${esc(s.word)}${mark}</span>`;
}
/* the 48 × 16 session line for a table cell (role=img, named in words) */
const PIECE_WORD = { done: '끝', now: '진행 중', wait: '대기', cut: '기각으로 멈춤', hold: '보류로 멈춤', fail: '실패로 멈춤', proven: '3/3', after: '' };
export function slineMiniHTML(line, label = null) {
  const words = line.stages.map((s, i) => (PIECE_WORD[s] ? `${STAGES[i].word} ${PIECE_WORD[s]}` : '')).filter(Boolean);
  const endWord = { turn: '사람 차례', decided: '사람 결정', dim: '', none: '' }[line.end] || '';
  const name = label || `세션 줄: ${words.join(', ')}${endWord ? ', ' + endWord : ''}`;
  return `<span class="kk-sline--mini" role="img" aria-label="${esc(name)}">${line.stages.map((s) => `<i data-s="${s}"></i>`).join('')}<i data-e="${line.end || 'none'}"></i></span>`;
}
/* lane position helpers for .kk-lanes (seconds → style) */
export const laneStyle = (a, b) => (b == null ? `--a:${a}` : `--a:${a};--b:${b}`);
