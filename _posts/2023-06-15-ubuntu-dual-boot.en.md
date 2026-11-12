---
title: "Ubuntu Dual Boot"
date: 2023-06-15 15:00
categories: dev
tags: ["dev", "ops", "ubuntu"]
lang: en
locale: en_US
ref: ubuntu-dual-boot
permalink: /en/ubuntu-dual-boot.html
---

# Making a boot USB

1.  Get the Ubuntu boot iso. You can check it at [https://releases.ubuntu.com/](https://releases.ubuntu.com/).
2.  Use rufus. Seems like a lot of people use this program.

[Rufus](https://rufus.ie/ko/)

1.  If needed, change the partition layout to GPT.
    1.  What's a partition layout?
    2.  What's GPT?
    3.  Partition layout

# Which disk should I put it on?

Possible options

1.  Put Windows on the 1TB disk and Ubuntu on the 512GB one
    1.  Need to clone the OS (feels like there's a barrier to entry)
    2.  🤔Would it be better to separate the same OS's boot and disk, or would putting them on the same disk be mostly fine?
2.  Keep it as is, and have Windows and Ubuntu share the 1TB disk
    1.  Nothing to do in advance

If you want to save one of them even if one disk dies, it's option 1. If you split the OS by disk, even if one disk dies the other OS remains. Option 2 is Windows and Ubuntu sharing the 1TB, so if that disk dies you lose both. But option 2 has nothing to do in advance, so I went with option 2 for now.

## Progress log

(In the notes there was an image of the existing disk volume state here.)

Existing state. Disk 0's volumes are split into two parts.

Like the photo above, disk 0 (1TB) has its volumes split into two parts. I tried to merge the two, but when shrinking the volume it proceeded in a form where a new partition appeared between the two volumes.

-   Continuity seems important for HDDs, but is it important for SSDs too? SSDs work like memory so as long as they're well merged at the block level it might be fine.

(In the notes there was an image of the disk defragmentation screen here.)

Disk defragmentation screen. D drive is in a state where it cannot be optimized.

When I tried to shrink the volume, a message came up that seemed to say I had to split and shrink the volume because of the location of already existing files, so I opened the window wondering if maybe doing drive defragmentation would fix it. The result, weirdly, was a message saying "optimization cannot be used".

[https://answers.microsoft.com/ko-kr/windows/forum/all/윈도우/8e75497a-7950-4ab7-84c1-191f5677b17e](https://answers.microsoft.com/ko-kr/windows/forum/all/%EC%9C%88%EB%8F%84%EC%9A%B0/8e75497a-7950-4ab7-84c1-191f5677b17e) There was a similar MS inquiry so I ran `chkdsk /r` on the C drive and D drive. Below is the run log.

-   Run log
    
    ```powershell
    PS C:\\WINDOWS\\system32> chkdsk /r
    파일 시스템 유형은 NTFS입니다.
    현재 드라이브를 잠글 수 없습니다.
    
    다른 프로세스가 볼륨을 사용하고 있으므로 CHKDSK를
    실행할 수 없습니다. 다음에 시스템이 다시 시작할 때
    이 볼륨을 검사하도록 하시겠습니까(Y/N)? Y
    
    다음에 시스템을 다시 시작할 때 이 볼륨을 검사합니다.
    ```
    
    ```powershell
    PS D:\\> chkdsk /r
    파일 시스템 유형은 NTFS입니다.
    현재 드라이브를 잠글 수 없습니다.
    
    다른 프로세스가 볼륨을 사용 중이기 때문에 Chkdsk를 실행할 수 없습니다.
    이 볼륨을 우선 분리하면 Chkdsk를 실행할 수 있을 것입니다.
    그러면 이 볼륨에 대해 열린 모든 핸들을 사용할 수 없습니다.
    이 볼륨에서 분리하도록 하시겠습니까(Y/N)? Y
    볼륨을 분리했습니다. 이 볼륨에 대해 열린 모든 핸들을 이제 사용할 수 없습니다.
    볼륨 레이블은 새 볼륨입니다.
    
    1단계: 기본 파일 시스템 구조 검사...
      768개의 파일 레코드가 처리되었습니다.
    파일 검증 작업을 완료했습니다.
     단계 기간(파일 레코드 검증): 21.78 밀리초.
      0개의 큰 파일 레코드가 처리되었습니다.
     단계 기간(연결 없는 파일 레코드 복구): 0.59 밀리초.
      0개의 잘못된 파일 레코드가 처리되었습니다.
     단계 기간(잘못된 파일 레코드 확인): 0.51 밀리초.
    
    2단계: 파일 이름 연결 검사...
      3개의 재분석 레코드가 처리되었습니다.
      926개의 인덱스 항목이 처리되었습니다.
    색인 검증 작업을 완료했습니다.
     단계 기간(인덱스 검증): 5.22 초.
      0개의 인덱싱되지 않은 파일이 검색되었습니다.
     단계 기간(고아 재연결): 0.60 밀리초.
      0개의 인덱싱되지 않은 파일이 손실 및 찾기로 복구되었습니다.
     단계 기간(손실 및 찾기로 고아 복구): 1.42 밀리초.
      3개의 재분석 레코드가 처리되었습니다.
     단계 기간(재분석 지점 및 개체 ID 검증): 1.55 밀리초.
    
    3단계: 보안 설명자 검사...
    보안 설명자를 검증했습니다.
     단계 기간(보안 설명자 검증): 1.20 밀리초.
      79개의 데이터 파일이 처리되었습니다.
     단계 기간(데이터 특성  검증): 0.97 밀리초.
    
    4단계: 사용자 파일 데이터에서 잘못된 클러스터 찾기...
      752개의 파일이 처리되었습니다.
    파일 데이터를 검증했습니다.
     단계 기간(사용자 파일 복구): 59.41 초.
    
    5단계: 잘못된 가용 클러스터 찾기...
      225921917개의 사용 가능한 클러스터가 처리되었습니다.
    빈 공간을 검증했습니다.
     단계 기간(사용 가능한 공간 복구): 0.00 밀리초.
    
    Windows에서 파일 시스템에 문제가 없음을 확인했습니다.
    더 이상 작업이 필요하지 않습니다.
    
    전체 디스크 공간: 1000200191KB
      96415060KB (532개 파일)
    색인 81개:        220KB
    잘못된 섹터:          0KB
    시스템 사용:      97239KB
    로그 파일이      65536KB가 되었습니다.
    사용 가능한 디스크 공간:  903687672KB
    
    각 할당 단위:       4096바이트
    디스크의 전체 할당 단위 개수:  250050047개
    디스크에서 사용 가능한 할당 단위 개수:  225921918개
    전체 기간: 1.07 분(64673 밀리초).
    ```
    

But optimization is still in a state where it cannot be triggered, and in the disk management window the two volumes are split, i.e. the same state as before. In other words, the hypothesis that "it's because disk defragmentation hasn't been done" is rejected.

Same even after restarting.

(In the notes there was an image of the volumes in a split state after formatting here.)

After formatting, the look of it splitting cleanly.

There wasn't much remaining data so I formatted the disk and created the volumes again. Split cleanly.

After that I put it nicely onto the split partitions.

## Things to watch out for

At first I thought it would be fine to take root (`/`) at 10~20GB, and swap at twice the RAM.
- Update: I wrote that around 50GB would be better, but after that even 50GB wasn't enough. ([That time I almost wiped home after resizing Ubuntu partitions](/en/ubuntu-partition.html))

If you're going to dual boot you have to install GRUB on the disk's EFI partition (if it's UEFI; if it's legacy BIOS, the disk MBR) for GRUB to come up at boot. This EFI partition is often the same place as the ESP that has the Windows boot manager.
