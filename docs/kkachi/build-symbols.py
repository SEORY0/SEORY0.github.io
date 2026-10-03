#!/usr/bin/env python3
"""KKACHI v4 symbols: build assets/kkachi/symbols.svg (the <symbol> sprite), the symbol registry block of
kkachi/system/index.html (between <!-- kk-symbols:start --> and <!-- kk-symbols:end -->) and the 16 / 32 px
legibility sheet .scratch/v4/system/legibility.html (build time only; nothing runs on the site).

    python3 docs/kkachi/build-symbols.py

Spec: docs/superpowers/specs/2026-10-02-kkachi-v4-symbol-system-design.md §1–§2; grammar and geometry from
docs/superpowers/research/2026-10-02-kkachi-dashboard-research.md §5 (symbols), §6 (lines), §7 (nacre).

Grammar: shape = kind (tablet = a claim, small square = a code location, strip = one pass, ring = a person, double
line = a boundary, document = a report, triangle = a system failure); fill = progress; overmark = outcome (slash =
rejected, open side = on hold, triangle = failed); the word always beside it. 16-unit grid, stroke 1.25 at 16 px,
square caps (butt for dots and dashes), miter joins, currentColor. Nothing is rotated: no diamonds, no ×, no tilted
ㄱ / + / mark; the slash is a straight line, never a rotated shape. Circles are people only.

How a page uses a symbol (the host carries the class; everything else inherits through <use>):
    <svg class="kk-sym" aria-hidden="true" focusable="false"><use href="../../assets/kkachi/symbols.svg#kk-s-claim-ok"/></svg>
    + the word beside it (marketing: always visible; app: a visible label, or a tooltip and an accessible name).
Colour and stroke come from custom properties on the host (kk-system.css §23 sets them per role and theme):
    --kk-sym-sw      stroke width in grid units (1.25 at 16 px; the size classes keep ~1.25 px on screen)
    --kk-sym-dim     opacity of the not-yet / faded parts (.38)
    --kk-sym-ok      the 재현 확인 / 승인 edge (violet: --confirm)
    --kk-sym-lacquer the lacquer bed under nacre (#292623 in both themes: nacre sits on lacquer only)
    --kk-sym-sev     the filled severity bars (a person set the level; --sev-*)
    --kk-sym-fail    the failure triangle (--st-fail)
    --kk-sym-n       nacre opacity (0 in forced colours), --kk-sym-n-bg the fill under it (Highlight there)
Nacre inside the sprite: each nacre part is a nested <svg> cut of /assets/kkachi/nacre-512.webp (root-relative: see
NACRE below; the same shell window
as the wordmark inlay: tile pixel (238, 268) at grid (0, 0), 5 tile pixels per unit, so pieces of one symbol read as
one shell cut into strips). Not a <pattern>: measured 2026-10-02, Chromium 138 and Firefox — a pattern the page
provides (fill="url(#kk-nacre)") is not reached from inside an external <use>, and a pattern holding an <image>
inside the sprite renders nothing in Firefox; the nested <svg><image> renders in both. A page that draws nacre in its
OWN inline SVG (the proven path of a call graph, a large seal) provides the pattern itself — the snippet is in
.scratch/v4/template-app.html and /kkachi/system/ (#kk-nacre, userSpaceOnUse, the same window and scale).
"""
import html
import json
import os
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'kkachi', 'symbols.svg')
SYS = os.path.join(ROOT, 'kkachi', 'system', 'index.html')
SHEET = os.path.join(ROOT, '.scratch', 'v4', 'system', 'legibility.html')

SW = 'var(--kk-sym-sw,1.25)'
DIM = 'opacity:var(--kk-sym-dim,.38)'
F = 'fill="currentColor" stroke="none"'
OK = 'stroke:var(--kk-sym-ok,currentColor)'
LAC = 'fill:var(--kk-sym-lacquer,#292623)'
SEV = 'fill:var(--kk-sym-sev,currentColor)'
FAIL_S = 'stroke:var(--kk-sym-fail,currentColor)'
FAIL_F = 'fill:var(--kk-sym-fail,currentColor)'
BUTT = 'stroke-linecap="butt"'
NX, NY, NS = 238, 268, 5          # nacre window: tile px at grid (0,0), tile px per grid unit
# root-relative on purpose: Chrome 138 resolves an <image href> inside an external <use> against the page, newer
# Chromium and Firefox against the sprite (measured 2026-10-02); "/assets/…" is the same URL either way (the site is
# served from the domain root: seory0.github.io and the local servers)
NACRE = '/assets/kkachi/nacre-512.webp'


def n(v):
    s = f'{v:.3f}'.rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s


def rect(x, y, w, h, extra=''):
    return f'<rect x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}"{(" " + extra) if extra else ""}/>'


def path(d, extra=''):
    return f'<path d="{d}"{(" " + extra) if extra else ""}/>'


def circ(cx, cy, r, extra=''):
    return f'<circle cx="{n(cx)}" cy="{n(cy)}" r="{n(r)}"{(" " + extra) if extra else ""}/>'


def st(*parts):
    return 'style="' + ';'.join(p for p in parts if p) + '"'


def nacre(x, y, w, h):
    """a nacre piece: the shell window cut to this rect (forced colours: the image goes, Highlight shows)"""
    vb = f'{n(NX + NS * x)} {n(NY + NS * y)} {n(NS * w)} {n(NS * h)}'
    return (rect(x, y, w, h, 'stroke="none" style="fill:var(--kk-sym-n-bg,none)"')
            + f'<svg x="{n(x)}" y="{n(y)}" width="{n(w)}" height="{n(h)}" viewBox="{vb}" preserveAspectRatio="none" '
            f'style="opacity:var(--kk-sym-n,1)"><image href="{NACRE}" width="512" height="512"/></svg>')


def lacquer(x, y, w, h):
    return rect(x, y, w, h, f'stroke="none" {st(LAC)}')


def fitted(x1, y1, x2, y2, kind, extra_style=''):
    """a dotted / dashed side that starts and ends on its corners (butt caps, the side extended by half a stroke at
    each end so two sides meet in a full corner)"""
    dash, gap = {'cand': (1.25, 1.5), 'claim': (3.0, 1.75), 'bar': (1.5, 1.0)}[kind]
    e = 0.625
    L = abs(x2 - x1) + abs(y2 - y1) + 2 * e
    k = max(2, round((L + gap) / (dash + gap)))
    g = (L - k * dash) / (k - 1)
    if x1 == x2:
        d = f'M{n(x1)} {n(min(y1, y2) - e)}V{n(max(y1, y2) + e)}'
    else:
        d = f'M{n(min(x1, x2) - e)} {n(y1)}H{n(max(x1, x2) + e)}'
    return path(d, f'{BUTT} stroke-dasharray="{n(dash)} {n(g)}"' + (f' {st(extra_style)}' if extra_style else ''))


def frect(x, y, w, h, kind, extra_style=''):
    return ''.join([fitted(x, y, x + w, y, kind, extra_style), fitted(x + w, y, x + w, y + h, kind, extra_style),
                    fitted(x, y + h, x + w, y + h, kind, extra_style), fitted(x, y, x, y + h, kind, extra_style)])


# ── shared parts ──
T = (2.5, 4.5, 11, 7)                                    # the claim tablet (3:2), stroke centre
STRIPS = [(4, 6, 2, 4), (7, 6, 2, 4), (10, 6, 2, 4)]   # reproduction slots inside it (whole pixels at 16 px)
RUNS = [(3.5, 3.5, 2, 9), (7, 3.5, 2, 9), (10.5, 3.5, 2, 9)]              # three standing strips (재현)
SLASH = path('M2.5 13.5L13.5 2.5')
BARS = [(2, 10.5, 2, 3), (5.5, 8, 2, 5.5), (9, 5.5, 2, 8), (12.5, 3, 2, 10.5)]


def tablet(extra=''):
    return rect(*T, extra)


def claim_rep(k):
    out = tablet()
    for i, s in enumerate(STRIPS):
        out += rect(*s, F + ('' if i < k else ' ' + st(DIM)))
    return out


def claim_ok():
    out = lacquer(1.875, 3.875, 12.25, 8.25)
    for s in STRIPS:
        out += nacre(*s)
    return out + tablet(st(OK))


def claim_approved():
    return lacquer(1.875, 3.875, 12.25, 8.25) + nacre(4, 6, 8, 4) + tablet(st(OK))


def finding():                                           # a finding in general (nav, why strip): no nacre, no violet;
    return tablet() + rect(5, 7, 6, 2, F)                 # one laid strip inside, so it never reads as 재현 확인's three


def p3():                                                # P3: the three passes fill the tablet (the principle, not a state)
    return tablet() + ''.join(rect(*s, F) for s in STRIPS)


def runs(k, broken=False):
    out = ''
    for i, (x, y, w, h) in enumerate(RUNS):
        if broken and i == 2:
            out += path(f'M{n(x + 1)} {n(y)}v3.25M{n(x + 1)} {n(y + h - 3.25)}v3.25', f'{BUTT} style="stroke-width:2"')
        else:
            out += rect(x, y, w, h, F + ('' if i < k else ' ' + st(DIM)))
    return out


def runs_ok():
    return lacquer(2.25, 2.25, 11.5, 11.5) + ''.join(nacre(*r) for r in RUNS)


def sev(k):
    return ''.join(rect(*b, 'stroke="none" ' + (st(SEV) if i < k else 'fill="currentColor" ' + st(DIM)))
                   for i, b in enumerate(BARS))


def bar_line(i, kind, style=''):
    x, y, w, h = BARS[i]
    cx = x + w / 2
    if kind == 'cand':
        return path(f'M{n(cx)} {n(y)}v{n(h)}', f'{BUTT} stroke-dasharray="1.25 1.5"' + (f' {st(style)}' if style else ''))
    # proposed: a dashed bar the full width of a filled one
    return path(f'M{n(cx)} {n(y)}v{n(h)}', f'{BUTT} stroke-dasharray="1.5 1" style="stroke-width:2{";" + style if style else ""}"')


def sev_unrev():
    return ''.join(bar_line(i, 'cand') for i in range(4))


def sev_prop(k):
    return ''.join(bar_line(i, 'bar' if i < k else 'cand', '' if i < k else DIM) for i in range(4))


def ring(cx=8, cy=8, r=4.75, extra=''):
    return circ(cx, cy, r, extra)


def tri(x, y, s=1.0, fill_dot=True):
    """the failure triangle (upright, never rotated), box 12 x 10.5 at scale 1 from (x, y)"""
    d = f'M{n(x + 6 * s)} {n(y)}L{n(x + 12 * s)} {n(y + 10.5 * s)}H{n(x)}Z'
    out = path(d, st(FAIL_S))
    if fill_dot and s >= 0.9:
        out += path(f'M{n(x + 6 * s)} {n(y + 4 * s)}v{n(3 * s)}', f'{BUTT} {st(FAIL_S)}')
        out += rect(x + 6 * s - 0.65, y + 8.1 * s, 1.3, 1.3, f'stroke="none" {st(FAIL_F)}')
    return out


def scope(dashed_outer=False, faint=False):
    s = DIM if faint else ''
    outer = frect(1.5, 3.5, 13, 9, 'claim', s) if dashed_outer else rect(1.5, 3.5, 13, 9, st(s) if s else '')
    return outer + rect(3.75, 5.75, 8.5, 4.5, st(s) if s else '')


def report(draft=False):
    frame = frect(4, 2.5, 8, 11, 'claim') if draft else rect(4, 2.5, 8, 11)
    return frame + path('M6 6h4M6 8.5h4M6 11h2', BUTT)


# session-line pieces in a 48 x 16 box: five lying strips and the end mark
SEGX = [0.5 + i * 8.25 for i in range(5)]
SEGW = 7.25


def sl_wide(states, end):
    out = ''
    for x, s in zip(SEGX, states):
        if s == 'done':
            out += rect(x, 6.5, SEGW, 3, F)
        elif s == 'now':
            out += rect(x + 0.625, 7.125, SEGW - 1.25, 1.75) + rect(x, 6.5, SEGW / 2, 3, F)
        elif s == 'wait':
            out += path(f'M{n(x)} 8h{n(SEGW)}', f'{BUTT} {st(DIM)}')
        elif s == 'cut':      # the stop: a gap, then the tick (⊣); the rest goes faint
            out += path(f'M{n(x + 2.5)} 3.5v9', '')
        elif s == 'hold':     # the dotted tail
            out += path(f'M{n(x)} 8h{n(SEGW + 8.25)}', f'{BUTT} stroke-dasharray="1.25 1.5"')
        elif s == 'fail':
            out += tri(x - 0.5, 3, 0.7, False)
        elif s == 'none':
            pass
    if end == 'turn':
        out += ring(44.5, 8, 2.75)
    elif end == 'decided':
        out += ring(44.5, 8, 2.75) + circ(44.5, 8, 1.25, F)
    elif end == 'dim':
        out += ring(44.5, 8, 2.75, st(DIM))
    return out


def sl_after(states):
    """faint line through the stages after a stop"""
    return states


def time_cursor(live):
    # ┴: the baseline runs on both sides of the cursor, so it never reads as an L (a cursor on the line's end is banned)
    if live:   # the cursor right of centre, the line after it dotted (not known yet)
        return (path('M1 12.5H8.5', BUTT) + path('M8.5 12.5H15.5', f'{BUTT} stroke-dasharray="1.5 1"')
                + path('M8.5 5V12.5'))
    return path('M1 12.5H8', BUTT) + path('M8 12.5H15', f'{BUTT} style="opacity:.55"') + path('M8 5V12.5')


# ── the symbols: (id, group, word, meaning, viewBox w, body) ──
S = []


def add(sid, group, word, meaning, body, w=16, h=16):
    S.append(dict(id=sid, group=group, word=word, meaning=meaning, w=w, h=h, body=body))


G_CLAIM, G_LOC, G_STRIP, G_HUMAN, G_BOUND, G_REPORT, G_FAIL, G_SEV = (
    '주장 판', '코드 위치', '조각', '사람', '경계', '보고서', '실패', '심각도')
G_SESS, G_TIME, G_LINE, G_END, G_IO, G_PRIN, G_DEG, G_UI = (
    '세션 줄', '시간', '선', '선 끝', '입력 → 출력', '원칙', '정도', '앱')

# claim tablet: one tablet from candidate to finding
add('kk-s-claim-cand', G_CLAIM, '후보', '아직 아무도 보지 않은 의심 지점 (점선 판)', frect(*T, 'cand'))
add('kk-s-claim-hyp', G_CLAIM, '검증 중', '반증할 수 있는 가설, 확인 전 (파선 판)', frect(*T, 'claim'))
add('kk-s-claim-traced', G_CLAIM, '추적됨', '입력에서 닿는 경로를 따라감 (실선 빈 판)', tablet())
add('kk-s-claim-rep0', G_CLAIM, '재현 0/3', '재현을 시작함, 통과 없음', claim_rep(0))
add('kk-s-claim-rep1', G_CLAIM, '재현 1/3', '격리 환경에서 한 번 통과', claim_rep(1))
add('kk-s-claim-rep2', G_CLAIM, '재현 2/3', '두 번 통과. 아직 자개가 아님', claim_rep(2))
add('kk-s-claim-ok', G_CLAIM, '재현 확인', '에이전트가 3/3으로 입증 (violet 테두리, 자개 조각 셋, 옻칠 바탕)', claim_ok())
add('kk-s-claim-approved', G_CLAIM, '승인', '사람이 승인한 발견 (violet 테두리, 판 안 전체 자개)', claim_approved())
add('kk-s-claim-hold', G_CLAIM, '보류', '판단을 미룸. 오른쪽 변이 열린 판에서 점선 꼬리가 나감, 사유를 함께 씀',
    path('M13.5 5.25V4.5H2.5v7h11V10.75') + path('M9.75 8H15.75', f'{BUTT} stroke-dasharray="1.25 1.5"'))
add('kk-s-claim-rejected', G_CLAIM, '기각', '반증됨. 흐린 판에 빗금 하나, 지우지 않음',
    tablet(st(DIM)) + SLASH)
add('kk-s-finding', G_CLAIM, '발견', '발견 일반 (내비, 설명 그림): 판 안에 눕힌 조각 하나. 상태가 아니므로 자개도 violet도 없음', finding())

# code location
add('kk-s-loc', G_LOC, '함수 (정적)', '코드 위치: 정적으로만 추론함 (빈 네모)', rect(5.5, 5.5, 5, 5))
add('kk-s-loc-observed', G_LOC, '함수 (실행 관찰)', '코드 위치: 실행으로 관찰함 (채운 네모)', rect(4.875, 4.875, 6.25, 6.25, F))
add('kk-s-loc-idle', G_LOC, '미탐색', '손대지 않은 함수 (점). 많으면 개수로만 씀', rect(7, 7, 2, 2, F))
add('kk-s-path', G_LOC, '경로', '진입에서 싱크로: 네모 → 가늘어지는 선 → 네모',
    rect(1.5, 6, 4, 4, F) + path('M5.5 6.9L11 7.75v.5L5.5 9.1Z', F) + rect(11.5, 6.5, 3, 3))
add('kk-s-stage-read', G_LOC, '읽기', '함수 지도 (읽기 단계의 산출물): 빈 네모 셋을 가는 맥락 선이 잇는 호출 나무',
    rect(1.75, 6.25, 3.5, 3.5) + rect(10.75, 2.25, 3.5, 3.5) + rect(10.75, 10.25, 3.5, 3.5)
    + path('M5.25 8H8M8 4H10.75M8 12H10.75M8 4V12', f'{BUTT} style="stroke-width:1"'))

# strips: one pass each
add('kk-s-strip', G_STRIP, '통과', '통과 하나 (재현 1회, 관문 하나)', rect(7, 3.5, 2, 9, F))
add('kk-s-strip-lay', G_STRIP, '관문 통과', '순서가 있는 통과 (눕힌 조각)', rect(2, 6.5, 12, 3, F))
add('kk-s-strip-broken', G_STRIP, '실패한 실행', '가운데가 끊긴 조각: 그 실행은 재현되지 않음',
    path('M8 3.5v3.25M8 9.25v3.25', f'{BUTT} style="stroke-width:2"'))
add('kk-s-runs-0', G_STRIP, '재현 0/3', '재현 실행 세 번, 아직 통과 없음', runs(0))
add('kk-s-runs-1', G_STRIP, '재현 1/3', '한 번 통과', runs(1))
add('kk-s-runs-2', G_STRIP, '재현 2/3', '두 번 통과 (셸 흰색, 자개 아님)', runs(2))
add('kk-s-runs-2f', G_STRIP, '재현 2/3 · 1 실패', '세 번째 실행이 재현되지 않음. 지우지 않고 끊긴 조각으로 남김', runs(2, True))
add('kk-s-runs-3', G_STRIP, '재현 3/3 · 확인 기록 전', '세 번 모두 통과했지만 재현 확인이 아직 기록되지 않음 (셸 흰색, 자개 아님: 기록 재생의 짧은 틈)', runs(3))
add('kk-s-runs-ok', G_STRIP, '재현 확인 3/3', '세 번째 통과 때 세 조각이 함께 자개로 바뀜', runs_ok())

# people: the only circles
add('kk-s-human-turn', G_HUMAN, '사람 차례', '사람의 결정이 필요함 (빈 고리)', ring())
add('kk-s-human-decided', G_HUMAN, '사람 결정', '사람이 결정함 (고리 + 가운데 점)', ring() + circ(8, 8, 2, F))
add('kk-s-human-rejected', G_HUMAN, '사람이 기각', '사람이 기각함 (고리 + 빗금)', ring() + path('M4.5 11.5L11.5 4.5'))
add('kk-s-person', G_HUMAN, '사람이 정함', '작성자가 사람인 칸에만 (심각도, 검토 결과)',
    circ(8, 5.25, 2.25) + path('M3.5 13.5C3.5 10.75 5.5 9.25 8 9.25S12.5 10.75 12.5 13.5'))

# boundary: double line
add('kk-s-scope', G_BOUND, '승인 범위', '승인된 대상과 범위 (겹선 = 경계)', scope())
add('kk-s-scope-pending', G_BOUND, '승인 전', '범위가 아직 승인되지 않음 (바깥선 파선)', scope(dashed_outer=True))
add('kk-s-scope-out', G_BOUND, '범위 밖', '판단하지 않는 코드 (흐린 겹선)', scope(faint=True))

# report
add('kk-s-report', G_REPORT, '보고서', '승인된 보고서 (실선 문서)', report())
add('kk-s-report-draft', G_REPORT, '보고서 초안', '사람 검토 전의 초안 (파선 문서)', report(draft=True))
add('kk-s-report-ready', G_REPORT, '공개 준비', '공개는 사람이: 실선 문서 + 끝 고리',
    rect(2.5, 2.5, 7.5, 11) + path('M4.5 6h3.5M4.5 8.5h3.5M4.5 11h2', BUTT) + ring(12.75, 11, 2.25))

# system failure only
add('kk-s-fail', G_FAIL, '실패', '시스템 실패만 (VM 연결, 시간 초과, 빌드). 기각은 실패가 아님', tri(2, 2.75))

# severity: a ladder of four, counted
for k, w in [(0, '정보'), (1, '낮음'), (2, '중간'), (3, '높음'), (4, '심각')]:
    add(f'kk-s-sev-{k}', G_SEV, w, f'사람이 정한 심각도: 채운 막대 {k}개' + (' (색은 확정 뒤에만)' if k else ''), sev(k))
add('kk-s-sev-unrev', G_SEV, '검토 전', '아무도 정하지 않음: 막대 넷 모두 점선', sev_unrev())
for k, w in [(1, '낮음'), (2, '중간'), (3, '높음'), (4, '심각')]:
    add(f'kk-s-sev-prop-{k}', G_SEV, f'제안 · {w}', f'에이전트의 제안 (파선 막대 {k}개, 색 없음). 사람이 확정하기 전', sev_prop(k))

# session line: five lying strips (읽기 · 가설 · 추적 · 재현 · 보고) and the end mark
add('kk-s-session', G_SESS, '세션', '세션 (내비 아이콘): 조각 둘 + 고리',
    rect(1, 6.5, 4.5, 3, F) + rect(6.5, 6.5, 4.5, 3, F) + ring(13.25, 8, 2.25))
add('kk-s-session-run', G_SESS, '실행 중', '현재 칸이 차오르는 중 (동작 줄이기: 절반)', sl_wide(['done', 'done', 'now', 'wait', 'wait'], 'dim'), 48)
add('kk-s-session-turn', G_SESS, '사람 차례', '다섯 칸이 차고 끝에 빈 고리', sl_wide(['done'] * 5, 'turn'), 48)
add('kk-s-session-decided', G_SESS, '사람 결정', '끝 고리 안에 점', sl_wide(['done'] * 5, 'decided'), 48)
add('kk-s-session-cut', G_SESS, '기각으로 멈춤', '멈춘 칸 다음에 틈 + 수직 눈금 (⊣), 나머지는 흐림',
    sl_wide(['done', 'done', 'cut', 'none', 'none'], '') + path('M24.5 8H40.75', f'{BUTT} {st(DIM)}'), 48)
add('kk-s-session-hold', G_SESS, '보류로 멈춤', '멈춘 칸 다음에 점선 꼬리', sl_wide(['done', 'done', 'done', 'hold', 'none'], ''), 48)
add('kk-s-session-fail', G_SESS, '실패로 멈춤', '멈춘 칸 자리에 세모 (실패 색)',
    sl_wide(['done', 'done', 'fail', 'none', 'none'], '') + path('M27 8H40.75', f'{BUTT} {st(DIM)}'), 48)
add('kk-s-session-wait', G_SESS, '대기', '다섯 칸이 모두 흐린 가는 선', sl_wide(['wait'] * 5, 'dim'), 48)

# time cursor ┴
add('kk-s-time-live', G_TIME, '실시간', '커서가 오른쪽, 뒤는 점선 (아직 모름)', time_cursor(True))
add('kk-s-time-replay', G_TIME, '기록', '커서가 가운데, 뒤는 흐린 실선 (기록됨)', time_cursor(False))

# lines (32 x 16): texture = certainty
add('kk-s-ln-context', G_LINE, '맥락', '가지 않은 가지, 맥락 호출 (가는 선)', path('M1 8h30', f'{BUTT} {st(DIM)} stroke-width="1"'), 32)
add('kk-s-ln-cand', G_LINE, '후보', '아직 안 봄 (점선)', path('M1 8h30', f'{BUTT} stroke-dasharray="1.25 1.5"'), 32)
add('kk-s-ln-claim', G_LINE, '주장 · 추정', '가설 경로, 추정 (파선)', path('M1 8h30', f'{BUTT} stroke-dasharray="3 1.75"'), 32)
add('kk-s-ln-traced', G_LINE, '추적됨', '관찰한 경로, 받는 쪽으로 가늘어짐 (화살촉 없음)', path('M1 6.75L31 7.6V8.4L1 9.25Z', F), 32)
add('kk-s-ln-proven', G_LINE, '입증', '끊음질 자개 조각선: 선택한 발견의 확인 경로 하나에만',
    lacquer(0.5, 5.5, 31, 5) + nacre(1, 6.5, 6.5, 3) + nacre(8.5, 6.75, 6.5, 2.5) + nacre(16, 7, 6.5, 2) + nacre(23.5, 7.25, 7, 1.5), 32)
add('kk-s-ln-boundary', G_LINE, '경계', '겹선: 승인 범위, 기계 증거와 사람 결정 사이, 샘플 영역', path('M1 6.5h30M1 9.5h30', BUTT), 32)

# line ends (32 x 16): the end says the outcome; the middle stays bare (모로단청)
add('kk-s-end-rejected', G_END, '기각', '틈 + 수직 눈금 (⊣)', path('M1 8h20.5', BUTT) + path('M24 4v8'), 32)
add('kk-s-end-hold', G_END, '보류', '점선 꼬리로 흐려지며 끝남',
    path('M1 8h15', BUTT) + path('M16 8h15', f'{BUTT} stroke-dasharray="1.25 1.5"'), 32)
add('kk-s-end-fail', G_END, '실패', '끝에 세모', path('M1 8h17', BUTT) + tri(19, 2.75), 32)
add('kk-s-end-ok', G_END, '확인', '끝에 판 (재현 확인)', path('M1 7.25L19.5 7.75v.5L1 8.75Z', F) + rect(20.5, 4.5, 10, 7, st(OK)), 32)
add('kk-s-end-turn', G_END, '사람 차례', '끝에 빈 고리', path('M1 8h21', BUTT) + ring(26.5, 8, 3.75), 32)

# input → output (the why strip)
add('kk-s-in-source', G_IO, '소스', '소스 코드 (들여 쓴 줄)', path('M2.5 3.5h7M5 6.5h8M5 9.5h5.5M2.5 12.5h5', BUTT))
add('kk-s-in-binary', G_IO, '바이너리', '바이너리 (바이트 칸)', ''.join(rect(x, y, 3, 1.75, F) for y in (3.5, 7.25, 11) for x in (2, 6.5, 11)))
add('kk-s-config', G_IO, '설정', '빌드 설정 · 앱 설정: 길이가 다른 눕힌 조각 셋 (정해 둔 값)',
    rect(2, 2.5, 12, 2.5, F) + rect(2, 6.75, 6.5, 2.5, F) + rect(2, 11, 9.5, 2.5, F))
add('kk-s-in-crash', G_IO, '크래시 로그', '크래시 로그: 기록 줄의 마지막이 채운 코드 위치 네모에서 멈춤',
    path('M2.5 3.5H13.5M2.5 6.5H11M2.5 9.5H12.5M2.5 12.5H9.75', BUTT) + rect(9.75, 10.75, 3.5, 3.5, F))
add('kk-s-out-cmd', G_IO, '재현 명령', '복사해서 그대로 실행할 수 있는 재현 명령: 시작 네모, 눕힌 조각, 통과 조각 셋',
    rect(0.75, 6.75, 2.5, 2.5, F) + rect(4.25, 7.25, 3, 1.5, F) + ''.join(rect(x, 4.5, 1.5, 7, F) for x in (8.75, 11.25, 13.75)))
add('kk-s-out-fix', G_IO, '수정 방향', '수정 제안: 지운 줄 하나는 흐리게, 더한 줄 하나는 왼쪽 막대와 실선',
    path('M2.5 4.5H13.5', f'{BUTT} {st(DIM)}') + path('M3.25 8.25V13.25', BUTT) + path('M6 10.75H13.5', BUTT))
add('kk-s-out-rejlog', G_IO, '기각 기록', '버린 가설의 기록: 기각 판과 같은 모양 (한 어휘)', tablet(st(DIM)) + SLASH)
add('kk-s-mark', G_IO, 'KKACHI', 'ㄲ 마크 (C′1 원본 path, 고치지 않음)', '', 16)   # body set below (fill, own viewBox)

# trust bar: five principles
add('kk-s-p1', G_PRIN, '승인된 대상만', 'P1 허가받은 대상만 봅니다 (겹선)', scope())
add('kk-s-p2', G_PRIN, '격리해서 재현', 'P2 격리된 곳에서만 재현합니다 (겹선 안의 조각)',
    rect(1.5, 1.5, 13, 13) + rect(3.75, 3.75, 8.5, 8.5) + rect(7, 5.5, 2, 5, F))
add('kk-s-p3', G_PRIN, '재현 없으면 발견 아님', 'P3 재현되지 않으면 발견이 아닙니다 (조각 셋이 판을 채움)', p3())
add('kk-s-p4', G_PRIN, '버린 가설도 기록', 'P4 버린 가설도 기록합니다 (빗금 판)', tablet(st(DIM)) + SLASH)
add('kk-s-p5', G_PRIN, '공개는 사람이', 'P5 혼자 공개하지 않습니다 (고리)', ring())

# degree squares (comparison matrix, autonomy strip)
add('kk-s-deg-full', G_DEG, '함', '한다 (채운 네모)', rect(3, 3, 10, 10, F))
add('kk-s-deg-half', G_DEG, '일부', '일부만 한다 (반 채운 네모)', rect(3.625, 3.625, 8.75, 8.75) + rect(3, 3, 5, 10, F))
add('kk-s-deg-none', G_DEG, '안 함', '하지 않는다 (빈 네모)', rect(3.625, 3.625, 8.75, 8.75))
add('kk-s-noexfil', G_DEG, '외부 전송 안 함', '선이 경계 앞에서 멈춤', path('M1.5 8h6.5', BUTT) + path('M11 2.5v11M13.75 2.5v11', BUTT))

# app
add('kk-s-overview', G_UI, '개요', '개요 (패널 셋)', rect(2.5, 2.5, 5, 11) + rect(9.5, 2.5, 4, 4.5) + rect(9.5, 9, 4, 4.5))
add('kk-s-log', G_UI, '기록', '감사 기록 (척추와 마디)', path('M4 2v12', BUTT) + path('M6.5 4h7M6.5 8h5M6.5 12h6', BUTT) + rect(3, 3, 2, 2, F) + rect(3, 7, 2, 2, F) + rect(3, 11, 2, 2, F))
add('kk-s-search', G_UI, '검색', '검색 (네모 렌즈)', rect(2.5, 2.5, 7, 7) + path('M9.5 9.5l4 4'))
add('kk-s-copy', G_UI, '복사', '복사 (겹친 네모, 뒤는 흐리게)', rect(2.5, 2.5, 8, 8, st(DIM)) + rect(5.5, 5.5, 8, 8))

# the mark: the C′1 master path, unmodified, its own viewBox (fill, no stroke)
MARK = ('M15 3H45V33C42.5 22.75 36 29.75 36 16.5V12H31.5C18.25 12 25.25 5.5 15 3Z'
        'M3 15H33V45C30.5 34.75 24 41.75 24 28.5V24H19.5C6.25 24 13.25 17.5 3 15Z')
for s in S:
    if s['id'] == 'kk-s-mark':
        s['raw'] = f'<symbol id="kk-s-mark" viewBox="3 3 42 42"><path fill="currentColor" d="{MARK}"/></symbol>'


def symbol(s):
    if 'raw' in s:
        return s['raw']
    return (f'<symbol id="{s["id"]}" viewBox="0 0 {s["w"]} {s["h"]}"><g fill="none" stroke="currentColor" '
            f'stroke-linecap="square" stroke-linejoin="miter" style="stroke-width:{SW}">{s["body"]}</g></symbol>')


HEAD = '''<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" aria-hidden="true">
<!-- KKACHI symbols v4 — generated by docs/kkachi/build-symbols.py; edit there, not here.
     Use: <svg class="kk-sym" aria-hidden="true" focusable="false"><use href="../../assets/kkachi/symbols.svg#ID"/></svg>
     and the word beside it. Registry with meanings, sizes and do / don't: /kkachi/system/#sys-symbols.
     16-unit grid, stroke 1.25 at 16 px (the host sets it: kk-sym-sw), square caps, currentColor; nothing rotated, no diamonds, no ×.
     Nacre parts are nested cuts of nacre-512.webp on their own lacquer bed (proven only: 재현 확인, 승인, the proven line). -->
'''


def build():
    assert '--' not in HEAD.split('<!--', 1)[1].rsplit('-->', 1)[0], 'no double hyphen inside an XML comment'
    body = HEAD + '\n'.join(symbol(s) for s in S) + '\n</svg>\n'
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(body)
    print('wrote', OUT, len(body.encode()), 'bytes,', len(S), 'symbols')


def registry_html():
    """the style guide's symbol registry rows: each symbol at 16 and 32 px in both themes, its word, its one meaning"""
    rows, last = [], None
    for s in S:
        if s['group'] != last:
            rows.append(f'<tr class="p-sys-grp"><th scope="rowgroup" colspan="5">{html.escape(s["group"])}</th></tr>')
            last = s['group']
        w = s['w']
        cls = 'kk-sym' + ('' if w == 16 else f' kk-sym--w{w // 16}')
        u = f'<use href="../../assets/kkachi/symbols.svg#{s["id"]}"/>'
        pair = (f'<svg class="{cls}" aria-hidden="true" focusable="false">{u}</svg>'
                f'<svg class="{cls} kk-sym--32" aria-hidden="true" focusable="false">{u}</svg>')
        rows.append(f'<tr><td class="p-sys-g" data-theme="dark">{pair}</td><td class="p-sys-g" data-theme="light">{pair}</td>'
                    f'<th scope="row">{html.escape(s["word"])}</th><td>{html.escape(s["meaning"])}</td>'
                    f'<td><code>{s["id"][5:]}</code></td></tr>')
    return '\n'.join(rows)


def write_registry():
    if not os.path.exists(SYS):
        return
    src = open(SYS, encoding='utf-8').read()
    new = re.sub(r'(<!-- kk-symbols:start -->).*?(<!-- kk-symbols:end -->)',
                 lambda m: m.group(1) + '\n' + registry_html() + '\n' + m.group(2), src, flags=re.S)
    if new != src:
        open(SYS, 'w', encoding='utf-8').write(new)
        print('updated registry in', SYS)


def write_sheet():
    os.makedirs(os.path.dirname(SHEET), exist_ok=True)
    cells = []
    for s in S:
        w = s['w']
        cls = 'kk-sym' + ('' if w == 16 else f' kk-sym--w{w // 16}')
        u = f'<use href="/assets/kkachi/symbols.svg#{s["id"]}"/>'
        cells.append(f'<div class="c{" w" if w > 16 else ""}"><div class="r"><svg class="{cls}">{u}</svg>'
                     f'<svg class="{cls} kk-sym--32">{u}</svg></div><span class="l">{html.escape(s["word"])}</span></div>')
    grid = '\n'.join(cells)
    page = f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>KKACHI symbols · legibility</title>
<link rel="stylesheet" href="/assets/kkachi/kk-system.css">
<style>
body{{margin:0}} .sheet{{padding:18px 22px 22px;background:var(--bg);color:var(--fg-1)}}
.sheet h2{{margin:0 0 12px;font:600 13px/1.4 var(--font-sans);color:var(--fg-2)}}
.g{{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:12px 10px}}
.c{{display:flex;flex-direction:column;gap:5px;min-width:0}} .c.w{{grid-column:span 2}}
.r{{display:flex;align-items:center;gap:10px;min-height:32px}}
.l{{font:500 12px/16px var(--font-sans);color:var(--fg-2)}}
.on-s1{{background:var(--s1)}}
</style></head><body class="kk">
<div class="sheet" data-theme="dark"><h2>어두운 테마 · 16px / 32px</h2><div class="g">{grid}</div></div>
<div class="sheet" data-theme="light"><h2>밝은 테마 · 16px / 32px</h2><div class="g">{grid}</div></div>
</body></html>'''
    open(SHEET, 'w', encoding='utf-8').write(page)
    print('wrote', SHEET)


if __name__ == '__main__':
    build()
    write_registry()
    write_sheet()
    json.dump([{k: s[k] for k in ('id', 'group', 'word', 'meaning', 'w')} for s in S],
              open(os.path.join(ROOT, '.scratch', 'v4', 'system', 'symbols.json'), 'w'), ensure_ascii=False, indent=1)
