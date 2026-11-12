---
title: "우분투 데스크탑 트러블슈팅 2"
date: 2023-10-22 17:02
categories: dev
tags: ["ubuntu"]
published: false
lang: ko
locale: ko_KR
ref: ubuntu-troubleshooting-2
---

## NVIDIA 드라이버와 해상도

```
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
Some packages could not be installed. This may mean that you have
requested an impossible situation or if you are using the unstable
distribution that some required packages have not yet been created
or been moved out of Incoming.
The following information may help to resolve the situation:

The following packages have unmet dependencies:
 nvidia-driver-530-open : Depends: libnvidia-gl-530 (= 530.41.03-0ubuntu0.22.04.2) but 530.30.02-0ubuntu1 is to be installed
                          Depends: nvidia-dkms-530-open (<= 530.41.03-1)
                          Depends: nvidia-dkms-530-open (>= 530.41.03)
                          Depends: nvidia-kernel-common-530 (>= 530.41.03) but 530.30.02-0ubuntu1 is to be installed
                          Depends: nvidia-kernel-source-530-open (= 530.41.03-0ubuntu0.22.04.2) but it is not going to be installed
                          Depends: libnvidia-compute-530 (= 530.41.03-0ubuntu0.22.04.2) but 530.30.02-0ubuntu1 is to be installed
                          Depends: libnvidia-extra-530 (= 530.41.03-0ubuntu0.22.04.2) but 530.30.02-0ubuntu1 is to be installed
                          Depends: nvidia-compute-utils-530 (= 530.41.03-0ubuntu0.22.04.2) but 530.30.02-0ubuntu1 is to be installed
                          Depends: libnvidia-decode-530 (= 530.41.03-0ubuntu0.22.04.2) but 530.30.02-0ubuntu1 is to be installed
                          Depends: libnvidia-encode-530 (= 530.41.03-0ubuntu0.22.04.2) but 530.30.02-0ubuntu1 is to be installed
                          Depends: nvidia-utils-530 (= 530.41.03-0ubuntu0.22.04.2) but 530.30.02-0ubuntu1 is to be installed
                          Depends: xserver-xorg-video-nvidia-530 (= 530.41.03-0ubuntu0.22.04.2) but 530.30.02-0ubuntu1 is to be installed
                          Depends: libnvidia-cfg1-530 (= 530.41.03-0ubuntu0.22.04.2) but 530.30.02-0ubuntu1 is to be installed
                          Depends: libnvidia-fbc1-530 (= 530.41.03-0ubuntu0.22.04.2) but 530.30.02-0ubuntu1 is to be installed
                          Recommends: libnvidia-compute-530:i386 (= 530.41.03-0ubuntu0.22.04.2)
                          Recommends: libnvidia-decode-530:i386 (= 530.41.03-0ubuntu0.22.04.2)
                          Recommends: libnvidia-encode-530:i386 (= 530.41.03-0ubuntu0.22.04.2)
                          Recommends: libnvidia-fbc1-530:i386 (= 530.41.03-0ubuntu0.22.04.2)
                          Recommends: libnvidia-gl-530:i386 (= 530.41.03-0ubuntu0.22.04.2)
E: Unable to correct problems, you have held broken packages.

```

# 증상
해상도가 1024로 고정.

# 히스토리
발생 전 날에 이런 커맨드들을 실행시켰었다.
```
 4455  conda install -c conda-forge cudatoolkit=11.8.0\n
 4456  pip install -c conda-forge cudatoolkit=11.8.0\n
 4457  source venv/bin/activate;
 4458  pip install -c conda-forge cudatoolkit=11.8.0\n
 4459  pip install cudatoolkit=11.8.0\n
 4461  conda
 4462  echo 'CUDNN_PATH=$(dirname $(python -c "import nvidia.cudnn;print(nvidia.cudnn.__file__)"))' >> $CONDA_PREFIX/etc/conda/activate.d/env_vars.sh\necho 'export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$CONDA_PREFIX/lib/:$CUDNN_PATH/lib' >> $CONDA_PREFIX/etc/conda/activate.d/env_vars.sh\n
 4463  mkdir -p $CONDA_PREFIX/etc/conda/activate.d\n
 4464  sudo mkdir -p $CONDA_PREFIX/etc/conda/activate.d\n
 4465  mkdir -p $CONDA_PREFIX/etc/conda/activate.d\necho 'CUDNN_PATH=$(dirname $(python -c "import nvidia.cudnn;print(nvidia.cudnn.__file__)"))' >> $CONDA_PREFIX/etc/conda/activate.d/env_vars.sh\necho 'export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$CONDA_PREFIX/lib/:$CUDNN_PATH/lib' >> $CONDA_PREFIX/etc/conda/activate.d/env_vars.sh\n
 4466  sudo echo 'CUDNN_PATH=$(dirname $(python -c "import nvidia.cudnn;print(nvidia.cudnn.__file__)"))' >> $CONDA_PREFIX/etc/conda/activate.d/env_vars.sh\necho 'export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$CONDA_PREFIX/lib/:$CUDNN_PATH/lib' >> $CONDA_PREFIX/etc/conda/activate.d/env_vars.sh\n
 4467  sudo echo 'CUDNN_PATH=$(dirname $(python -c "import nvidia.cudnn;print(nvidia.cudnn.__file__)"))' >> $CONDA_PREFIX/etc/conda/activate.d/env_vars.sh\n
 ...
 4469  echo 'CUDNN_PATH=$(dirname $(python -c "import nvidia.cudnn;print(nvidia.cudnn.__file__)"))\n'
 4470  echo 'CUDNN_PATH=$(dirname $(python -c "import nvidia.cudnn;print(nvidia.cudnn.__file__)"))'
 4471  sudo vi $CONDA_PREFIX/etc/conda/activate.d/env_vars.sh
 4472  source $CONDA_PREFIX/etc/conda/activate.d/env_vars.sh\n
 4473  python3 -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"\n
 4474  source $CONDA_PREFIX/etc/conda/activate.d/env_vars.sh\n
 4475  source venv/bin/activate;
 4476  python3 -m pip install nvidia-cudnn-cu11==8.6.0.163 tensorflow==2.12.*\n
 4477  vi requirements.txt
 4478  python3 -m pip install nvidia-cudnn-cu11==8.6.0.163 tensorflow==2.12.0\n
 ...
 4483  vi $CONDA_PREFIX/etc/conda/activate.d/env_vars.sh\n
 4484  echo $LD_LIBRARY_PATH
 4485  python3 -m pip install nvidia-cudnn-cu11==8.7 tensorflow==2.12.0\n
 4486  python3 -m pip install nvidia-cudnn-cu11==8.7.0.84 tensorflow==2.12.0\n
 ...
 4488  python3 -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"\n
 4489  source $CONDA_PREFIX/etc/conda/activate.d/env_vars.sh\n
 4490  python3 -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"\n
 4491  cd ~/Downloads
 4492  ls
 4493  bash ./Anaconda3-2022.10-Linux-x86_64\(1\).sh
...
 4497  conda install -c conda-forge cudatoolkit=11.8.0\n
...
 4501  ~/Projects/../anaconda3/bin/conda install -c conda-forge cudatoolkit=11.8.0\n
 4502  python3 -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"\n
 4503  sudo apt-get install zlib1g
 4504  ~/Downloads/cudnn-local-repo-ubuntu2204-8.9.2.26_1.0-1_amd64
 4505  cd ~/Downloads
 4506  ./cudnn-local-repo-ubuntu2204-8.9.2.26_1.0-1_amd64.deb
 4507  sudo ./cudnn-local-repo-ubuntu2204-8.9.2.26_1.0-1_amd64.deb
 4508  sudo dpkg -i cuda-repo-ubuntu2204-11-8-local_11.8.0-520.61.05-1_amd64.deb
 4509  sudo dpkg -i cudnn-local-repo-ubuntu2204-8.9.2.26_1.0-1_amd64.deb
 4510  sudo cp /var/cudnn-local-repo-ubuntu2204-8.9.2.26/cudnn-local-4EB48413-keyring.gpg /usr/share/keyrings/
 4511  sudo dpkg -i cudnn-local-repo-ubuntu2204-8.9.2.26_1.0-1_amd64.deb
 4512  sudo apt update
 ...
 4514  python3 -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"\n
 4515  source venv/bin/activate;
 4516  python3 -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"\n
 4517  sudo apt install cudnn
 4518  python3 -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"\n
 4519  which python
 4520  pip install nvidia-tensorrt
 4521  python3 -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"\n
 4522  nvidia-smi
```

위 커맨드와 더불어, 같은 날에 cuDNN과 CUDA toolkit 11.8 버전을 받아뒀었다.

# 해결
`nvidia-smi` 실행하니 갑자기 해결..??


## 해상도 오류와 커널 메시지

-   E820: update~~~
    
    -   [http://m.egloos.zum.com/studyfoss/v/5020843](http://m.egloos.zum.com/studyfoss/v/5020843)
    -   x86 시스템에서 사용 가능한 최대 메모리 주소를 설정하기 위한 동작. BIOS 인터럽트 15번을 이용함.
    -   메모리 주소의 어떤 부분이 reserved 이고 어디가 사용 가능한지 파악함.
-   Bios-e820: ~~~ ACPI NVS
    
    -   [https://uefi.org/specs/ACPI/6.4/02_Definition_of_Terms/Definition_of_Terms.html](https://uefi.org/specs/ACPI/6.4/02_Definition_of_Terms/Definition_of_Terms.html)
    -   ACPI: OS를 한 번 감싸서(wrap) 하드웨어 인터페이스를 추상적으로 묘사하는 인터페이스를 제공함.
        -   아마 시동, soft 종료, 기계적 종료, sleep 같은 상태에 대한 인터페이스 제공하는듯?
    
    > The Advanced Configuration and Power Interface (ACPI) specification was developed to establish **industry common interfaces** enabling robust operating system (OS)-directed **motherboard device configuration and power management of both devices and entire systems**. ACPI is the key element in Operating System-directed configuration and Power Management (OSPM).
    
    -   NVS: Non Volatile Storage. 비휘발성 저장공간.
    -   위 주소는 acpi nvs 메모리로 사용되고, 시스템에 의해 점유되었으므로 os가 차지하면 안 된다는 언급 있음. 아마 마더보드나 파워 관리에 사용하니까 os 단에서 사용하면 안 되는듯?
-   Total RAM covered: ~~~
    
    -   E820 동작 하면서 알아낸 가용 메모리 크기인듯?
    -   관련해서 바이오스 오류일 수 있다는 제보 있음 [https://askubuntu.com/questions/141881/system-reports-only-4-gb-or-ram](https://askubuntu.com/questions/141881/system-reports-only-4-gb-or-ram)
-   Nvidia tool 재설치하니 해결됐다….

## suspend 후 resume이 안 됨

[이 글](https://askubuntu.com/a/1404946)을 참고했다. 해상도 오류를 위해 nvidia driver를 새로 설치한 후 발생했다. nvidia의 suspend 관련 기능에 문제가 있는지 아래 커맨드를 실행한 후 잘 되었다.

```bash
systemctl disable nvidia-hibernate.service nvidia-resume.service nvidia-suspend.service
```

2023-10-22. 이전에는 위와 같은 조치만으로도 해결되었나본데 위 조치 후 suspend 및 재시동하니 아래 메시지가 떴다.

```
Non-boot CPUs are not disabled
```

[현재 버전의 커널에서 버그가 있다는 얘기](https://askubuntu.com/questions/1481472/non-boot-cpus-are-not-disabled-seems-there-is-a-bug-in-6-2-0-26-generic-kerne)가 있었다. 아래처럼 커널 버전을 확인해봤을 때 질문자가 나와 동일한 커널 버전을 쓰고있다.

```
> uname -r
6.2.0-35-generic
```

`/etc/default/grub` 에서 아래 옵션을 추가하면 해결된다길래 해봤는데 안 되었다.

```
pcie_aspm=off
```

nvidia driver를 545 버전으로 업그레이드하니 해결되었다.

## HDD, fstab, 그리고 부팅이 안 되는 문제

File System tab 인듯?

파일시스템 정보를 저장하고 있으며, 리눅스 부팅시 마운트정보를 저장하고 있다[^1]. 이 파일이 손상되면 부팅 시 마운트하는 과정에서 멈추게 될 것.

아래 형태로 우분투 첫 설치했을 때 지정했던 파티션들이 저장되어있다.

```
UUID=<uuid> /               ext4    errors=remount-ro 0       1
# /boot/efi was on /dev/nvme1n1p1 during installation
UUID=<uuid>  /boot/efi       vfat    umask=0077      0       1
# /home was on /dev/nvme0n1p5 during installation
UUID=<uuid> /home           ext4    defaults        0       2
# swap was on /dev/nvme0n1p2 during installation
UUID=<uuid> none            swap    sw              0       0
```

이는 `<file system> <mount point>   <type>  <options>       <dump>  <pass>` 형태를 따른다고 함.

- file system: `/dev/sda` 같은 장치 이름.
- mount point: 내 시스템의 어느 위치에 마운트할지.
- type: 파일 시스템 종류, ext4 같은 것.
- options: 부팅 시 자동 마운트인지, 읽기 전용인지 등 특성을 지정하는 부분. 아래 참조.
- dump: 백업 여부.
- pass: 시스템 점검할 때 동작을 지정하는 옵션.

HDD를 추가할 때는 이렇게 했다.

1. gparted 로 파티션 확보하기
    1. 이 때 파티션 테이블을 생성하는듯 하다. 파티션 테이블이 생성되고 새 파티션이 등록되면 `/dev/sda` 같은 이름이 붙는다고 한다[^2].
2. 디스크를 마운트한다.
    1. 마운트 지점을 생성하고 `/etc/fstab` 을 수정한 뒤 마운트하면 영구적으로 등록할 수 있다[^2].

이 과정이 모두 끝나고 나면 gparted 에서도 Mount point 가 지정된 것을 확인할 수 있음. 아무래도 `/etc/fstab` 을 확인해서 보여주는듯하다.

fstab 을 수정하기 전에는 /backup 위치에 마운트해서 드랍박스와 동기화했을 때 root 용량이 차는 이상한 현상이 일어났다. 마운트 포인트를 알려주지 않아서 제일 근접한 위치인 root 에 추가되었다고 본듯 하다.

`/etc/fstab`은 파일시스템의 마운트 관련 정보를 담고있다. 이 부분에서 에러가 발생한다면 부팅 중에 마운트가 안 되어서 부팅이 중지된다고 한다. 이 문제를 실제로 경험했다. 갑자기 부팅이 안 된다. 까만 화면에 `journalctl -xb`로 문제 원인을 확인해보라는 얘기만 나온다. 핸드폰에 이 내용을 찍어뒀음. `ls /` 로 확인해보니 파일 시스템은 잘 확인하고 있는것 같다. 저널을 확인해보니 중간중간 kvm이 bios에서 사용하지 않도록 세팅되었다는 문구도 보이고 이런 저런 문구들이 보이는데 /dev/sdb2 device.start 가 실패했다는 문구가 제일 눈에 들어온다. 안 그래도 최근 부팅이 잘 안 되었던 문제는 새로 산 HDD를 마운트하면서 시작되었다. 혹시나해서 fstab에서 /dev/sdb2 를 마운트 설정한 라인을 comment-out 해봤는데 재부팅하니 잘 된다(..) 나중에 원인 파악이 필요함. 백업 잘 하려고 마운트했는데 부팅 문제가 생기니 안타깝다. 뭐가 문제인거지?

## 부팅 시 USB를 못 찾는 에러

커널 단계에서 usb 못 찾겠다는 에러가 떴다. 핸드폰으로 사진 찍어놨음. usb5.4 어쩌고 하면서 에러가 나서 usb 에러로 짐작했음. 어제 웹캠이 동작을 안 해서 웹캠이 문젠가 싶어 한번 뽑아봤더니 바로 커널 부팅이 종료되었다. `journalctl -xe` 로 로그 봐도 되고 아니면 재부팅하라는 문구가 떠서 한번 journalctl 로 로그를 확인했음. 외부장치 인식하기 전까지는 잘 되고 디스크 인식도 잘 된것같아 보였다. 디스크 인식에서는 별 에러 로그가 없었음. USB 장치 인식하는데에서 ABKO 어쩌고 하는 부분이 있었는데 여기서 아까 봤던 에러가 나오고있었음. USB 포트가 있다는건 인식하고 있고 ABKO 어쩌고 장치가 있긴 한데 여기에 연결할 수 없다는 에러가 나왔다. 좀 이상한건 인식된 웹캠 USB 번호는 5.3인데 5.4를 인식할 수 없다는 에러가 뜨고있었다는 것임. 혹시 설정이 좀 꼬여서 5.4로 알고있었는데 5.3에 연결되어있어서 못 찾았다는 뜻일까?

그럼 이 상태에서는 뭐가 들어있는지 궁금해서 journalctl 끄고 ls를 해봤는데 snap 이라는 폴더만 있었다. 로그에서 snap store 에서 설치한 프로그램들을 mount 하는 과정이 보였는데 그 때문인듯.

이상해서 뽑힌 상태로 재부팅한번 해봤는데 잘 된다. 이번에는 journalctl 봤는데 ABKO 설정은 찾았으나 연결이 안 된다는 로그가 나왔음.

## 파워서플라이 clicking sound

fGPU로 트레이닝을 돌리던 중에 데스크탑에서 이상한 소리가 들리기 시작했다. 어제 데이트 나가기 전에 훈련 돌려놓고 나간 뒤 생긴 일이었다. 이상하게 clicking noise가 들리기 시작한다. 아무래도 GPU heavy 한 작업이니까 GPU가 문제인줄 알았다. 찾아보니 비슷한 증상을 겪는 사람들이 꽤 있다. 고성능 GPU의 Coil whine은 흔히 발생하는 일이라고 한다. 그러던 중 Coil whine을 불량으로 보고 본사에 AS를 맡겼다는 한국인 후기가 있어 나도 AS를 맡겨보려고 동영상을 찍었다. 이자식이 동영상 찍으니까 소리가 잘 안 난다. 여튼 조금이라도 소리를 녹음하긴 했다. AS를 맡기기 전에 정말 문제가 GPU에 있는지 확인해보려고 케이스를 분해했다. 그런데 이게 웬걸 케이스를 뜯으려고 뒷면에 귀가 가까이 가니 GPU가 아니라 아래쪽에서 소리가 나고 있었다. 파워였다.

파워가 single rail limit에 도달하면 clicking sound가 나기 시작하고 앞으로 없어지진 않는다고 한다(..)([유튜브의 댓글](https://www.youtube.com/watch?v=50syZ92xvGw) 참조) 보통 뭔가 이상하게 되어있을 때 소리가 난다고 한다[^3]. 진짜 PSU가 failing 하고 있던가, 위치가 잘못됐던가, 공기 흐름이 불충분하던가 등. 아무래도 훈련을 거의 24시간 돌리고 있으니 failing point에 도달했을 가능성도 있을듯 하다. GPU를 이렇게 오래 돌려본적이 없다보니. 근데 그래도 괜찮아야하지 않나? 10년 보증이라니까 일단 AS를 맡겨봐야겠음.

## Git diff의 한글 파일 명이 깨질 때

```sh
git config --global core.quotePath false
```

> `core.quotePath`
> Commands that output paths (e.g. `ls-files`, `diff`), will quote "unusual" characters in the pathname by enclosing the pathname in double-quotes and escaping those characters with backslashes in the same way C escapes control characters (e.g. `\t` for TAB, `\n` for LF, `\\` for backslash) or bytes with values larger than 0x80 (e.g. octal `\302\265` for "micro" in UTF-8). If this variable is set to false, bytes higher than 0x80 are not considered "unusual" any more. Double-quotes, backslash and control characters are always escaped regardless of the setting of this variable. A simple space character is not considered "unusual". Many commands can output pathnames completely verbatim using the `-z` option. The default value is true.
> https://stackoverflow.com/questions/34549040/git-not-displaying-unicode-file-names

Path를 출력하는 커맨드에서 ASCII가 아닌 글자는 "unusual"하다고 보고 전부 escape한다고 함.

[^1]: "리눅스 - /etc/fstab." IT_Dexter, 16 Feb. 2016, itdexter.tistory.com/311.

[^2]: https://askubuntu.com/questions/125257/how-do-i-add-an-additional-hard-drive

[^3]: "How To Fix Power Supply Clicking Noise?" Tech News Today, 14 July 2022, www.technewstoday.com/power-supply-clicking.
