---
title: "Ubuntu Desktop Troubleshooting 2"
date: 2023-10-22 17:02
categories: dev
tags: ["ubuntu"]
published: false
lang: en
locale: en_US
ref: ubuntu-troubleshooting-2
permalink: /en/ubuntu-troubleshooting-2.html
---

## NVIDIA driver and resolution

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

# Symptoms
Resolution stuck at 1024.

# History
The day before it happened I had run these kinds of commands.
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

On top of the commands above, on the same day I had downloaded cuDNN and CUDA toolkit 11.8.

# Fix
I ran `nvidia-smi` and it suddenly got fixed..??


## Resolution error and kernel messages

-   E820: update~~~
    
    -   [http://m.egloos.zum.com/studyfoss/v/5020843](http://m.egloos.zum.com/studyfoss/v/5020843)
    -   An operation for setting the maximum available memory address on an x86 system. Uses BIOS interrupt 15.
    -   Figures out which parts of the memory address are reserved and which are usable.
-   Bios-e820: ~~~ ACPI NVS
    
    -   [https://uefi.org/specs/ACPI/6.4/02_Definition_of_Terms/Definition_of_Terms.html](https://uefi.org/specs/ACPI/6.4/02_Definition_of_Terms/Definition_of_Terms.html)
    -   ACPI: wraps the OS once and provides an interface that abstractly describes the hardware interface.
        -   Seems to provide interfaces for states like startup, soft shutdown, mechanical shutdown, sleep?
    
    > The Advanced Configuration and Power Interface (ACPI) specification was developed to establish **industry common interfaces** enabling robust operating system (OS)-directed **motherboard device configuration and power management of both devices and entire systems**. ACPI is the key element in Operating System-directed configuration and Power Management (OSPM).
    
    -   NVS: Non Volatile Storage. Non-volatile storage space.
    -   There's a mention that the above address is used as acpi nvs memory and occupied by the system, so the os shouldn't take it. Probably used for motherboard or power management so you shouldn't use it at the os level?
-   Total RAM covered: ~~~
    
    -   Seems to be the available memory size found while doing the E820 operation?
    -   There's a report it could be a BIOS error related to this [https://askubuntu.com/questions/141881/system-reports-only-4-gb-or-ram](https://askubuntu.com/questions/141881/system-reports-only-4-gb-or-ram)
-   Reinstalled Nvidia tool and it got fixed….

## Resume doesn't work after suspend

I referred to [this post](https://askubuntu.com/a/1404946). It happened after newly installing the nvidia driver for the resolution error. There seemed to be a problem with nvidia's suspend-related features, and after running the command below it worked well.

```bash
systemctl disable nvidia-hibernate.service nvidia-resume.service nvidia-suspend.service
```

2023-10-22. Previously it seems like the above measure alone fixed it, but after the above measure I suspended and restarted and the message below came up.

```
Non-boot CPUs are not disabled
```

There was [talk that there's a bug in the current version of the kernel](https://askubuntu.com/questions/1481472/non-boot-cpus-are-not-disabled-seems-there-is-a-bug-in-6-2-0-26-generic-kerne). When I checked the kernel version like below, the questioner is using the same kernel version as me.

```
> uname -r
6.2.0-35-generic
```

They said adding the option below in `/etc/default/grub` would fix it so I tried it but it didn't work.

```
pcie_aspm=off
```

I upgraded the nvidia driver to version 545 and it was fixed.

## HDD, fstab, and the problem of not booting

Seems to be File System tab?

It stores filesystem information, and stores mount information when Linux boots[^1]. If this file is damaged it would stop during the mounting process at boot.

The partitions I'd specified when first installing Ubuntu are stored in the form below.

```
UUID=<uuid> /               ext4    errors=remount-ro 0       1
# /boot/efi was on /dev/nvme1n1p1 during installation
UUID=<uuid>  /boot/efi       vfat    umask=0077      0       1
# /home was on /dev/nvme0n1p5 during installation
UUID=<uuid> /home           ext4    defaults        0       2
# swap was on /dev/nvme0n1p2 during installation
UUID=<uuid> none            swap    sw              0       0
```

They say this follows the form `<file system> <mount point>   <type>  <options>       <dump>  <pass>`.

- file system: a device name like `/dev/sda`.
- mount point: which location on my system to mount it at.
- type: filesystem kind, something like ext4.
- options: the part that specifies characteristics like whether it's auto-mount at boot, read-only, etc. See below.
- dump: whether to backup.
- pass: an option that specifies the behavior when doing a system check.

When adding an HDD I did it like this.

1. Secure a partition with gparted
    1. At this point it seems to create a partition table. They say once a partition table is created and a new partition is registered, a name like `/dev/sda` gets attached[^2].
2. Mount the disk.
    1. If you create a mount point, modify `/etc/fstab`, then mount, you can register it permanently[^2].

Once this whole process is done you can confirm in gparted that the Mount point has been specified. It seems like it checks `/etc/fstab` and shows it.

Before modifying fstab, when I mounted at the /backup location and synced with Dropbox, a weird phenomenon happened where root capacity filled up. Seems like because I didn't tell it the mount point, it saw it as added at the closest location, root.

`/etc/fstab` holds filesystem mount-related information. They say if an error occurs in this part, it fails to mount during boot so booting stops. I actually experienced this problem. Suddenly it doesn't boot. On a black screen it just says to check the cause of the problem with `journalctl -xb`. I took a photo of this on my phone. I checked with `ls /` and it seems like it's checking the filesystem fine. Looking at the journal, there are also phrases in between that kvm was set not to be used in bios, and various other phrases, but the phrase that /dev/sdb2 device.start failed catches my eye the most. The recent problem of not booting well started when I mounted the newly bought HDD. Just in case I tried commenting out the line in fstab that had the mount setting for /dev/sdb2, and after rebooting it works fine(..) Need to figure out the cause later. It's a shame that I mounted it to backup well and then a boot problem happened. What's the problem?

## Error of not finding USB at boot

At the kernel stage an error came up that it couldn't find usb. I took a photo with my phone. It errored saying usb5.4 something so I guessed it was a usb error. Yesterday the webcam wasn't working so I thought maybe the webcam was the problem and unplugged it once, and immediately kernel boot terminated. You can look at the logs with `journalctl -xe`, or there was a message to reboot so I checked the logs with journalctl once. Until recognizing external devices it seemed to be going well and disk recognition also seemed fine. There weren't any particular error logs in disk recognition. In USB device recognition there was a part saying ABKO something, and the error I'd seen earlier was coming out here. It was recognizing that there is a USB port, and there is an ABKO something device, but an error came out that it couldn't connect to it. What's a bit strange is that the recognized webcam USB number is 5.3 but an error was coming up that it couldn't recognize 5.4. Could it mean the settings got a bit tangled and it knew it as 5.4 but it was connected at 5.3 so it couldn't find it?

Then I got curious what was in it in this state so I turned off journalctl and tried ls, and there was only a folder called snap. In the logs there was a process of mounting programs installed from the snap store, so probably because of that.

It was weird so I tried rebooting once in the unplugged state and it works fine. This time I looked at journalctl and a log came out that it found the ABKO setting but couldn't connect.

## Power supply clicking sound

While running training with fGPU, a weird sound started coming from the desktop. It was something that happened after I started training and went out on a date yesterday. Weirdly a clicking noise starts to be heard. Since it's a GPU heavy job I thought the GPU was the problem. Looking it up, there are quite a few people with similar symptoms. They say coil whine on high-performance GPUs is a commonly occurring thing. Then there was a Korean review of someone who treated coil whine as a defect and sent it to HQ for warranty repair, so I filmed a video intending to send it in for warranty repair too. The damn thing, when I film a video the sound doesn't come out well. Anyway I did record at least a little of the sound. Before sending it in for warranty repair I took the case apart to check whether the problem was really in the GPU. But then, what do you know, when I put my ear close to the back to take the case apart, the sound was coming from below, not the GPU. It was the PSU.

They say when the PSU reaches the single rail limit a clicking sound starts and it won't go away going forward(..)(see [a YouTube comment](https://www.youtube.com/watch?v=50syZ92xvGw)) They say usually a sound happens when something is in a weird state[^3]. Whether the PSU was really failing, or the position was wrong, or airflow was insufficient, etc. Since I've been running training for almost 24 hours, there might also be a possibility it reached a failing point. I've never run a GPU this long. But still, shouldn't it be fine? They say it's a 10-year warranty so I should send it in for warranty repair for now.

## When Korean file names get garbled in Git diff

```sh
git config --global core.quotePath false
```

> `core.quotePath`
> Commands that output paths (e.g. `ls-files`, `diff`), will quote "unusual" characters in the pathname by enclosing the pathname in double-quotes and escaping those characters with backslashes in the same way C escapes control characters (e.g. `\t` for TAB, `\n` for LF, `\\` for backslash) or bytes with values larger than 0x80 (e.g. octal `\302\265` for "micro" in UTF-8). If this variable is set to false, bytes higher than 0x80 are not considered "unusual" any more. Double-quotes, backslash and control characters are always escaped regardless of the setting of this variable. A simple space character is not considered "unusual". Many commands can output pathnames completely verbatim using the `-z` option. The default value is true.
> https://stackoverflow.com/questions/34549040/git-not-displaying-unicode-file-names

They say in commands that output paths, non-ASCII characters are seen as "unusual" and all escaped.

[^1]: "리눅스 - /etc/fstab." IT_Dexter, 16 Feb. 2016, itdexter.tistory.com/311.

[^2]: https://askubuntu.com/questions/125257/how-do-i-add-an-additional-hard-drive

[^3]: "How To Fix Power Supply Clicking Noise?" Tech News Today, 14 July 2022, www.technewstoday.com/power-supply-clicking.
