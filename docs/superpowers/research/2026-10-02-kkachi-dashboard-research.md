# KKACHI 리서치: 믿을 수 있고 쓰기 좋은 대시보드, 심볼과 선 중심의 디자인 시스템

- 날짜: 2026-10-02
- 요청: Unit 42, Datadog, CrowdStrike 같은 보안 대시보드를 참고해 신뢰감 있고 쓰기 좋은 대시보드를 만드는 방법을 조사한다. 그 결과로 주제에 맞고, 자개를 쓰고, 글자보다 한 눈에 알아보는 심볼 위주이며, 선을 잘 쓰는 디자인 시스템을 만든다. 지금 사이트는 "예뻐 보이기 위한 사이트"라 전달력이 약하다는 문제의식에서 출발했다.
- 방법: 다섯 갈래로 나눠 조사한 결과를 이 문서 하나로 합쳤다.
  - 제품 세 곳: Datadog, CrowdStrike Falcon, Palo Alto(Unit 42 · Cortex · Prisma).
  - 같은 분야 제품과 신뢰 연구: Wiz, Snyk, GitHub, Semgrep, Google SecOps, 그리고 Google PAIR, Microsoft HAX, NN/g, Few, Healey, Tufte.
  - 심볼과 선 체계: MIL-STD-2525D, TCAS II, ISA-101, Carbon, Primer, Linear, 끊음질과 단청.
  - 현재 KKACHI 페이지 감사(home, why, notes, waitlist, dashboard).
  - 공개 문서와 공식 스크린숏만 보았고, 개인 브라우저는 쓰지 않았다.
- 관련 문서: `docs/superpowers/specs/2026-10-02-kkachi-v3-unified-design.md`(이하 v3), `2026-09-28-kkachi-home-design.md` §9(브랜드 금지 규칙)·§13(자개).
- 원자료: 스크린숏과 문서 사본은 `.scratch/research/{datadog,crowdstrike,paloalto,peers-trust,symbols-lines,kkachi-audit}/`에 있다. git에서 제외된 폴더라 로컬에서만 볼 수 있다. 이 문서의 심볼 스케치를 실제로 그린 것은 `.scratch/research/synthesis/glyphs.html`과 `glyphs.png`다.
- 표기: 예시 수치는 모두 현재 대시보드의 샘플 세션 7F2A와 개요 샘플에서 가져왔다. 새로 지어낸 사실이나 통계는 없다. 경쟁사 문구와 이미지는 저장소에 옮기지 않고 요약만 했다.

---

## 1. 한 줄 결론과 핵심 원칙

**한 줄 결론.** 보안 도구에서 신뢰는 꾸밈에서 나오지 않는다. 결론에 어떻게 이르렀는지, 무엇을 버렸는지, 사람은 무엇을 결정해야 하는지를 한 눈에 보여 줄 때 나온다. 그래서 KKACHI 디자인 시스템의 뼈대는 다음 세 가지다.
- 작은 심볼 문법: 모양 = 종류, 채움 = 진행, 덧표시 = 결과.
- 엄격한 선 문법: 선의 결 = 확실성, 선의 끝 = 결과.
- 자개는 "입증된 것"에만 박는다.

### 핵심 원칙 7

1. **결과보다 줄어든 과정을 보여 준다.** 많은 입력이 적은 결론으로 줄어드는 흐름을 그리고, 빠진 것마다 이유와 개수를 단다. 그러면 "발견 1개"가 비어 보이지 않고 엄밀해 보인다.
   - 근거: Datadog Code Security의 'filtered by risk' 깔때기([블로그](https://www.datadoghq.com/blog/datadog-code-security/)), Cortex XSIAM Command Center와 Exposure Prioritization의 감소 흐름([문서](https://cortex-docs.paloaltonetworks.com/cortex-xsiam/detect-investigate-and-respond-to-threats/exposure-management/exposure-management-command-center.md)), Charlotte AI 개요의 Triage 흐름([제품 페이지](https://www.crowdstrike.com/en-us/platform/charlotte-ai/)).
2. **주장 옆에는 사람이 직접 확인할 수 있는 증거를 둔다.** 설명이 아니라 검증 수단을 준다. 그럴듯한 설명은 AI가 틀렸을 때도 수용률을 높인다(Bansal et al. CHI 2021, [arXiv](https://arxiv.org/abs/2006.14779)). 설명은 사람이 답을 검증할 수 있게 해 줄 때만 도움이 된다(Fok & Weld 2023, [arXiv](https://arxiv.org/abs/2305.07722)).
   - 사례: Datadog Bits AI의 'Key evidence'([문서](https://docs.datadoghq.com/bits_ai/bits_security_analyst/)), Charlotte 판정 설명의 증거 인용([블로그](https://www.crowdstrike.com/en-us/blog/using-agentic-ai-to-power-cdr/)), GitHub 'Show paths'([문서](https://docs.github.com/en/code-security/code-scanning/managing-code-scanning-alerts/assessing-code-scanning-alerts-for-your-repository)).
3. **버린 것도 남기고, 이유와 되돌리기를 붙인다.** 기각된 가설은 지우지 않고, 흐리게 그대로 둔다. 기각은 "안전"을 뜻하지 않는다는 문장도 고정으로 붙인다.
   - 근거: Bits Investigation 가설 트리의 ruled-out 가지([문서](https://docs.datadoghq.com/bits_ai/bits_ai_sre/investigate_issues/)), Semgrep의 걸러낸 항목 탭과 이유([블로그](https://semgrep.dev/blog/2025/announcing-ai-noise-filtering-and-triage-memories/)), GitHub 경고 해제 사유와 다시 열기([문서](https://docs.github.com/en/code-security/code-scanning/managing-code-scanning-alerts/resolving-code-scanning-alerts)), Snyk의 'NO PATH FOUND ≠ 도달 불가' 단서([문서](https://docs.snyk.io/scan-fix-and-prevent/fix/prioritize-issues-for-fixing/reachability-analysis)).
4. **선이 말하게 한다. 선의 결은 확실성, 선의 끝은 결과다.** 실선 = 관찰, 파선 = 주장·추정, 점선 = 아직 안 봄, 끊음질 자개 조각 = 입증, 끝의 눈금 = 기각.
   - 근거: MIL-STD-2525D(실선 = 확인, 파선 = 의심, §5.3.2.3, [PDF](http://www.mapsymbs.com/MilStd2525D.pdf)), Bits 가설 트리의 선 문법, Cortex의 점선 = 보류 작업([아이콘 키](https://cortex-docs.paloaltonetworks.com/cortex-xsiam/detect-investigate-and-respond-to-threats/investigation-and-response/investigate-issues/causality-view/causality-icons-key)), Google SecOps 그래프의 선 유형([문서](https://docs.cloud.google.com/chronicle/docs/soar/investigate/working-with-cases/explore-entities-and-alerts-investigation)), 화살표보다 빨리 읽히는 가늘어지는 간선(Holten & van Wijk, [ACM](https://dl.acm.org/doi/10.1145/1518701.1519054)).
5. **작은 심볼 문법 하나로 말하고, 글자는 늘 곁에 둔다.** 기본 모양은 12개 안팎으로 둔다. 모양, 채움, 덧표시를 조합해서 쓰고, 색만으로 구분하지 않는다. 마케팅 페이지에서는 짧은 한국어 라벨을 항상 보이게 한다.
   - 근거: 2525D의 틀·채움·덧표시 구조, Carbon의 "최소 두 가지 단서, 3:1 대비"([문서](https://carbondesignsystem.com/patterns/status-indicator-pattern/)), Cortex의 아이콘 약 80개가 학습을 막는 반례, NN/g의 "라벨은 늘 보이게"([문서](https://www.nngroup.com/articles/icon-usability/)).
6. **평소에는 어둡게 두고, 색과 자개는 '확인'에만 쓴다.** 정상 상태는 회색 옻칠이다. violet과 자개는 확인에만 예약하고, 다른 색 신호는 사람의 행동이 필요할 때만 켠다.
   - 근거: ISA-101 고성능 HMI와 Airbus 'light out'([ISA](https://blog.isa.org/the-high-performance-hmi)), Datadog DRUIDS가 Watchdog(AI) 색을 예약한 방식([문서](https://druids.datadoghq.com/foundations/color)), Healey의 단일 특징 즉시 탐지([문서](https://www.csc2.ncsu.edu/faculty/healey/PP/index.html)).
7. **사람의 결정과 시간을 화면 구조에 넣는다.** 사람 검토 상자는 증거와 겹선으로 나누고, 버튼마다 결과를 미리 적는다. 시각은 절대 시각과 상대 시각을 함께 쓴다. 판단은 날짜가 붙은 갱신 기록으로 남긴다.
   - 근거: Datadog 신호 패널의 Next Steps([문서](https://docs.datadoghq.com/security/cloud_siem/triage_and_investigate/investigate_security_signals/)), Cortex Resolution Center의 "다음에 무엇을 할까"([문서](https://cortex-docs.paloaltonetworks.com/cortex-xsiam/detect-investigate-and-respond-to-threats/investigation-and-response/analyze-and-resolve-cases/resolve-the-case/resolution-center.md)), Microsoft 에이전트 UX 원칙([글](https://microsoft.design/articles/ux-design-for-agents/)), Unit 42 위협 보고의 갱신 기록([예](https://unit42.paloaltonetworks.com/netscaler-zero-days-exploited/)).

---

## 2. 제품별 배울 점

각 항목은 "무엇인가 → KKACHI에서는 → 출처" 순서로 적었다.

### 2.1 Datadog (DRUIDS 디자인 시스템, Cloud SIEM, Bits AI, Code Security)

- **판정 한 문장과 핵심 근거 목록.** Bits AI Security Analyst 패널은 판정 칩이 든 한 문장("…clear evidence of…")으로 시작한다. 바로 아래 'Key evidence' 3–5줄이 이어지고, 각 줄은 아이콘, 굵은 주장, 사실 하나로 되어 있다. 아래쪽에는 피드백과 행동 버튼이 있다.
  - KKACHI: F-01 머리를 "[확인] copy_rows()의 행 길이 계산에서 정수 오버플로 · 근거 4"로 쓴다. 근거 줄은 '도달 rows.c:207 → 212', '재현 격리 VM 3회 모두 크래시', '원인 width × bpp 32비트 곱셈', '기각된 대안 H2·H3'으로 둔다.
  - 출처: [문서](https://docs.datadoghq.com/bits_ai/bits_security_analyst/), [블로그](https://www.datadoghq.com/blog/bits-ai-security-analyst/).
- **가설 트리와 선 문법.** Bits Investigation은 가설을 트리로 그린다. 입증된 가설은 실선 테두리와 체크 배지로, 결론 없는 가설은 점선과 '?'로 표시한다. 기각된 가설은 흐린 점선과 사선 원으로 표시하되 캔버스에 남겨 둔다. 이긴 경로는 굵은 실선이다. 결론 카드는 트리 아래에 두고, 단계 레일(Agent Trace)은 따로 둔다.
  - KKACHI: H1–H4와 "버린 가설도 기록" 원칙이 거의 그대로 대응한다. 판단 기록(트리)과 단계 기록(레일) 두 보기를 둔다.
  - 출처: [문서](https://docs.datadoghq.com/bits_ai/bits_ai_sre/investigate_issues/), [블로그](https://www.datadoghq.com/blog/building-bits-ai-sre/).
- **점수 장부 척추.** Severity Breakdown은 세로선 하나에 시작 점수, 요인별 효과(올림, 내림, 변화 없음), 최종 점수를 차례로 단다. 사람이 바꾼 값도 "누가 · 사유"와 함께 한 칸으로 남긴다.
  - KKACHI: 발견마다 '관문 장부'를 둔다. 읽기 → 가설 → 추적 → 재현 → 보고의 각 마디에 통과한 산출물을 단다. 심각도는 "검토 전 → 중간 · 검토자 · 사유"처럼 사람의 변경을 기록한다.
  - 출처: [문서](https://docs.datadoghq.com/security/manual_severity_adjustment/), [문서](https://docs.datadoghq.com/security/code_security/).
- **줄어드는 깔때기.** Code Security 요약은 All 77 → In Production 75 → Exploit Available 64 → Exposed 5로 줄어든다. 빠진 띠마다 이유와 비율을 단다.
  - KKACHI: 개요와 why의 주인공으로 쓴다(§8, §9).
  - 출처: [블로그](https://www.datadoghq.com/blog/datadog-code-security/).
- **상태를 나르는 선.** 상세 패널 위쪽에는 심각도 색의 4px 선을, 목록 행과 패싯 앞에는 짧은 세로 막대를 둔다. DRUIDS는 색만 있는 StatusPill에도 반드시 글자 상태를 함께 두라고 한다.
  - 출처: [StatusPill](https://druids.datadoghq.com/components/pills/StatusPill), [SIEM 문서](https://docs.datadoghq.com/security/cloud_siem/triage_and_investigate/investigate_security_signals/).
- **한 가지 시간 모델.** 시간 범위는 Live와 고정 중 하나이고, URL에 실린다. 절대 시각과 상대 시각을 함께 쓴다("… 10:59:27 am · about 1 hour ago"). 전역과 다른 시간 창을 쓰는 위젯에는 작은 기간 칩을 단다. 목록 위에는 얇은 히스토그램 띠를 둔다.
  - 출처: [문서](https://docs.datadoghq.com/dashboards/guide/custom_time_frames/), [TimePill](https://druids.datadoghq.com/components/pills/TimePill).
- **요약 타일 = 필터.** Security Inbox 타일은 큰 숫자, 1–3단어 라벨, 상태 글리프 하나로 되어 있고, 누르면 아래 목록이 걸러진다.
  - 출처: [문서](https://docs.datadoghq.com/security/security_inbox/), [CalloutValue](https://druids.datadoghq.com/components/measures/CalloutValue).
- **0도 숨기지 않는 개수.** 패싯에 'Critical 0'도 보이게 하고, 결과 줄은 "8 results (based on 204)"처럼 전체 대비로 쓴다.
  - 출처: [SIEM 문서](https://docs.datadoghq.com/security/cloud_siem/triage_and_investigate/investigate_security_signals/).
- **상세 패널의 고정된 해부.** 순서는 정체와 시각 → 핵심 속성 격자 → What happened → Next steps(굵은 왼쪽 선) → 원본 JSON 탭(맨 끝)이다. 없는 값은 "Tag not available"처럼 분명히 쓴다. 패널을 연 채 ↑/↓로 목록을 넘길 수 있다.
  - 출처: [SidePanel](https://druids.datadoghq.com/components/layout/SidePanel), [Tags](https://druids.datadoghq.com/patterns/tags).
- **예약 색과 세 단계 토큰.** DRUIDS는 Watchdog(AI) 색을 "잘못 쓰거나 남용하지 말라"고 못 박고, 기계가 찾은 영역은 파선 상자로 표시한다. 상태색은 base, contrast(글자), soft(배경) 세 단계로 둔다.
  - 출처: [Color](https://druids.datadoghq.com/foundations/color), [Watchdog](https://docs.datadoghq.com/watchdog/insights/).
- **아이콘 구성 규칙.** 한 격자, 일정한 선 굵기, 각진 끝(square cap), 90°/45° 흐름선에 브랜드 고유 각도 하나를 더한다.
  - KKACHI: 24px 격자, 1.5px 선, 각진 끝을 쓴다. 고유 각도 대신 '가늘어지는 바늘 끝' 하나를 고유 표지로 삼는다(§6).
  - 출처: [Icon principles](https://druids.datadoghq.com/icons/icon-principles).
- **차분한 상태.** 로딩은 '로딩 중'과 '로드됨' 두 단계만 둔다. 결과가 없는 게 좋은 소식이면 낙관적 빈 상태로 보여 준다. 오류는 위젯 단위로, 할 일과 함께 보여 준다. 행의 반복 버튼은 포커스나 호버 전까지 조용히 둔다.
  - 출처: [Loading](https://druids.datadoghq.com/patterns/loading), [Error](https://druids.datadoghq.com/patterns/error-states), [Quiet](https://druids.datadoghq.com/patterns/quiet-states).
- **따라 하지 말 것**
  - 모든 섹션에 붙은 대문자 마이크로 라벨(v3 §4와 충돌).
  - 탭 8개짜리 패널.
  - 털뭉치 같은 Service Map.
  - 신호등 빨강·주황 팔레트.
  - 보라를 AI와 'BENIGN' 판정에 함께 쓰는 의미 충돌. KKACHI의 violet이 같은 함정에 빠지지 않아야 한다.

### 2.2 CrowdStrike Falcon (Glide Core, Insight XDR, Charlotte AI)

- **질문을 축별로 나눈다.** 심각도(1–100), 확신도(1–100), 상태, 이미 한 조치, AI 판정을 서로 다른 칸에 둔다.
  - KKACHI: 발견마다 네 칸을 고정한다. 심각도(사람) · 검증(재현 n/3) · 상태(검토 대기 등) · 다음 행동. 확신도 %는 만들지 않는다. KKACHI의 확신은 재현 3/3이다.
  - 출처: [falcon-mcp](https://github.com/CrowdStrike/falcon-mcp/blob/main/falcon_mcp/resources/detections.py), [Detects API](https://developer.crowdstrike.com/api-reference/collections/detects/).
- **색이 아니라 실루엣으로 구분하는 심각도.** Glide Core는 원, 세모, 둥근 네모, 육각형을 쓴다. 예전 목록은 High와 Critical을 같은 육각형에 색만 달리해 구분했고, 그 약점을 고친 것이다.
  - KKACHI: "색만으로 구분하지 않는다"는 교훈은 따른다. 다만 등급처럼 순서가 있는 값은 모양보다 개수로 그린다(§5.5, Bertin과 MacEachren 근거). 육각형은 CrowdStrike의 상징이라 쓰지 않는다.
  - 출처: [glide-core](https://github.com/CrowdStrike/glide-core/tree/main/src/icons).
- **왼쪽에서 오른쪽으로 그리는 프로세스 트리.** 보통 프로세스는 작은 회색 점이고, 탐지가 난 노드만 심각도 글리프를 받는다. 주입처럼 트리가 아닌 관계는 곡선 호로 그린다.
  - KKACHI: 진입 → … → 싱크를 가로선 하나에 그린다. 보통 함수는 작은 네모, 조건이 실제로 성립하는 곳만 강조한다. 호출이 아닌 데이터 흐름은 호로 그린다.
  - 출처: [Tech Center](https://www.crowdstrike.com/blog/tech-center/hunt-threat-activity-falcon-endpoint-protection/).
- **범례 = 필터.** 범례 한 줄에 개체 유형별 글리프, 개수, 보이기 토글을 둔다. 노드에 호버하면 관련 없는 것이 흐려진다. 간선에는 관계와 개수를 쓴다('EmailAttachment (3)').
  - 출처: [Insight XDR walkthrough](https://www.crowdstrike.com/tech-hub/endpoint-security/falcon-insight-xdr-walkthrough/).
- **목록 → 검사 패널 → 전체 페이지.** 한 객체를 탭으로 여러 모양(상세, 그래프, 타임라인)으로 보여 준다. 섹션 머리에 글리프 · 이름 · 개수를 달고, 그 섹션에 해당하는 행동을 섹션 머리에 둔다.
- **라벨 위, 값 아래.** 라벨은 작고 흐리게, 값은 밝게 둔다. 모노 글꼴은 실제 인공물(명령줄, 경로, SHA256)에만 쓰고 복사 버튼을 단다. 'Show decoded' 스위치로 원문과 해석을 오간다. 목록은 날짜를 가는 선 안에 넣어 묶는다.
  - KKACHI: v3의 '라벨에 모노 금지'와 같은 방향이다. 크래시 입력에는 '원문 / 해석' 스위치를 둔다.
- **'Actions taken'.** 시스템이 이미 한 일을 과거형 동사로 쓴다('Process blocked'). 누가, 무엇이 실행을 시작했는지도 밝힌다.
  - KKACHI: '에이전트가 한 일'(재현 3/3, 격리 VM 폐기, 보고서 초안)은 채운 글리프로, '하지 않은 일 · 사람 몫'(공개, 벤더 통보)은 빈 글리프로 보여 준다.
- **Charlotte 판정 카드.** Recommendation · Priority · Verdict 세 칸 띠를 두고, 아래 설명에서 실제 증거(명령줄, 경로)를 코드로 인용한다. "이 판단이 유용했나요?"로 끝난다. 다만 'Escalation priority 246'은 척도가 없어 오히려 신뢰를 깎는다.
  - 출처: [CDR 블로그](https://www.crowdstrike.com/en-us/blog/using-agentic-ai-to-power-cdr/), [Charlotte](https://www.crowdstrike.com/en-us/platform/charlotte-ai/).
- **질문 트리(Agentic response).** 노드 테두리가 상태(대기, 답하는 중, 답함, 확인 불가)를 말한다. 측면 패널은 질문 → 답 → 왜 이 질문인가 → 작업 사슬 순서다.
  - KKACHI: 가설 탭의 원형으로 삼는다. 빈 답을 '안전'으로 보이게 하지 말고 "확인 불가 · 사유"로 쓴다.
  - 출처: [Agentic workforce 블로그](https://www.crowdstrike.com/en-us/blog/crowdstrike-delivers-seven-agents-to-build-agentic-security-workforce/).
- **필요할 때 펼치는 출처와 자율 범위.** 답변마다 '4 agents · 8 tools · 34s ▾' 한 줄이 있고, 펼치면 정확한 요청과 응답 JSON이 나온다. "dry run, 변경 없음", Auto-approve 켬/끔 토글, 사람이 'Add to notes'를 눌러야만 AI 요약이 케이스에 들어간다.
  - KKACHI: 주장마다 '도구 6 · VM 3 · 41초 ▾'를 단다. 헤더에는 '자율 범위' 띠를 둔다.
  - 출처: [AWS APN 블로그](https://aws.amazon.com/blogs/apn/crowdstrike-charlotte-ai-generative-ai-on-aws/), [Charlotte](https://www.crowdstrike.com/en-us/platform/charlotte-ai/).
- **분모, 체크리스트, 신선도.** '26% (180/702)', '2/5 factors met', 요구 조건 | 결과(모노 증거) | 충족 체크리스트, 'Last refreshed 08:38:18' 같은 표기다.
- **흐름 깔때기 개요.** 탐지 → 자동 처리 7,568 / 조사로 올림 210 → 입력 대기 · 검토 대기 · 케이스 · 진행 중으로 흐른다. 사람이 필요한 상태는 글리프로 두드러지게 한다.
- **선과 면의 절제(Glide Core 다크 토큰).**
  - 흰색 알파 선을 세 단계(약 5%/15%/25%)로, 선 굵기를 1/2/4px로 둔다.
  - 표면은 3–5% 단계로 나누고, 상호작용 색은 하나(파랑)뿐이다.
  - 제목은 데이터보다 어둡다.
  - 브랜드 격자무늬는 상세 페이지의 빈 여백에만 둔다.
  - 출처: [color-dark.css](https://github.com/CrowdStrike/glide-core/blob/main/src/styles/variables/color-dark.css).
- **따라 하지 말 것**
  - 모든 칸마다 라벨을 다시 쓰는 목록.
  - 범례 없는 색 띠.
  - 빨강을 심각도, 공격 경로, 브랜드에 함께 쓰는 것.
  - 단어 가운데를 자른 노드 라벨('Suspicio…ctivity').
  - 문단 벽 같은 AI 요약.
  - 척도 없는 숫자.
  - 호버해야만 보이는 핵심 사실.
  - 마케팅 이미지의 글로우와 네온 Sankey. 사용자가 말한 '예쁘기만 한' 모습이 바로 이것이다. 반대로 콘솔 자체는 평평하고, 가는 선으로 짜여 있고, 증거가 앞에 온다.

### 2.3 Palo Alto: Unit 42 · Cortex XSIAM/XDR · Prisma Cloud

- **이유가 달린 감소 흐름.** XSIAM Command Center는 데이터 소스 → 이슈 2,437 → 케이스 94 → 자동 78 / 수동 16 → 해결 84 · 열림 10으로 흐른다. Exposure Prioritization은 걸러낸 묶음마다 이유와 개수를 단다('Not Internet Exposed', 'No Known Public Exploits'). 숫자는 모두 걸러진 목록으로 연결된다.
  - 출처: [Command Center](https://cortex-docs.paloaltonetworks.com/cortex-xsiam/detect-investigate-and-respond-to-threats/monitor-dashboards-and-reports/dashboard-reference/command-center-reference/xsiam-command-center.md), [Exposure](https://cortex-docs.paloaltonetworks.com/cortex-xsiam/detect-investigate-and-respond-to-threats/exposure-management/exposure-management-command-center.md).
- **원인은 늘 왼쪽(Causality View).**
  - 근본 원인(CGO)은 늘 맨 왼쪽에 두고 반전 글자 칩 'CGO'를 단다.
  - 경고는 세모로, 해당 노드 위에 짧은 줄기로 '올려' 단다.
  - 잘린 데이터는 'Showing Partial Causality'로 알린다.
  - KKACHI: 진입은 왼쪽에 '진입' 칩, 싱크는 오른쪽에 '싱크' 칩을 단다. 가설 H1–H4는 그 가설이 생긴 함수 위에 줄기로 단다. 경로를 다 그리지 못할 때는 "일부 경로만 표시 · +9"로 알린다.
  - 출처: [Causality view](https://cortex-docs.paloaltonetworks.com/cortex-xsiam/detect-investigate-and-respond-to-threats/investigation-and-response/investigate-issues/causality-view.md).
- **모양 가족 + 안쪽 글리프 + 개수 배지 + 어깨 위성.** 경고는 모두 세모이고, 안쪽 글자가 출처를 말한다(A, B, i, !). 여러 개가 쌓이면 개수 원을 단다. 노드 어깨의 작은 원으로 수식어를 붙인다(펜 = 마지막 행위자, 주사기 = 주입).
  - 출처: [아이콘 키](https://cortex-docs.paloaltonetworks.com/cortex-xsiam/detect-investigate-and-respond-to-threats/investigation-and-response/investigate-issues/causality-view/causality-icons-key).
- **선의 결이 확실성을 말한다.** 완료한 조치는 실선 원, 대기 중인 조치는 점선 윤곽이다. 직접 관계는 실선, '연결됨·유사·병합'은 끊긴 선에 라벨을 단다.
  - 출처: [Grouping graph](https://cortex-docs.paloaltonetworks.com/cortex-xsiam/detect-investigate-and-respond-to-threats/investigation-and-response/analyze-and-resolve-cases/analyze-case-details/grouping-graph.md).
- **공격 경로를 문장으로 쓰고, 간선에 동사를 단다.**
  - 이슈 제목 자체가 인과 문장이다.
  - 간선에는 'Has Permissions On', 'Can Impersonate' 같은 동사를 단다.
  - 조건은 번호를 매기고 모두 충족해야 한다.
  - 수정은 "사슬을 끊는다"로 설명한다.
  - KKACHI: 제목을 "헤더의 width가 copy_rows()의 memcpy까지 닿아 행 버퍼를 넘깁니다"로 쓴다. 관문 조건을 ①–④로 번호 매긴다. 수정 제안에서는 끊을 간선에 표시를 단다.
  - 출처: [Evidence](https://cortex-docs.paloaltonetworks.com/cortex-xsiam/detect-investigate-and-respond-to-threats/investigation-and-response/analyze-and-resolve-cases/analyze-case-details/evidence.md), [Prisma](https://docs.prismacloud.io/content-collections/governance/attack-path-policies).
- **점 개수로 그리는 심각도(Prisma).** Critical = ●●●●, High = ●●●○처럼 그린다. 회색조에서도 순서가 유지된다.
- **증거를 일급 객체로, 스냅숏으로 남긴다.** 어떤 타임라인 기록이든 '증거로 표시'할 수 있고, 표시하면 누가, 언제 했는지가 남는다. 해결할 때 마지막 스냅숏을 감사용으로 보존한다.
  - 출처: [Evidence](https://cortex-docs.paloaltonetworks.com/cortex-xsiam/detect-investigate-and-respond-to-threats/investigation-and-response/analyze-and-resolve-cases/analyze-case-details/evidence.md), [Case timeline](https://cortex-docs.paloaltonetworks.com/cortex-xsiam/detect-investigate-and-respond-to-threats/investigation-and-response/analyze-and-resolve-cases/analyze-case-details/case-timeline.md).
- **한 줄 정체 띠.** 호스트 | 연결 상태 점 | IP | 프로세스 | PID | ID를 한 줄에 두고, 칸마다 복사 버튼을 단다.
- **레인으로 나눈 타임라인.** 점 하나가 사건 하나라서, 점의 밀도가 곧 양이다. 같은 행위자의 연속 기록은 Journal 모드에서 한 덩어리로 접는다. 해결된 항목은 지우지 않고 흐리게 한다.
  - 출처: [Timeline](https://cortex-docs.paloaltonetworks.com/cortex-xsiam/detect-investigate-and-respond-to-threats/investigation-and-response/investigate-issues/causality-view/timeline.md).
- **"다음에 무엇을 할까"(Resolution Center, Work Plan).** 대기 · 권장 · 진행 · 완료 탭으로 나눈다. 작업 유형은 아이콘과 타일로 구분한다(번개 = 자동, 마름모 = 조건, 사람 = 수동 입력). 실패한 작업은 아래 단계를 막고, 이유를 평문으로 쓴다.
  - 출처: [Resolution Center](https://cortex-docs.paloaltonetworks.com/cortex-xsiam/detect-investigate-and-respond-to-threats/investigation-and-response/analyze-and-resolve-cases/resolve-the-case/resolution-center.md), [Work Plan](https://cortex-docs.paloaltonetworks.com/cortex-xsiam/detect-investigate-and-respond-to-threats/investigation-and-response/investigate-issues/use-the-work-plan-in-an-investigation.md).
- **점수를 열어 보게 하고, 데이터가 없으면 점수를 주지 않는다.** SmartScore는 데이터가 부족하면 점수를 매기지 않는다. 점수를 누르면 구성 요소가 나온다. VirusTotal 점수는 34/52처럼 분수로 쓴다.
  - 출처: [Case scoring](https://cortex-docs.paloaltonetworks.com/cortex-xsiam/detect-investigate-and-respond-to-threats/investigation-and-response/case-concepts/case-scoring.md).
- **범위와 출처를 정직하게.** AI가 만든 케이스 요약은 저장된 시스템 제목과 분리한다. Command Center는 'Limitations' 절에서 한계를 밝힌다.
  - 출처: [AI 요약](https://cortex-docs.paloaltonetworks.com/cortex-xsiam/detect-investigate-and-respond-to-threats/investigation-and-response/analyze-and-resolve-cases/establish-case-context/ai-generated-case-summaries.md).
- **Unit 42 보고 문법.** 판정과 범위를 먼저 말한다(Executive Summary). 확신 표현을 일정하게 쓰고('consistent with', 'We believe'), 인공물은 모노로 적는다. 끝에 날짜와 시각이 붙은 갱신 기록을 둔다.
  - 출처: [NetScaler brief](https://unit42.paloaltonetworks.com/netscaler-zero-days-exploited/).
- **Unit 42 NOVA: KKACHI와 가장 가까운 공개 사례.** 그림 6은 단계 카드 넷(Scoping → Discovery → PoC & Verification → Gatekeeper)으로 되어 있다. 카드마다 파선 'Output' 상자가 있고, 다음 파도로 돌아가는 파선 화살표가 있다. 아래에는 늘 켜진 안전 띠(VM 격리, 외부망 통제, 시간 제한, 비밀 관리, 감사 기록)가 있다. 본문 첫머리는 물량(3,915 프로젝트, 확인 14,090건)이다.
  - KKACHI: 단계별 산출물 칩과 안전 띠는 가져온다. 물량 대신 발견 하나의 입증 사슬과 기록된 기각으로 차별화한다.
  - 출처: [Unit 42](https://unit42.paloaltonetworks.com/frontier-ai-vulnerability-burst/).
- **따라 하지 말 것**
  - Command Center의 레이더, 입자, 글로우(벽에 거는 그림이지 읽는 화면이 아니다).
  - 약 80개 아이콘에 검색 표까지 필요한 아이콘 키.
  - 색만으로 한 구분.
  - 데이터 노드로 쓰인 벤더 로고 벽.
  - 정보 없는 스톡 이미지(Unit 42 홈의 빛나는 도시와 회로).
  - 잘린 노드 라벨, 호버해야 보이는 정보.
  - 겹쳐 쌓인 점수들.
  - 열 때마다 새로 생성되는 AI 제목.
  - 물량을 증거로 내세우기.

### 2.4 같은 분야의 다른 제품과 연구 (Wiz, Snyk, GitHub, Semgrep, Google SecOps, PAIR, HAX)

- **판정을 먼저 쓰는 객체 머리.** Wiz Issue 제목은 규칙 ID가 아니라 위험 문장이다. 심각도(글자 원), 상태(파선 원 'Open'), 나이가 한 줄에 붙고, 관리용 정보는 오른쪽 레일로 뺀다. GitHub 경고도 같은 구조에 'First detected'를 더한다.
  - 출처: [Wiz Green Agent](https://www.wiz.io/blog/introducing-wiz-green-agent), [GitHub](https://docs.github.com/en/code-security/code-scanning/managing-code-scanning-alerts/about-code-scanning-alerts).
- **위험 요인 글리프 띠.** Wiz 'Risks' 줄은 순서가 고정된 작은 타일로 '독성 조합'을 보여 준다. Snyk는 심각도 · REACHABLE · PROOF OF CONCEPT를 각각 다른 배지로 나눈다.
  - 출처: [Wiz on GCP](https://docs.cloud.google.com/architecture/partners/id-prioritize-security-risks-with-wiz), [Snyk](https://docs.snyk.io/scan-fix-and-prevent/scan-with-snyk/snyk-projects/issue-card-information).
- **개수로 그리는 순서형 막대.** Wiz는 심각도를 4칸 핍으로, 신뢰를 3칸 막대로 그린다. Carbon은 색, 모양, 기호 가운데 둘 이상을 쓰고 대비 3:1 이상을 요구한다.
  - 출처: [Wiz KEV](https://www.wiz.io/blog/detect-and-prioritize-cisa-known-exploited-vulnerabilities-kev-with-wiz), [Carbon](https://carbondesignsystem.com/patterns/status-indicator-pattern/).
- **선 문법과 채움 문법.** Google SecOps 그래프에서 화살표는 행동, 점선은 연관이다. 채운 도형은 내부, 윤곽만 있는 도형은 외부다. 선택하면 나머지가 흐려지고, 범례는 도움말에서 연다.
  - 출처: [SecOps](https://docs.cloud.google.com/chronicle/docs/soar/investigate/working-with-cases/explore-entities-and-alerts-investigation).
- **소스 → 싱크 경로와 번호 단계 쌍둥이.** Wiz는 공격 경로 끝 노드에 'Validated External Risk' 배지와 후광을 단다. GitHub 'Show paths'는 Step 1…N 카드에 Source와 Sink 알약을 붙인다.
  - KKACHI: 그래프 아래 '경로 1/1 · 6단계' 토글로 번호 목록을 연다. 이 목록은 접근성용 대안도 겸한다.
  - 출처: [Wiz API SPM](https://www.wiz.io/blog/introducing-wiz-api-spm), [GitHub](https://docs.github.com/en/code-security/code-scanning/managing-code-scanning-alerts/assessing-code-scanning-alerts-for-your-repository).
- **동사로 시작하는 조사 단계 → 결론 → 재현 명령.** Wiz Red Agent는 반증 단계도 따로 줄로 보여 준다('…to rule out universal access'). 마지막은 결론 카드와 'Reproduction Command' 블록이다. Google SecOps TIN은 Disposition, Confidence, 조사 타임라인, 다시 조사 버튼을 둔다.
  - 출처: [Wiz Red Agent](https://www.wiz.io/blog/introducing-the-wiz-red-agent), [SecOps TIN](https://docs.cloud.google.com/chronicle/docs/secops/triage-investigation-agent).
- **범주로 말하는 확신과 정직한 한계.** PAIR는 확신이 결정을 바꿀 때만 보여 주고, 숫자보다 범주를 쓰라고 한다. HAX G1·G2·G10은 할 수 있는 일, 얼마나 잘하는지, 애매하면 범위를 좁히는 것을 요구한다.
  - 출처: [PAIR](https://pair.withgoogle.com/chapter/explainability-trust/), [HAX 논문](https://www.microsoft.com/en-us/research/wp-content/uploads/2019/01/Guidelines-for-Human-AI-Interaction-camera-ready.pdf).
- **행마다 출처 표시.** Wiz는 에이전트가 만든 행에 작은 글리프를 달고, 'AI Generated equals True'로 걸러낼 수 있게 한다.
  - KKACHI: 거의 모든 기록이 에이전트 산출물이므로, 다른 것(사람이 정한 칸)만 표시한다(§5).
- **사람 관문과 결과 안내.** GitHub Autofix는 PR 초안만 만들고 직접 병합하지 않는다. SecOps는 격리 조치를 '승인 대기'로 보여 준다.
  - 출처: [Autofix](https://docs.github.com/en/code-security/code-scanning/managing-code-scanning-alerts/responsible-use-autofix-code-scanning), [SecOps respond](https://docs.cloud.google.com/chronicle/docs/secops/respond-cases).
- **에이전트 상태는 늘 보이고, 다시 재생할 수 있다.** 에이전트가 무엇을 하는지는 언제나 분명히 보여야 한다(Microsoft). SecOps 그래프는 사건 재생과 시간 범위 슬라이더를 둔다.
- **방법과 한계를 따로 밝힌 실적 공개.** Semgrep은 사람 동의율 96%를 공개하되 출처와 단서를 함께 적는다. 자기 시스템이 보수적이라고, 즉 어느 쪽으로 틀릴지도 밝힌다.
  - KKACHI: 실제 수치가 생기기 전에는 수치 없이 방법과 편향만 쓴다.
  - 출처: [Semgrep metrics](https://docs.semgrep.dev/semgrep-assistant/metrics).
- **지각 연구.**
  - 탐지는 한 가지 특징의 차이일 때 즉시 일어나고, 두 특징의 조합이면 하나씩 훑어야 한다(Healey).
  - 수량은 길이와 위치로 그린다. 파이와 게이지는 피한다([NN/g](https://www.nngroup.com/articles/dashboards-preattentive/)).
  - 대시보드 함정은 맥락 부족, 과도한 정밀, 쓸모없는 장식이다([Few](https://www.perceptualedge.com/articles/Whitepapers/Common_Pitfalls.pdf)).
  - 차이는 분명한 한에서 가장 작게 둔다(Tufte, smallest effective difference).

### 2.5 상징 체계와 공예에서 가져올 규칙

- **MIL-STD-2525D.** 틀은 정체를, 틀의 선은 확실성을 말한다(실선 = 현재·확인, 파선 = 계획·의심). 결과는 기호 위에 덧그린다(사선 = 무력화, X = 파괴). 순서형 값은 고정된 자리에 표시를 세어 그린다(•, ••, •••, I, II). 틀은 회전하지 않는다(§5.3.12). [PDF](http://www.mapsymbs.com/MilStd2525D.pdf)
- **TCAS II.** 모양과 채움이 함께 단계를 올린다(빈 마름모 → 찬 마름모 → 원 → 네모). 중요한 것은 늘 보여야 한다는 규칙이 있다. [FAA](https://www.faa.gov/documentlibrary/media/advisory_circular/tcas%20ii%20v7.1%20intro%20booklet.pdf)
- **ISA-101, Airbus light-out, FAA AC 25-11B.** 정상 상태는 회색으로 둔다. 코딩 색은 6개 이하로 두고, 한 색의 명암으로 다른 뜻을 만들지 않는다. 같은 기호를 다른 목적에 쓰지 않는다(5.6.2). [AC 25-11B](https://www.faa.gov/documentlibrary/media/advisory_circular/ac_25-11b.pdf)
- **Primer, Linear, Material Symbols.** 점선 원 = 백로그, 빈 원 = 할 일, 1/4·1/2·3/4 채움 = 진행, 꽉 참 = 완료. Primer의 Merged는 보라, 'not planned'는 사선이다. 개발자는 '보라 = 완료'와 '사선 = 하지 않음'에 이미 익숙하다. [Linear](https://linear.app/docs/configuring-workflows), [Primer](https://primer.style/product/components/state-label/)
- **Holten & van Wijk.** 가늘어지는 간선이 화살표보다 방향을 잘 전한다. 화살촉은 노드 근처를 어지럽힌다. [ACM](https://dl.acm.org/doi/10.1145/1518701.1519054)
- **AIGA/DOT, NN/g, Wiedenbeck 1999.** 기호는 의미, 일관성, 판독성으로 검사한다. 아이콘과 라벨을 함께 쓸 때 가장 빨리 배우고, 아이콘만 쓸 때 가장 느리다. [DOT](https://en.wikipedia.org/wiki/DOT_pictograms), [NN/g](https://www.nngroup.com/articles/icon-usability/)
- **공예.**
  - 끊음질의 상사는 일정한 폭으로 자른 자개 띠이고, 송곳상사는 한쪽 끝이 뾰족한 띠다([한국민족문화대백과 끊음질](https://encykorea.aks.ac.kr/Article/E0011287)).
  - 고려 나전 경함에서 줄기는 외줄 금속선으로, 구역 경계는 꼬아 만든 두 줄 금속선으로 박았다([국립중앙박물관](https://www.museum.go.kr/MUSEUM/contents/M0501000000.do?schM=view&relicRecommendId=140602)).
  - 모로단청은 끝에만 머리초를 두고 가운데를 비운다([단청](https://encykorea.aks.ac.kr/Article/E0013680)).
  - 시분 선은 먹기화 선 폭의 약 ⅔다(2024 국가유산수리 표준시방서 §8.4, `kkachi/drafts/dancheong/brief.md`).
  - 이 넷은 장식이 아니라 선의 역할 규칙이 된다(§6).

---

## 3. 신뢰를 만드는 요소: 검증된 취약점을 보고하는 AI 에이전트의 경우

KKACHI는 결과가 적고, 결과마다 증거가 있다. 그래서 신뢰는 "많이 보여 주기"가 아니라 "하나를 끝까지 보여 주기"에서 나온다. 요소마다 원칙, 화면에서의 모습, 근거를 적었다.

### 3.1 출처 (provenance): 누가, 무엇으로, 어디서 만들었나
- **원칙.** 모든 기록에 작성 주체(에이전트 또는 사람), 도구, 실행 환경, 대상 버전이 붙어 있어야 한다. AI가 쓴 문장은 기록된 사실과 눈에 띄게 구분한다.
- **모습**
  - 발견과 세션 페이지 맨 위에 **정체 띠**를 둔다. 한 줄에 `F-01 | 세션 7F2A | 대상 sample-imgcodec 2.4 (가상) | 빌드 sha | 에이전트 버전 | 처음 확인 10월 2일 14:03 KST`를 쓴다.
  - 해시와 ID는 Fragment Mono로 쓰고, 끝을 줄이고, 복사 버튼을 단다. 샘플에서 sha와 버전 값은 "샘플" 자리표시로 둔다.
  - 주장마다 접힌 출처 한 줄 '도구 6 · VM 3 · 41초 ▾'를 둔다. 펼치면 세로 척추에 단계별 명령, VM 이미지 해시, 로그 발췌가 나온다.
  - 작성 주체 표시는 예외에만 단다. 기본은 에이전트이므로 따로 표시하지 않고, 사람이 정한 칸(심각도, 검토 결과)에만 사람 글리프를 붙인다.
  - 생성 요약은 '생성 요약 · 생성 시각' 꼬리표를 달고, 가는 선 상자에 넣는다. 자개는 쓰지 않는다.
- **근거**: Cortex 정체 띠와 AI 요약 분리([문서](https://cortex-docs.paloaltonetworks.com/cortex-xsiam/detect-investigate-and-respond-to-threats/investigation-and-response/analyze-and-resolve-cases/establish-case-context/ai-generated-case-summaries.md)), Charlotte 'Show response details', Wiz 행 단위 출처 글리프, Microsoft 에이전트 원칙(지식·도구·연결의 투명성).

### 3.2 증거: 주장마다 확인 수단 하나
- **원칙.** 카드의 산문은 2줄을 넘기지 않는다. 대신 주장마다 '확인' 링크를 단다. 산문은 설득하는 말투("~로 보입니다")가 아니라 확인할 수 있는 말투("207행에서 32비트 곱셈이 넘칩니다")로 쓴다.
- **모습**
  - F-01 카드의 근거 3–5줄은 각각 글리프, 주장, 사실, 확인 링크로 되어 있다. 링크 대상은 다음과 같다.
    - 207행 → 코드 보기.
    - 212행 → memcpy 줄.
    - 3/3 → 실행 기록 세 개.
    - 트리거 → 입력 바이트.
  - 증거는 유형별 카드로 묶는다: 호출 경로, 재현 실행 ×3, 크래시 출력, 패치 후 재실행, 기각된 대안. 카드마다 '스냅숏 · 시각 · 해시'를 단다.
  - 크래시 입력에는 '원문 / 해석' 스위치를 둔다.
- **근거**: Bits 'Key evidence', Cortex의 '증거로 표시'와 스냅숏, Charlotte 설명의 증거 인용, GitHub Autofix의 diff와 설명, Fok & Weld 2023, Bansal 2021, HAX G11 경고([HAX](https://www.microsoft.com/en-us/haxtoolkit/guideline/make-clear-why-the-system-did-what-it-did/)).

### 3.3 확신 (confidence): 확률 대신 셀 수 있는 것
- **원칙.** 확인된 발견에 확신도 %를 붙이지 않는다. 확신은 셀 수 있는 증거로 보여 준다.
  - 재현 3/3.
  - 관문 5/5.
  - 근거 4/4.
  - 가설에는 확률 없이 상태만 보여 준다(후보, 검증 중, 기각, 보류).
  - 관문에 닿지 않았으면 숫자 대신 '판정 없음'이라고 쓴다.
- **모습**
  - 판 안의 재현 조각 세 개로 확신을 그린다(§5).
  - 근거 체크리스트는 요구 조건 | 결과(모노 증거) | 충족 / 검증 안 함으로 쓴다. 완화 우회처럼 확인하지 않은 항목은 "검증 안 함"으로 분명히 쓴다.
  - 추정값('영향: 추정')은 파선 밑줄로 사실과 구분한다.
- **근거**: PAIR(범주형 확신, 결정을 바꿀 때만), Aether 검토(50% 정확도 표기도 신뢰를 올림, [PDF](https://www.microsoft.com/en-us/research/wp-content/uploads/2022/06/Aether-Overreliance-on-AI-Review-Final-6.21.22.pdf)), Cortex SmartScore가 데이터 부족 시 점수를 주지 않는 방식, CrowdStrike Exposure의 '2/5 factors met'.

### 3.4 재현성: 누구나 다시 돌릴 수 있게
- **원칙.** '재현 3/3'은 KKACHI의 핵심 약속이다. 그러니 그 세 번의 실행이 각각 열어 볼 수 있는 객체여야 한다.
- **모습**
  - '재현' 탭에 실행 카드 3장을 둔다. 카드마다 다음을 적는다.
    - 실행 번호.
    - 새 VM 이미지 id(샘플 자리표시).
    - 시작 시각.
    - 걸린 시간(0.41/0.39/0.40초).
    - 신호(ASan heap-buffer-overflow rows.c:212).
    - x86_64 · 고정 시드.
    - 로그 링크.
  - 그 아래에 복사할 수 있는 재현 명령 블록을 둔다.
  - '패치 후 재실행 0/3' 칸은 수정 제안의 증거로 쓴다.
  - 실패한 실행은 지우지 않는다. 끊긴 조각과 평문 이유로 남긴다(예: '재현 2/3 · 3번째 VM에서 크래시 없음').
- **근거**: Wiz Red Agent의 'Reproduction Command', Unit 42 NOVA의 단계 산출물, Cortex Work Plan의 평문 실패 이유.

### 3.5 사람 검토: 자율이 멈추는 곳을 화면 구조로
- **원칙.** "혼자 공개하지 않는다"는 약속은 문장이 아니라 UI로 보여야 한다. 에이전트가 확인한 것과 사람이 승인한 것은 다른 상태이고, 다른 단어와 다른 표지를 쓴다.
- **모습**
  - 상태 단어를 '재현 확인'(에이전트, 3/3)과 '승인'(사람)으로 나눈다. 지금은 '◆ 확인'과 '사람 검토 대기'가 한 카드에 함께 있어 혼동된다.
  - 발견 상세의 **사람 검토 상자**는 증거와 겹선으로 나눈다. 버튼마다 한 줄로 결과를 미리 쓴다.
    - [승인 → 보고서 초안을 담당자에게 넘김 · 외부 공개 아님]
    - [수정 요청]
    - [기각 · 사유 필수]
    - [심각도 정하기]
  - 검토자와 시각은 카드 머리에 둔다. 지금처럼 세 번째 탭에 숨기지 않는다.
  - 헤더에 **자율 범위** 띠를 고정한다: 읽기 ✓ · 격리 실행 ✓ · 외부 전송 안 함 · 공개는 사람.
  - 두 줄을 둔다: '에이전트가 한 일'(채운 글리프)과 '하지 않은 일 · 사람 몫'(빈 고리).
  - 샘플에서는 버튼을 비활성으로 두고 툴팁으로 이유를 알린다.
- **근거**: Datadog Next Steps 상자, Cortex Resolution Center, GitHub Autofix의 초안 PR, Charlotte의 'dry run'과 Auto-approve 토글, HAX G16(행동의 결과를 알린다), Microsoft 에이전트 원칙(켜고 끄는 것은 사람).

### 3.6 감사 기록: 지우지 않고 덧쓴다
- **원칙.** 모든 결정(에이전트의 기각, 사람의 승인·기각·심각도 변경)을 시각, 주체, 사유와 함께 덧쓰기로 남긴다. 기각한 것도 다시 열 수 있다.
- **모습**
  - 세션 기록은 세로선 하나에 유형 글리프를 단 사건 사슬로 그린다.
  - 사건 유형별 필터에 개수를 단다. 오래된 순 / 최신 순 토글을 둔다.
  - 보고서 끝에는 '갱신 기록'(날짜 · 무엇을 바꿨나)을 둔다.
  - 기각한 가설에는 사유, 증거, 시각을 단다(H2 · read_palette()의 경계 검사 · 01:37). '다시 열기'를 둔다.
- **근거**: Cortex 증거 표시와 스냅숏, GitHub 해제 사유('감사 시 근거로 쓰임'), Semgrep 메모리 편집, Unit 42 갱신 기록, Datadog Incident Timeline.

### 3.7 시간: 한 가지 모델
- **원칙.** 대시보드 오독은 대부분 시간 오독이다(오래된 데이터, 시간대, 패널마다 다른 창). 실시간인지 재생인지, 어느 시간대인지, 언제 갱신했는지를 늘 보여 준다.
- **모습**
  - 상단 시간 제어는 '실시간'과 '기록'(재생) 두 상태이고 KST를 표시한다.
  - 시각은 늘 절대 시각과 상대 시각을 함께 쓴다('10월 2일 14:03 KST · 4분 전'). 날짜가 바뀔 때만 날짜를 다시 쓴다.
  - 재생 중에는 가는 띠 배너('01:40 시점 재생 중 · 지금으로')를 띄운다.
  - 재생 중에는 머리 상태도 커서를 따라간다(01:40이면 '추적 중'). 커서 뒤의 기록은 흐리게 한다.
  - 전역 창과 다른 패널에는 기간 칩을 단다.
  - 목록 위에 '목록 최신 · 14:31 KST' 신선도 도장을 둔다.
- **근거**: Datadog 시간 모델([문서](https://docs.datadoghq.com/dashboards/guide/custom_time_frames/)), CrowdStrike 'List is up to date', Cortex 타임라인 슬라이더, 감사에서 본 현재 재생 상태 불일치(`.scratch/research/kkachi-audit/s-dash7f2a-1440-scrub100.png`).

---

## 4. 사용감 요소

- **개요 → 초점 → 상세를 한 화면에서.**
  - 첫 화면은 운영자가 늘 묻는 세 질문에 글리프와 숫자 하나씩으로 답한다: 지금 돌고 있나, 확인된 것이 있나, 내가 할 일은 무엇인가.
  - 상세는 새 페이지가 아니라 오른쪽 서랍으로 연다. 서랍을 연 채 ↑/↓로 목록을 넘긴다.
  - 근거: Few의 'big picture → focus → drill', NN/g 복잡한 앱의 단계적 공개([NN/g](https://www.nngroup.com/articles/complex-application-design/)), DRUIDS SidePanel.
- **필터.**
  - 탭과 패싯에는 0까지 포함한 개수를 단다(전체 8 · 진행 중 3 · 재현 확인 1 · 보류 1 · 기각 2 · 심각 0).
  - 결과 줄은 '발견 1개 · 가설 4개 중'처럼 전체 대비로 쓴다.
  - 요약 타일은 누르면 필터가 된다.
  - 범례는 필터를 겸한다(글리프 · 이름 · 개수 · 보이기).
  - 필터 결과가 비면 어느 필터를 빼면 될지 알려 준다.
  - 근거: Datadog 패싯, Security Inbox, CrowdStrike 범례, DRUIDS EmptyState.
- **시간.** §3.7의 한 가지 모델을 따른다. 재생 스크러버는 그래프, 가설, 관문, 기록 패널을 함께 움직인다(지금 있는 좋은 점이다).
- **밀도.**
  - 1280px 이상에서는 촘촘하게 보여 준다.
  - 글자 크기는 UI 12/13/14/16px, 굵기는 400/600만 쓴다. 숫자는 tabular-nums로 쓴다.
  - 위계는 크기보다 위치, 굵기, 선으로 만든다. 그래서 심볼이 뜻을 나를 자리가 생긴다.
  - 표에서는 헤더가 이름을 말해 주면 같은 글리프가 반복되는 열을 글자 없이 둘 수 있다. 이때도 aria-label은 단다.
  - 근거: DRUIDS 타이포그래피([문서](https://druids.datadoghq.com/foundations/typography)), Datadog CSM 위험 열.
- **키보드.**
  - `/` 검색, ↑/↓ 행 이동(패널을 연 채 넘기기), Enter 열기, Esc 닫기.
  - ←/→ 재생 사건 앞뒤, Space 재생/멈춤, `?` 단축키 목록.
  - 그래프마다 표 쌍둥이(번호 단계 목록)를 두어, 그래프를 보지 못하는 사람도 같은 정보를 얻게 한다.
  - 근거: DRUIDS SidePanel ↑/↓, SecOps 재생 제어, GitHub Show paths, v3 §7 '키보드로 완전히 조작'.
- **상태.**
  - 로딩은 두 단계만 둔다. 실제 모양과 같은 스켈레톤을 쓰고, 스피너는 줄줄이 두지 않는다.
  - 진행 중인 세션은 스피너 대신 관문 진척으로 보여 준다(몇 번째 조각을 채우는 중인지).
  - 빈 상태는 낙관적으로 보여 준다(§9.4).
  - 오류는 패널 단위로 보여 주고 다시 시도 버튼을 단다.
  - 행 버튼(열기, 보고서)은 호버나 포커스 전까지 조용히 둔다.
  - 없는 값은 '기록 없음'으로 쓰고, 관문에 닿지 않았으면 '판정 없음'으로 쓴다.
  - 근거: DRUIDS Loading, Error, Quiet States.
- **움직임.**
  - 앱 안의 전환은 150–250ms로만 한다(v3 §5). 원인과 결과를 가리는 연쇄 애니메이션은 쓰지 않는다(DRUIDS 'Speed').
  - 흐름 애니메이션은 호버나 포커스 때만 켠다. prefers-reduced-motion에서는 정지 상태로 바꾼다.

---

## 5. 심볼 시스템 제안

### 5.1 설계 원칙

1. **모양 = 종류, 채움 = 진행, 덧표시 = 결과, 옆 글자 = 정체.** 2525D의 틀·채움·덧표시·증폭자 구조를 KKACHI 크기로 줄였다.
2. **기본 모양은 12개 이하로 둔다.** 상태는 새 아이콘을 만들지 않고 조합으로 만든다. Carbon은 한 화면에 상태 표지 종류가 5–6개를 넘으면 과부하라고 한다.
3. **'확인'만 채움 + violet + 자개다.** 확인을 한 가지 특징만으로 찾게 해서, 훑지 않고 바로 눈에 띄게 한다(Healey).
4. **순서가 있는 값(심각도, 재현 횟수, 진척)은 개수와 길이로 그린다.** 모양과 색상은 순서를 말하지 못한다(Bertin, [Axis Maps](https://www.axismaps.com/guide/visual-variables); MacEachren 2012, [PubMed](https://pubmed.ncbi.nlm.nih.gov/26357158/)).
5. **글자는 늘 곁에 둔다.** 마케팅 페이지는 글리프마다 짧은 라벨을 보이게 둔다. 대시보드는 범례와 열 머리를 쓰고, 셀에서 글자를 뺄 때는 aria-label을 단다.
6. **브랜드 금지 규칙을 지킨다.**
   - ㄱ 모듈이나 L자 모서리로 글리프를 만들지 않는다.
   - ㄱ, +, 로고를 회전하거나 45° 기울이지 않는다. 그래서 ×(45° 돌린 +)도 쓰지 않는다.
   - 원 안에 마크를 넣은 배지를 만들지 않는다. 로고 path는 고치지 않는다.
   - 회전한 도형(◆ 마름모)도 쓰지 않는다.
   - 육각형(CrowdStrike 상징)과 보라 = AI(Datadog) 같은 남의 상징도 쓰지 않는다.

### 5.2 모양 가족 (윤곽 = 종류)

| 모양 | 뜻 | 16px 기본형 (viewBox 0 0 16 16) | 왜 이 모양인가 |
|---|---|---|---|
| **작은 네모** | 코드 위치(함수, 진입, 싱크) | `<rect x="5.5" y="5.5" width="5" height="5"/>` | C′1의 각진 바깥 모서리와 어울린다. 진입과 싱크는 새 모양 없이 경로 양 끝의 위치와 '진입'·'싱크' 글자 칩으로 구분한다(Cortex CGO 칩) |
| **판(3:2 가로 직사각형)** | 주장: 가설에서 발견까지 같은 판이 생애를 거친다 | `<rect x="2.5" y="4.5" width="11" height="7"/>` | "발견은 살아남은 가설"이라는 이야기를 모양 하나로 말한다. 회전하지 않은 직사각형이라 금지 규칙과 충돌하지 않는다 |
| **조각(상사)** | 통과 하나: 재현 1회, 관문 1개, 입증된 경로 한 걸음 | 세움 `<rect x="7" y="3.5" width="2" height="9"/>`, 눕힘 `<rect x="1" y="6.5" width="7.5" height="3"/>` | 끊음질의 상사다. 독립 반복인 재현은 세우고, 순서가 있는 관문과 경로는 시간 방향으로 눕힌다 |
| **고리(원)** | 사람: 사람 차례 또는 사람의 결정 | `<circle cx="8" cy="8" r="4.75"/>` | 시스템에서 유일한 원이다. ISO 3864의 '해야 할 행동', IBM의 'action needs to be taken'과 같은 결이다. 안에 마크를 넣지 않는다 |
| **겹선** | 경계: 승인 범위, 기계 증거와 사람 결정 사이, 샘플 영역 | `<rect x="1.5" y="3.5" width="13" height="9"/><rect x="3.75" y="5.75" width="8.5" height="4.5"/>` | 고려 나전의 꼬아 만든 두 줄 선은 구역 경계를 표시했다. 겹선은 경계에만 쓰고, 장식으로는 쓰지 않는다 |
| **문서** | 보고서 | `<rect x="4" y="2.5" width="8" height="11"/><path d="M6 6h4M6 8.5h4M6 11h2"/>` | 세로로 세운 직사각형에 줄을 넣어 판과 다르게 보인다 |
| **세모** | 시스템 실패만(VM 연결 실패, 시간 초과, 빌드 실패) | `<path d="M8 2.5L14 13H2Z"/><path d="M8 6.5v3"/><rect x="7.35" y="10.6" width="1.3" height="1.3" fill/>` | 경고 세모는 누구나 '문제'로 읽는다. 기각은 실패가 아니라 성공한 제거이므로 세모를 쓰지 않는다 |

공통 속성은 `fill="none" stroke="currentColor" stroke-linecap="square" stroke-linejoin="miter"`다. 점선과 파선만 `butt`로 끝낸다(각진 끝을 쓰면 점이 길어진다).

### 5.3 주장 판의 생애 (가설 → 발견)

| 상태 | 판의 모습 | 16px 변형 | 함께 쓰는 글자 |
|---|---|---|---|
| 후보 | 점선 윤곽 | `stroke-dasharray="1.25 1.5"` | 후보 |
| 가설 · 검증 중 | 파선 윤곽 | `stroke-dasharray="3 1.75"` | 검증 중 · 경과 |
| 추적됨 | 실선 윤곽, 빈 판 | 실선 | 추적됨 |
| 재현 중 k/3 | 실선 + 안쪽 세움 조각 k개 채움, 나머지 32% | `<rect x="4.75|7.25|9.75" y="6.5" width="1.5" height="3"/>` | 재현 2/3 |
| **재현 확인** (에이전트) | violet 테두리 + 조각 3개가 자개 | 조각 `fill="url(#nacre)"`, 판 바탕 옻칠 | 재현 확인 3/3 |
| **승인** (사람) | violet 테두리 + 판 안 전체 자개(옻칠 테두리 1px은 남긴다) | `<rect x="3.75" y="5.75" width="8.5" height="4.5" fill="url(#nacre)"/>` | 승인 · 검토자 |
| 보류 | 오른쪽 변이 끊긴 '열린 판' | `<path d="M13.5 6.75V4.5H2.5v7h11V9.25"/>` | 보류 · 사유 |
| 기각 | 원래 판을 흐리게 하고 빗금 하나를 긋는다(지우지 않는다) | `<path d="M2.5 13.5L13.5 2.5"/>` | 기각 · 사유 |

- 같은 판이 점선 → 파선 → 실선 → 조각 → 자개 판으로 차오르므로, 글리프만 보아도 "가설이 살아남아 발견이 되었다"는 이야기가 읽힌다. 2525D의 '의심(파선) → 확인(실선)'과 같은 논리다.
- 지금 대시보드의 ◆(확인), ⊠(기각), 파선 □(보류)는 이 판 문법으로 바꾼다.
  - ◆는 회전한 도형이다. 2525D에서는 '적대', TCAS에서는 '다른 항공기'를 뜻한다.
  - ⊠의 X는 '파괴·실패'로 읽힌다.
  - 파선 □는 '심각도 검토 전'과 모양이 같다. 감사에서 확인한 충돌이다.
- 16px 렌더 확인 결과(`.scratch/research/synthesis/glyphs.png`): 후보, 가설, 추적, 재현 k/3, 재현 확인, 승인, 기각은 16px에서 구별된다. '열린 판'(보류)은 16px에서 약하므로 항상 글자와 함께 쓴다.

### 5.4 상태 × 개체 대응표

| 상태 | 주장 판 | 세션 줄(§5.7) | 재현 조각 | 선(경로·레인) | 사람 고리 |
|---|---|---|---|---|---|
| **대기** | 점선 판 | 다섯 칸이 모두 흐린 가는 선 | 흐린 윤곽 조각 | 점선 | 흐린 고리 |
| **실행 중** | 파선 판 + 경과 시간 | 현재 칸이 왼쪽부터 차오름(움직임 줄이기: 절반 채움으로 고정) | 차오르는 조각 | 선 머리가 그려지는 중 | |
| **확인** | violet 테두리 + 자개 조각 3 | 다섯 칸이 차고 끝에 빈 고리(사람 차례) | 자개 조각 3 | 끊음질 자개 조각선 | |
| **기각** | 흐린 판 + 빗금 | 멈춘 칸 다음에 수직 눈금 ⊣, 나머지는 흐린 선 | (해당 없음) | 틈 + 수직 눈금 ⊣ | 사람이 기각: 고리 + 빗금 |
| **보류** | 열린 판 | 멈춘 칸 다음에 점선 꼬리 | | 점선 꼬리로 흐려지며 끝남 | |
| **실패** | (판 대신) 세모 | 멈춘 칸 자리에 세모(실패 색) | 가운데가 끊긴 조각 | 끝에 세모 | |
| **사람 결정** | | 끝 고리 안에 점 | | | 고리 + 가운데 점 |

### 5.5 심각도

- **모양**: 지금처럼 높이가 오르는 막대 4개(사다리)를 유지한다. 채운 개수가 등급이다: 심각 4 · 높음 3 · 중간 2 · 낮음 1 · 정보 0. 채운 막대만 심각도 색(`--sev-*`)을 받고, 나머지는 선 색 20%로 둔다.
  - 16px 형: `<rect x="2|5.5|9|12.5" y="10.5|8|5.5|3" width="2" height="3|5.5|8|10.5"/>`.
  - 근거: Datadog DRUIDS ScoreBar, Prisma 점 미터, Wiz 4칸 핍. 개수는 순서를 말하지만 모양은 말하지 못한다(Bertin). CrowdStrike처럼 등급마다 모양을 바꾸는 방식은 쓰지 않는다.
- **'검토 전'**: 막대 4개를 모두 점선으로 그린다(`stroke-dasharray="1.25 1.5"`). '정보'(채운 막대 0개, 흐린 실선)와 모양이 다르다. 점선 = '아직 아무도 보지 않음'이라는 선 문법과도 맞는다.
- **사람이 정한 값**: 막대 옆에 작은 사람 글리프를 달고, 이력('검토 전 → 중간 · 검토자 · 사유')을 남긴다(Datadog 수동 조정).
- **소등 원칙**: 사람이 정하기 전에는 심각도 색을 쓰지 않는다. 색은 정해진 뒤에만 켠다.
- **자리 고정**: 심각도는 늘 판의 왼쪽 같은 자리에 둔다. 그래프 노드 안에는 넣지 않는다. 그래프는 단색으로 둔다. 색상이 바뀌면 모양 탐지를 방해하기 때문이다(Healey).

### 5.6 확신

- 확률은 그리지 않는다(§3.3).
- 확신은 세 가지로만 그린다.
  1. 판과 선의 결(점선 → 파선 → 실선 → 자개).
  2. 재현 조각 k/3.
  3. 분모가 있는 숫자(관문 5/5, 근거 4/4).
- 관문에 닿지 않았으면 빈 점선 조각에 '판정 없음'을 쓴다.

### 5.7 개체 글리프 목록 (기본 12개)

| # | 개체 | 기본 글리프 | 상태 변형 |
|---|---|---|---|
| 1 | **대상**(승인 범위) | 겹선 직사각형 | 승인 전: 바깥선을 파선으로 / 범위 밖: 흐린 겹선 |
| 2 | **세션** | **세션 줄**: 눕힌 조각 다섯(읽기 · 가설 · 추적 · 재현 · 보고) + 끝 고리(사람 검토). 표 안에서는 48×16px. 내비 아이콘은 조각 둘 + 고리를 16px로 | §5.4 대응표를 따른다 |
| 3 | **가설** | 파선 판 | 판의 생애(§5.3) |
| 4 | **경로·추적** | 네모 → 가늘어지는 선 → 네모 `<rect x="1.5" y="6" width="4" height="4" fill/><path d="M5.5 6.9L11 7.75v.5L5.5 9.1Z" fill/><rect x="11.5" y="6.5" width="3" height="3"/>` | 추정(파선), 추적(실선 가늘어짐), 확인(자개 조각선) |
| 5 | **발견** | 실선 판 + 조각 | 재현 확인 / 승인 |
| 6 | **재현** | 세움 조각 셋 `<rect x="3.5|7|10.5" y="3.5" width="2" height="9"/>` | 통과 = 흰 채움, 실패 = 가운데가 끊긴 조각 `<path d="M11.5 3.5v3.25M11.5 9.25v3.25"/>`, 3/3 = 셋 모두 자개 |
| 7 | **보고서** | 문서 | 초안 = 파선 윤곽 / 승인 = 실선 / 공개 준비 = 실선 + 끝 고리 |
| 8 | **사람 검토** | 고리 | 차례 = 빈 고리, 결정 = 고리 + 가운데 점, 기각 = 고리 + 빗금 |
| 9 | **사람(작성자)** | 머리 원 + 어깨 호 `<circle cx="8" cy="5.25" r="2.25"/><path d="M3.5 13.5C3.5 10.75 5.5 9.25 8 9.25S12.5 10.75 12.5 13.5"/>` | 사람이 정한 칸에만 단다 |
| 10 | **심각도** | 사다리(§5.5) | 등급 0–4, 검토 전 |
| 11 | **실패** | 세모 | (시스템 오류에만) |
| 12 | **시간 커서** | 뒤집힌 T(┴): 기준선을 가로지르는 세로 커서 | 실시간 = 커서가 오른쪽에 있고 뒤에 짧은 점선(아직 모름). 기록 = 커서가 가운데에 있고 뒤는 흐린 실선(기록됨). **커서가 기준선 끝에 붙으면 L/ㄱ 모서리가 되므로 금지한다** |

덧표시(어느 개체에나 붙는다):
- **빗금** = 기각.
- **열린 변** = 보류.
- **세모** = 실패.
- **사람 위성**(어깨의 작은 사람) = 사람이 정함.
- **오른쪽 숫자** = ID나 개수(tabular-nums). 개수를 원 배지에 넣지 않는다. 원은 사람 전용이다.
- **얇은 상자** = 마지막 방문 뒤 바뀜(선택 사항).

### 5.8 크기와 선 굵기

- 크기는 12/16/24px 세 단계이고, 선 굵기는 크기마다 다르다: 12px → 1px, 16px → 1.25px, 24px → 1.5px. 지금 `.kk-ic`는 모든 크기에 1.4를 쓴다.
- 어두운 옻칠 위에서는 밝은 선이 번져 굵어 보인다. 그래서 같은 크기에서 한 단계 가늘게 둔다(Material Symbols의 grade −25 논리, [문서](https://developers.google.com/fonts/docs/material_symbols)).
- 정수 픽셀에 맞춘다. 상태가 바뀌어도 크기는 바꾸지 않는다. 채움, 결, 덧표시만 바꿔서 행이 흔들리지 않게 한다.
- 대비: UI 표지는 두 테마 모두 3:1 이상이다. 글리프와 라벨은 표에서 왼쪽 정렬한다(Carbon).
- 강제 색 모드에서는 지금 토큰처럼 확인 = Highlight로 둔다.

### 5.9 등록부와 검사

- `/kkachi/system/`에 **심볼 등록부** 표를 둔다. 열은 글리프 · 하나의 뜻 · 조합법(틀, 채움, 선, 덧표시 자리) · 크기 · 금지 용도다.
  - Cortex 아이콘 키처럼 찾아볼 수 있게 하되, 개수는 12개 안팎으로 묶는다.
- 글리프마다 AIGA 세 질문(의미가 맞나, 체계와 일관되나, 12/16/24px 두 테마에서 보이나)으로 검사한다.
- 범례 한 줄(글리프 + 1–2단어)은 그래프, 미터, why 페이지에 모두 같은 모습으로 둔다. 마케팅과 제품이 한 어휘를 쓰게 하기 위해서다.
- notes 페이지의 '범례를 누르면 그림에서 그 부분을 짚어 준다'(legend-as-control) 상호작용을 표준으로 삼는다.

---

## 6. 선 시스템 제안

### 6.1 문법 다섯 줄
1. **선의 결 = 확실성.** 점선(아직 안 봄) < 파선(주장·추정) < 실선(관찰·추적) < 끊음질 자개 조각선(입증).
2. **선의 끝 = 결과.** 수직 눈금 ⊣ = 기각, 점선 꼬리 = 보류, 세모 = 실패, 판 = 확인, 고리 = 사람 차례. 모로단청처럼 표지는 끝에만 두고 가운데는 비운다.
3. **선의 굵기 = 확실성의 층.** 굵을수록 더 확실하다. 양이나 트래픽을 굵기로 그리지 않는다(Datadog Request Flow Map과의 차이).
4. **외줄 = 관계, 겹선 = 경계.** 관계없는 것을 잇는 장식 선은 긋지 않는다. 연결된 것은 묶여 보이기 때문이다(Palmer & Rock 1994, [논문](https://link.springer.com/article/10.3758/BF03200760)).
5. **방향은 가늘어짐으로 그린다.** 추적과 확인 경로는 받는 쪽으로 갈수록 가늘어진다(송곳상사, C′1의 바늘 끝과 같은 결). 그래프에 화살촉은 쓰지 않는다(Holten & van Wijk). 이 '가늘어지는 바늘 끝'이 KKACHI 선의 고유 표지다. DRUIDS가 고유 각도를 두는 것과 같은 역할이다.

### 6.2 굵기 사다리 (먹기화:시분 ≈ 3:2를 뒤집은 단계)

| 토큰(제안) | 값 | 색 | 쓰는 곳 |
|---|---|---|---|
| `--lw-0` | 1px | `--line`(10%) | 구분선. 가능하면 선 대신 공간을 쓴다 |
| `--lw-1` | 1px | `--line-2`(20%), 읽혀야 하면 3:1 이상 | 카드와 표 테두리, 축, 가지 않은 가지, 맥락 호출 지도, 가설 레인 바탕 |
| `--lw-2` | 1.5px | `--fg-2` | 추적된 경로, 타임라인과 기록 척추, 가설 선, 관문 장부 척추 |
| `--lw-3` | 2.25px → 끝으로 가늘어짐 | violet 테두리 + 자개 조각 | **확인 경로 하나만**(선택한 발견의 진입 → 싱크) |
| `--lw-state` | 2px | 상태색 | 패널 위 상태 선, 행 왼쪽 막대. **검토 대기(violet)와 실패만** 색을 받고, 나머지는 선을 두지 않는다(소등) |
| `--lw-focus` | 2px 실선 + 2px 간격 | `--focus`(셸 화이트/옻칠) | 키보드 포커스. violet은 쓰지 않는다. 도형 모양을 따라간다 |

결 토큰(제안):
- `--dash-cand: 1.25 1.5`(점선).
- `--dash-claim: 3 1.75`(파선).
- `--seg: 7 1`(끊음질 조각 길이와 틈).
- `--cut-gap: 2.5px`(기각 틈).
- `--double-gap: 2px`(겹선 간격).

화면 하나에는 굵기 3종, 결 3종까지만 쓴다(Carbon과 2525D §5.3.10의 '선 폭은 판별에 결정적').

### 6.3 쓰는 곳

- **호출 그래프**
  - 왼쪽(진입)에서 오른쪽(싱크)으로 그린다.
  - 맥락 호출은 `--lw-1`, 가설 경로는 파선, 추적한 경로는 `--lw-2` 가늘어지는 선이다. 입증된 경로는 `--lw-3` 자개 조각선이고, 선택한 발견 하나에만 쓴다.
  - 기각 지점에는 틈 + 수직 눈금을 둔다(H2는 read_palette(), H3는 inflate_block()). 보류(H4)는 점선 꼬리로 흐려진다.
  - 호출이 아닌 데이터 흐름(오염된 바이트가 버퍼를 건너가는 것)은 호로 그린다(CrowdStrike 주입 호).
  - 간선 라벨은 관계가 분명하지 않을 때만 짧은 동사로 단다(길이 전달, 할당, 복사). 라벨 뒤에는 바탕색을 깐다.
  - 노드는 실행으로 관찰했으면 채우고, 정적으로만 추론했으면 비운다(SecOps).
  - 선택하면 관련 없는 것은 30%로 흐려진다.
  - 손대지 않은 함수는 그리지 않고 개수로만 쓰거나('+N 미탐색 호출'), 2px 점으로 둔다(TCAS와 2525D의 필수 표시와 정리 규칙).
- **가설 레인 타임라인**
  - 가설마다 가로 레인 하나를 둔다. 레인 선의 결은 상태에 따라 점선 → 파선 → 실선으로 바뀐다.
  - 표지는 끝에만 둔다: 시작 점, 끝에 ⊣, 점선 꼬리, 판.
  - 지금 스크러버 선 하나에 표지 다섯 종(×, □, ○, |, ◆)이 모여 있는 문제를 이것이 대신한다.
  - 사건은 짧은 세로 눈금이고, 커서는 ┴다.
- **사건 밀도 띠**: 세션 표 위와 그래프 아래에 얇은 띠를 둔다. 사건 하나가 눈금 하나이고, 확인 순간만 violet 눈금이다(Datadog 히스토그램 띠, Cortex 점 밀도).
- **세션 기록과 관문 장부**
  - 둘 다 세로 척추(`--lw-2`) 하나로 그린다.
  - 세션 기록은 마디마다 유형 글리프를 단다. 관문 장부는 다섯 마디(읽기 → 가설 → 추적 → 재현 → 보고)에 글리프 · 통과/멈춤 · 산출물 칩을 단다(예: '호출 경로 6단계', '재현 3/3 · VM 3대').
  - 다 한 것은 채운 마디, 아직 안 한 것은 점선 마디다(DRUIDS NumberedSection).
- **표**
  - 행 구분은 `--lw-0`이나 공간으로 한다.
  - 상태 막대(`--lw-state`)는 주의가 필요한 행에만 둔다.
  - 세션 줄을 한 열로 둔다. 날짜 묶음은 가는 선 안에 날짜를 넣는다(CrowdStrike).
- **패널**
  - 위쪽 상태 선은 검토 대기 발견에만 violet으로 둔다(Datadog의 위쪽 선을 소등 원칙에 맞게 고친 것).
  - 사람 검토 상자와 증거 사이는 겹선으로 나눈다.
- **깔때기**
  - 가는 선의 흐름으로 그린다. 두꺼운 리본이나 글로우는 쓰지 않는다.
  - 빠지는 선은 그 단계에서 갈라져 흐려지고, 끝에 이유 글리프와 개수를 단다.
  - 살아남은 선만 끝에서 violet이 되고, 마지막 조각만 자개다.
- **구분선과 섹션**: 섹션 제목 뒤에 `--lw-0`을 끝까지 긋거나 공간만 둔다. 상자 안에 상자를 넣지 않는다. 그림자 대신 선과 표면 단계를 쓴다(v3 §5).
- **샘플 데이터 영역**: 겹선 경계에 '샘플 데이터' 글자를 단다. 파선은 쓰지 않는다. 파선은 '검증 전' 전용이다. 지금은 샘플 태그와 보류가 둘 다 파선이라 충돌한다.

### 6.4 공예에서 온 근거

- **상사**(일정 폭의 자개 띠): 조각 하나 = 통과 하나.
- **송곳상사**(끝이 뾰족한 띠): 방향을 가진 추적과 확인 경로.
- **외줄과 꼰 두 줄 금속선**(고려 나전): 관계는 외줄, 경계는 겹선.
- **모로단청**(끝에만 머리초): 표지는 선 끝에만 둔다.
- **먹기화:시분 ≈ 3:2**: 굵기 단계.

이 근거들을 `/kkachi/system/`의 선 항목 설명 문장으로 쓰면, 장식처럼 보이지 않고 이유가 있는 규칙으로 읽힌다.

---

## 7. 자개(najeon) 사용 규칙

1. **뜻은 하나다. 자개 = 입증된 것.** 데이터 화면에서 자개가 나오는 곳은 두 형태뿐이다.
   - **자개 조각**: 재현 3/3을 채운 발견의 조각 셋, 그리고 그 발견의 확인 경로 조각선.
   - **자개 판**: 사람이 승인한 발견의 판 안쪽.
   - 데이터가 아닌 곳에서는 브랜드 ㄲ 마크의 상감(기존 규칙)만 남긴다.
2. **2/3은 자개가 아니다.** 통과한 실행은 셸 화이트 조각이다. 셋째가 통과하는 '확인 순간'에 세 조각이 함께 자개로 바뀐다. 왼쪽부터 80ms 간격, 모두 합쳐 약 240ms이고, 움직임 줄이기에서는 즉시 바뀐다.
   - v3 §5의 "자개 셰이더는 '확인' 순간에만"을 구체화한 것이다.
3. **셰이더와 타일을 나눠 쓴다.**
   - WebGL 셰이더는 화면에 하나만 둔다. 선택한 발견 머리의 큰 판(32px 이상)과 확인 순간 전환에만 쓴다.
   - 목록과 표의 작은 글리프는 정지 타일(`najeon-512.webp`)을 패턴으로 채운다.
   - 16px에서 자개는 진주빛 면으로만 보인다(스케치 확인). 그래서 그 크기에서는 violet 테두리와 '재현 확인' 글자가 뜻을 함께 나른다.
4. **늘 옻칠 위에만.** 밝은 테마에서는 확인과 승인 글리프가 자기 옻칠 바탕(1px 이상 테두리가 보이게)을 지니고, 그 안에 자개를 박는다(스케치 확인). 밝은 면에 자개를 바로 깔지 않는다(홈 스펙 §13).
5. **화면당 예산.** 큰 자개(셰이더)는 1곳이다. 확인된 발견이 여러 개 보여도 확인 경로 자개선은 선택한 것 하나에만 둔다.
6. **violet과 자개는 역할이 다르다.**
   - violet은 '재현 확인' 상태의 테두리와 글자색이고, 자개는 재질이다.
   - violet은 링크, 호버, 포커스, 버튼, 에이전트 자신, AI 표시, 헤드라인 문장부호, 장식 다이아몬드에 쓰지 않는다. 지금 대기자 명단 헤드라인의 violet ◆ 마침표와 연구 노트 히어로의 다이아몬드는 이 규칙에 걸린다.
7. **쓰지 않는 곳.**
   - 배경, 여백(gutter), 프레임, 사이드바 가장자리, 빈 상태 장식, 로딩, 버튼 채움, 호버 틴트.
   - 가설, 보류, 기각, 실행 중 상태, 생성 요약.
   - CrowdStrike처럼 빈 여백에 브랜드 질감을 두자는 제안도 받아들이지 않는다. '꾸미기 위한 자개'가 되기 때문이다.
8. **자개 색을 손으로 고르지 않는다.** 타일이나 스펙에서만 가져온다(기존 규칙). 강제 색 모드에서는 Highlight로 바뀐다(기존 토큰).
9. **마케팅 페이지도 같은 뜻을 따른다.** why와 홈의 세션 줄과 F-01 판에서만 자개가 나오게 한다. 홈 아트 타일의 자개(K 빛 띠 등)는 사용자 결정으로 잠긴 항목이라 열린 질문으로 남긴다(§10).

---

## 8. 사이트 전달력 개선

### 8.1 진단 (감사 요약)
- **홈**
  - 16칸 가운데 13칸이 글자·질감 아트다. 이름 KKACHI는 흩어진 글자를 해독해야 읽힌다.
  - 헤드라인은 오른쪽 열 37px, 정의는 16px 본문이다.
  - 다음 행동(버튼 셋)은 1초 시점 캡처에서도 비어 있고, 3초에야 다 보인다.
  - 10초 안에 누구를 위한 것인지, 무엇을 넣고 무엇을 받는지, 왜 믿을 만한지를 알 수 없다. NN/g는 가치 제안이 10초 안에 전달되어야 하고, 사람들은 글의 약 20%만 읽는다고 본다([NN/g](https://www.nngroup.com/articles/how-long-do-users-stay-on-web-pages/), [NN/g](https://www.nngroup.com/articles/how-little-do-users-read/)).
- **why**: 히어로(108px 헤드라인, 한 줄 정의, CTA)가 가장 좋다. 그러나 이야기 전체를 담은 히어로 선 그림에 라벨이 없고 aria-hidden이다. 원칙 다섯 개(가장 강한 신뢰 신호)는 페이지 73% 깊이, 샘플 수치는 81% 깊이에 있다.
- **notes**: 세 편 모두 '준비 중'인데 상단 메뉴와 홈 타일에서 같은 무게로 보인다. 히어로의 가는 선 12개와 흰 다이아몬드 3개는 뜻이 없다. 반면 세 노트의 선 그림(범례가 조작 장치를 겸한다)은 사이트 전체에서 가장 좋은 심볼 작업이다.
- **waitlist**: 전환 지점인데 두 번째 섹션이 브랜드 재료 설명(흑칠 = 코드베이스, 끊음질 = 호출 경로…)이다. 무엇을 받는지는 나오지 않는다.
- **공통**: 다음 단어가 home, why, notes, waitlist 본문 어디에도 0번이다: 팀 · 보안팀 · 메인테이너 · 누구 · 스캐너 · 퍼저 · 외부 · 언어 · 지원 · 한계. 원자료는 `.scratch/research/kkachi-audit/`에 있다.

### 8.2 첫 화면이 말해야 할 것 (누구 · 무엇 · 왜 · 증거 · 다음)

| 질문 | 첫 화면에서의 모습 | 지금 쓸 수 있는 사실 |
|---|---|---|
| 누구를 위한가 | 한 줄. **결정 필요**(§10). 지어내지 않는다 | (없음) |
| 무엇인가 | 헤드라인 + 한 줄 정의 | "많이 찾기보다, 확실히 찾습니다." / "코드와 바이너리를 읽고 호출 경로를 끝까지 따라가, 재현으로 입증된 취약점만 보고하는 자율 연구 에이전트" |
| 무엇을 넣고 받나 | **입력 → 출력 글리프 띠**: [승인 범위(겹선)] [소스] [바이너리] [빌드 설정] [크래시 로그 · 선택] → ㄲ → [발견 판] [재현 명령] [수정 방향] [기각 기록] | why의 1단계 문장과 보고서 구조 |
| 왜 믿나 | **라벨을 단 세션 줄** 하나: 읽기 1,284 · 가설 4 · 기각 2 · 보류 1 · 재현 3/3 · F-01 (샘플 데이터) + **신뢰 띠** 다섯 글리프: 승인된 대상만(겹선) · 격리해서 재현(겹선 안 조각) · 재현 없으면 발견 아님(조각 3 → 판) · 버린 가설도 기록(빗금 판) · 공개는 사람이(고리) | 7F2A 샘플, 원칙 P1–P5 |
| 다음 행동 | 대기자 명단 버튼 하나. 0ms에 보이고, 들어오는 애니메이션이 없다 | |

### 8.3 홈
- 사용자가 잠근 개념(Tenfold식 타일 격자, 글자 아트, 격자 안의 버튼)을 지키면서 전달력을 올리는 타협안을 제안한다.
  - 왼쪽 위 2×2 타일을 메시지 타일로 쓴다: 워드마크, 헤드라인, 한 줄 정의, CTA.
  - 가로로 긴 타일 하나에 라벨을 단 세션 줄을 둔다.
  - 아트 타일은 13개에서 4–6개로 줄인다.
  - 버튼은 첫 그림부터 보인다.
- 완전히 메시지 우선 히어로로 바꿀지는 §10에서 묻는다.
- 버튼 타일의 라벨은 390px에서 한 줄에 들어가게 한다. 지금은 '왜 KKACHI인가'가 두 줄로 꺾인다.

### 8.4 why
1. 히어로 선 그림을 **세션 줄 컴포넌트**로 바꾼다. 노드마다 글리프, 라벨, 숫자를 달고, '샘플 데이터' 표시를 붙인다. 같은 컴포넌트를 홈 히어로, 대시보드 깔때기, 세션 머리, OG 이미지에서 다시 쓴다.
2. 히어로 바로 아래에 신뢰 띠(다섯 글리프)와 입력 → 출력 띠를 둔다. 각 글리프는 아래의 원칙 본문으로 이어지는 앵커다.
3. 문제 섹션의 산문을 **정성 비교 행렬**로 바꾼다. 행은 의심 지점 · 입력에서 도달 · 재현 · 원인과 수정 · 버린 가설 기록, 열은 정적 분석 · 퍼저 · KKACHI다. 셀은 채운 네모(함) / 반 채운 네모(일부) / 빈 네모(안 함)로 그린다.
   - 원은 사람 전용이므로 ●◐○는 쓰지 않는다.
   - 수치는 쓰지 않는다(v3 §6 정직성).
   - 각 칸의 판정은 사용자 검토가 필요하다.
4. '한 세션을 숫자로 보면'의 큰 숫자 여섯 개를 **한 줄 깔때기**로 합친다: 함수 1,284 → 가설 4 → (기각 2 · 보류 1이 갈라져 나감) → 재현 3/3 → 발견 1.
5. 단계별 관문 산문은 관문 장부 글리프와 산출물 칩으로 바꾼다. 문장은 툴팁이나 펼침으로 옮긴다.
6. 판단의 기록 장면은 이 문서의 선 문법(§6)으로 다시 그려, 대시보드 그래프와 같은 그림이 되게 한다.
7. 보고서 장면에는 Unit 42식 판정 블록(한 문장, 범위 줄, 상태 글리프)과 '갱신 기록'을 넣는다.

### 8.5 notes · waitlist
- **notes**
  - 히어로의 가는 선과 다이아몬드를 없앤다.
  - 한 편이 나오기 전까지 메뉴 무게를 낮추거나(예: 푸터의 '연구 노트 · 준비 중 3'), 노트마다 한 문단 초록을 붙인다.
  - 세 그림은 디자인 시스템의 표준 설명 그림으로 올리고, why와 대시보드의 툴팁과 빈 상태에 다시 쓴다.
  - '⊣···'가 노트 1에서는 기각, 노트 3에서는 보류를 뜻하는 충돌을 §6 문법(⊣ = 기각, 점선 꼬리 = 보류)으로 통일한다.
- **waitlist**
  - 두 번째 섹션을 '받는 것 / 묻는 것' 글리프 줄로 바꾼다. 받는 것은 지금 문구에 있는 사실(공개 일정 소식, 첫 연구 노트, 연구 프리뷰 초대)만 쓰고, 나머지는 결정 필요로 둔다.
  - 재료 설명(흑칠·끊음질·자개)은 `/kkachi/system/`으로 옮긴다.
  - violet ◆ 마침표를 없애고, 깃털 그림을 줄인다.

### 8.6 자르거나 심볼·숫자로 바꿀 것 (요약)

| 지금 | 바꾼 뒤 |
|---|---|
| 홈 아트 타일 13개 | 4–6개 + 메시지 타일 + 세션 줄 타일 |
| 1–3초 뒤에 나타나는 버튼 | 0ms에 보이는 CTA |
| 라벨 없는 why 히어로 그림 | 라벨을 단 세션 줄 |
| 페이지 73%·81% 깊이의 원칙과 수치 | 히어로 아래 신뢰 띠 + 한 줄 깔때기 |
| 문제 산문 | 정성 비교 행렬(네모 채움) |
| 관문 산문 | 관문 장부 글리프 + 산출물 칩 |
| 여러 곳에 반복되는 샘플 안내 문단 | '샘플 데이터' 칩 하나 + 겹선 영역 |
| 장식 다이아몬드(마침표, 글머리, 원칙 아이콘 4개, 홈 A 타일) | 없앤다. 판 글리프는 발견에만 쓴다 |
| 빈 '다음 페이지' 큰 타일 | 작은 링크 줄 |
| waitlist 브랜드 재료 설명 | 받는 것 / 묻는 것 |

---

## 9. 대시보드 정보 구조 제안

### 9.1 주 작업 흐름
**분류 → 증거 → 재현 → 검토 → 보고**
1. **분류**: 개요의 '사람 차례' 큐에서 '재현 확인' 발견 하나를 고른다.
2. **증거**: 발견 상세의 판정 줄과 근거 3–5줄을 읽고, 각 '확인' 링크로 코드와 경로를 직접 본다.
3. **재현**: 재현 탭에서 실행 3장을 보고, 명령을 복사해 직접 다시 돌린다. 패치 후 재실행 결과도 본다.
4. **검토**: 사람 검토 상자에서 승인 / 수정 요청 / 기각(사유) / 심각도를 정한다. 결정은 기록에 덧쓴다.
5. **보고**: 보고서 초안 → 승인 → 공개 준비로 간다. 보고서 끝에 갱신 기록을 둔다.

### 9.2 화면

**A. 셸**
- **왼쪽 내비**: 워드마크, 개요, 발견, 세션, 대상, 기록, 설정. 발견을 맨 위 가까이 둔다.
- **상단 바**
  - 검색(`/`).
  - 시간 제어(실시간/기록 · KST).
  - 에이전트 상태 캡슐: 지금 관문 조각 + 경과 + '실행 중 n'. 할 일이 없으면 고요한 상태로 둔다.
  - 자율 범위 띠.
  - '샘플 데이터' 칩 하나.
  - 테마 토글.
  - 일시정지 같은 전역 제어(샘플에서는 비활성).

**B. 개요 ("사람 차례")**
1. **세 질문 줄**: [세션 줄 · 실행 중 3] [재현 확인 판 · 2] [고리 · 검토 대기 n]. 타일을 누르면 필터가 된다. 숫자는 지금 샘플(진행 중 3 · 완료 3 · 멈춤 2 · 발견 2)에서 가져온다.
2. **검토 대기 큐**(왼쪽 위, 가장 넓게): 발견 카드마다 판 + 심각도 사다리(검토 전) + 제목 문장 + 재현 3/3 + 세션 + 대기 시간 + [검토 맡기].
3. **줄어든 과정**(오른쪽): 전체 세션의 깔때기, 가설 20 → … → 발견 2. 빠지는 선마다 이유 글리프와 개수를 단다.
   - 지금 샘플에는 가설 20과 발견 2만 있다. 중간 단계 값은 새로 정해야 하고 '샘플 데이터'로 표시해야 한다.
4. **세션 표**
   - 위에 사건 밀도 띠와 '목록 최신 · 시각 KST'를 둔다.
   - 탭: 전체 8 · 진행 중 3 · 완료 3 · 멈춤 2. 개수에 0도 포함한다.
   - 열: 세션 · 대상 · 세션 줄 · 시작(절대 시각) · 경과 · 결과 · 발견.
   - 5B7E의 상태는 '⊠ 기각' 대신 '발견 없음 · 가설 5 기각'과 ⊣ 세션 줄로 쓴다.
5. **방법과 한계**(접힘): "재현 3/3을 통과한 것만 보고합니다 · 확신이 없으면 보고하지 않고 보류로 남깁니다 · 범위 밖 코드는 판단하지 않습니다 · 이 화면이 보여 주지 않는 것." 실적 수치는 넣지 않는다.
6. **덜어낼 것**
   - 2건을 그린 6줄 심각도 막대그래프. 한 줄 글리프 띠(심각 0 · 높음 0 · 중간 1 · 낮음 0 · 정보 0 · 검토 전 1)로 바꾼다.
   - 개요 문단의 샘플 해명(칩과 각주로 옮긴다).
   - 빈 '고른 세션' 패널(기본으로 7F2A 요약을 채운다).

**C. 발견 목록**
- 왼쪽 필터 레일에 0까지 개수를 단다.
- 행: 판 상태 · 심각도 · 제목 문장 · 위치(file:line) · 분류(목표 글리프 + CWE 사슬) · 재현 · 검토 · 세션.
- 분류는 CrowdStrike의 'X via Y'처럼 쓴다: '메모리 쓰기 · CWE-190 → CWE-122 경유'. 목표 글리프는 5개 이내이고, 내부 분류는 내부라고 표시한다.

**D. 발견 상세 (F-01)**: 가장 중요한 화면이다.
1. 정체 띠(§3.1).
2. **판정 줄**: [판] 제목 문장. 아래에 **네 칸**을 둔다.
   - 심각도: 사다리, 사람이 정함.
   - 검증: 재현 3/3 · 관문 5/5.
   - 상태: 검토 대기.
   - 다음 행동: [검토 맡기].
3. **근거**: 3–5줄, 각 줄에 확인 링크.
4. **탭**
   - 요약(무엇이 일어났나 한 문장 · 경로 · 재현 명령 · 수정 방향).
   - 경로: 그래프 + 번호 단계 쌍둥이. 세 칸 요약 '입력은 헤더에서 들어옵니다 → 여기서 넘칩니다(rows.c:212) → 힙 경계를 넘습니다'.
   - 가설: 트리. 기각과 보류는 흐리게 남긴다. 측면 패널은 가설 / 결과 / 왜 이 가설인가 / 작업 사슬.
   - 재현: 실행 카드 3장 + 명령.
   - 기록: 감사 기록 + 원본 기록. 원본 기록은 늘 마지막 탭이다.
5. **에이전트가 한 일 / 하지 않은 일** 두 줄.
6. **사람 검토 상자**: 겹선으로 분리하고, 버튼마다 결과를 한 줄로 적는다.
7. **갱신 기록**.
8. 스크롤하면 머리가 한 줄로 접혀 붙는다: F-01 · 심각도 칸 · 재현 3/3 · [검토].

**E. 세션 상세 (7F2A)**
1. 정체 띠: 시작과 종료 절대 시각 · 대상 빌드 · 에이전트 버전 · 범위 승인자와 시각.
2. 관문 장부(세로 척추). 마디마다 산출물 칩을 단다(함수 지도 1,284 · 가설 목록 4 · 경로 그래프 · 재현 로그 ×3 · 보고서 초안). 기각 → 다음 가설로 돌아가는 끊긴 고리선도 그린다(NOVA의 되돌아가는 화살표).
3. 가설 레인 타임라인 + 커서.
4. 호출 그래프. 노드를 누르면 측면 패널이 열린다: file:line, 들어간 이유, 닿은 가설, 도달 시각, 코드 링크.
5. 세션 기록: 동사로 시작하는 줄과 유형 글리프. 반증 줄은 ⊣로 표시한다. 유형 필터에 개수를 단다.
6. 재생 제어. 재생 중에는 머리 상태가 커서를 따라가고 배너를 띄운다.

**F. 대상(승인 범위)**: 범위, 승인자와 시각, 범위 밖, 읽은 비율('읽은 함수 1,284 / 전체 N')을 보여 준다. 샘플에서 전체 N은 정해야 한다.

**G. 기록(감사)**: 에이전트와 사람의 모든 결정을 보여 준다. '작성: 에이전트 / 사람' 필터를 둔다.

**H. 설정**: 샘플에서는 비활성이다.

### 9.3 위젯 목록
세 질문 타일 · 검토 대기 큐 · 깔때기 · 세션 표(세션 줄 열) · 사건 밀도 띠 · 정체 띠 · 판정 줄(네 칸) · 근거 목록 · 관문 장부 · 호출 그래프 + 단계 쌍둥이 · 가설 트리 · 가설 레인 타임라인 · 재현 실행 카드 · 재현 명령 블록 · 사람 검토 상자 · 한 일 / 하지 않은 일 줄 · 세션 기록 사슬 · 재생 제어 · 자율 범위 띠 · 에이전트 상태 캡슐 · 출처 한 줄(▾) · 갱신 기록 · 방법과 한계 · 범례 = 필터.

### 9.4 빈 상태 · 첫 실행 · 로딩 · 오류
- **낙관적 빈 상태**: "검증된 발견 없음 · 가설 5개를 세웠고 모두 기각했습니다 · 기각 이유 보기". 기각한 판들을 증거로 함께 보여 준다. 빈칸으로 두지 않고, '안전'이라고 쓰지도 않는다. 고정 단서 "기각은 이 경로에서 재현되지 않았다는 뜻이며, 안전하다는 뜻은 아닙니다"를 붙인다.
- **검토할 것이 없음**: "검토를 기다리는 발견이 없습니다"(소등).
- **첫 실행**: 세 단계 스텝퍼(채운 마디 = 끝남, 점선 마디 = 아직): 대상 승인 → 범위 확인 → 첫 세션.
- **로딩**: 실제 타일과 같은 스켈레톤. 진행 중 세션은 관문 진척으로 보여 준다.
- **오류**: 패널 단위로 세모와 함께 "재현 VM에 연결하지 못했습니다 · 다시 시도"처럼 쓴다. 빈 상태로 API 실패를 숨기지 않는다.
- **부분과 미도달**: '일부 경로만 표시 · +9', '판정 없음 · 재현 관문에 닿지 않음', '기록 없음'.

---

## 10. 리스크와 열린 질문

### 10.1 사용자에게 묻는 것 (결정 필요)
1. **누구를 위한 제품인가?** 예: 보안팀, 오픈소스 메인테이너, 취약점 연구자. 첫 화면의 '누구' 칸을 이것 없이 채울 수 없다.
2. **코드는 어디서 돌아가나?** 고객 환경인지 KKACHI의 격리 환경인지, 무엇이 밖으로 나가는지. 보안 실무자가 가장 먼저 묻는 것인데, 지금 사이트에는 없다.
3. **지원 범위는?** 언어, 아키텍처, 입력 종류(소스만인지, 바이너리만도 되는지).
4. **확인 표지를 ◆에서 판으로 바꾸는 데 동의하나?** 이 문서는 회전하지 않은 판 문법을 권한다. 금지 규칙의 취지, 2525D·TCAS에서 마름모가 갖는 뜻, 생애 표현을 근거로 들었다. 다만 지금 페이지들이 ◆에 익숙해져 있다.
5. **홈의 잠긴 개념을 어떻게 할까?** 아트 격자를 지키는 타협안(§8.3)과 메시지 우선 히어로 가운데 무엇을 고를지. 홈 아트 타일의 자개를 줄일지도 함께 정해야 한다.
6. **밝은 테마의 자개.** 글리프가 자기 옻칠 바탕을 지니는 방식(권장)과, 밝은 테마에서는 violet만 쓰는 방식 가운데 무엇을 고를지.
7. **심각도는 누가 정하나?** 지금처럼 사람만 정할지, 에이전트가 파선으로 제안하고 사람이 확정할지. CVSS를 함께 쓸지.
8. **상태 용어 확정.** '재현 확인'(에이전트)과 '승인'(사람), 그리고 v3의 '확인·발견'과의 관계.
9. **× 금지 범위.** 45° 돌린 + 와 같아 보이는 ×를 닫기 버튼에서도 빼고 '닫기' 글자와 Esc로 대신할지.
10. **연구 노트 메뉴.** 한 편이 나오기 전까지 메뉴 무게를 낮출지.
11. **개요 깔때기의 중간 단계 샘플 값.** 가설 20과 발견 2 사이의 값을 새 샘플로 정할지, 개요 깔때기는 7F2A 한 세션으로만 보여 줄지.

### 10.2 리스크
- **기호 학습 비용.** 처음 온 사람은 글리프를 모른다. 마케팅 페이지는 항상 라벨을 보이게 하고, why에서 한 번 가르친 뒤 대시보드에서 같은 모양을 다시 쓴다. Wiedenbeck 1999: 아이콘만 쓰면 처음 배우기가 가장 어렵다.
- **규칙 과잉.** 결, 끝, 굵기, 채움, 덧표시가 모두 뜻을 가지면 지키기 어렵다. 등록부(§5.9)와 화면당 상한(굵기 3 · 결 3 · 기본 글리프 12)으로 막는다.
- **'확인'이 '안전'으로 읽힐 위험.** 고정 단서와 범위 칩('범위: 승인된 로컬 빌드 · x86_64 · ASan')을 둔다.
- **가짜 같은 샘플.** 해시와 버전을 그럴듯하게 지어내면 정직성 규칙(v3 §6)에 어긋난다. 자리표시로 두고 '샘플'로 표시한다.
- **자개 성능.** 글리프마다 셰이더를 쓰면 WebGL 컨텍스트가 넘친다. 셰이더 1개 + 타일 패턴으로 나눈다(§7).
- **흐린 선의 대비.** 뜻을 나르는 선(점선, 파선, 흐린 가설 선)은 3:1을 지켜야 한다. 고대비 모드의 기존 덮어쓰기를 함께 손본다.
- **남의 상징 빌리기.** 육각형(CrowdStrike), 보라 = AI(Datadog), 빛나는 Sankey(마케팅)를 피한다.
- **포지셔닝.** Unit 42 NOVA가 거의 같은 파이프라인을 물량(확인 14,090건)으로 내세운다. KKACHI가 숫자 경쟁에 들어가면 '발견 1개'가 약해 보인다. 깊이(입증 사슬)와 기록된 기각으로 다르게 보여야 한다.
- **병행 작업과의 충돌.** 페이지들이 다른 작업에서 다시 만들어지는 중이다. 이 문서의 토큰(`--lw-*`, `--dash-*`, 상태 토큰 base/contrast/soft)과 글리프 등록부를 시스템 문서에 먼저 넣고, 페이지는 그다음에 맞추는 순서를 권한다.

---

## 부록 A. 현재 대시보드에서 지킬 것과 바꿀 것

- **지킬 것**
  - 정직한 '샘플 데이터' 표시.
  - 왼쪽 → 오른쪽 호출 그래프와 선 구분(가는 회색 = 가지 않음, 점선 = 후보, 굵은 흰 선 = 추적).
  - 모든 패널을 움직이는 스크러버.
  - 가설 카드의 한 줄 이유('read_palette()에서 경계 검사 확인 · 01:37').
  - 보고서의 고정 순서(요약 → 근본 원인 207 → 212 → 재현 → 수정 방향, "수정은 제안일 뿐").
  - 표의 다섯 칸 단계 핍.
  - 높은 글자 대비(측정 최저 6.32:1).
- **바꿀 것**
  - ◆/⊠/파선 □/■ 상태 글리프를 판 문법으로 바꾼다.
  - '검토 전'과 '보류'의 모양 충돌을 없앤다.
  - 원 안의 마름모 싱크 노드를 '싱크' 칩 + 네모로 바꾼다.
  - 스크러버 한 줄에 모인 다섯 종 표지를 가설 레인으로 나눈다.
  - 재생 중 머리 상태가 '확인'으로 남는 문제를 고친다.
  - 함수 노드를 눌러 볼 수 있게 한다.
  - 이름 없는 가지는 '+N 미탐색 호출'로 접는다.
  - 390px에서 207/212행이 잘리지 않게 줄바꿈하거나 두 줄 증거 보기를 쓴다.
  - 390px의 why 콘솔은 결과 상태를 기본으로 보여 준다.

## 부록 B. 원자료 위치 (git 제외, 로컬)
- Datadog: `.scratch/research/datadog/` (Bits 트리와 판정, Severity Breakdown, Code Security 요약, SIEM 패널, DRUIDS 컴포넌트)
- CrowdStrike: `.scratch/research/crowdstrike/` (XDR 그래프와 범례, 프로세스 트리, Charlotte 판정·질문 트리·출처, Glide Core)
- Palo Alto: `.scratch/research/paloalto/` (Command Center, Causality, 아이콘 키, 그룹 그래프, Prisma, NOVA 그림, Unit 42 보고서), `md/`에 문서 사본 30여 개
- 같은 분야 제품: `.scratch/research/peers-trust/` (Wiz Issue와 Red Agent, GitHub 경고와 Show paths, Snyk 카드)
- 심볼과 선: `.scratch/research/symbols-lines/` (2525D 표, Linear, Primer, Carbon, MacEachren), 원문 PDF(ac25-11b, milstd2525d, tcas71, holten2011, maceachren2012)
- KKACHI 감사: `.scratch/research/kkachi-audit/` (폴드, 스크롤, 타이밍 캡처, 대비 측정, fold.txt)
- 이 문서의 글리프 스케치: `.scratch/research/synthesis/glyphs.html`, `glyphs.png`, `crops.png`
