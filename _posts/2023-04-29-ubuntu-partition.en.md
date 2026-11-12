---
title: "That time I almost wiped home after resizing Ubuntu partitions"
date: 2023-04-29 11:00
categories: dev
tags: ["dev", "ops", "ubuntu"]
lang: en
locale: en_US
ref: ubuntu-partition
permalink: /en/ubuntu-partition.html
---

The root partition was running out of space, so I backed up the home partition, deleted it, and tried to grow the root partition.

In this process I had an experience that felt like I'd wiped the home partition.

# Background
I'm using Ubuntu 22.04 on a desktop machine.
When I first installed it I set the root partition to 50GB following the usual recommendation.
The home partition started right after the root partition and I secured about 300GB.
(FYI, this seems to be a custom from the old days when disk space was scarce, and these days it seems like you don't really need to do this.)

As time passed, whenever I installed something using Docker, the out-of-space message showed up often.
Docker images and volumes weren't stored on the home partition but under root, so the partition set to 50GB seemed too small.

I tried to expand the root partition using Gparted, but it turned out gparted can only expand partitions to the right.
In the existing partition structure there was no space at all between root and home.
Because I had previously placed the home partition right after the root partition, there was no space to expand the root partition.

I could have considered formatting, but I was using it for work and had already done various settings, so I didn't want to invest time in recovery work.
(I also needed time to play games.)

There was about 100GB of free space on the home partition.
After cleaning up a bit more I was able to free another 50GB.
If I shrank this, it looked like I could allocate more space to the root partition.
So I decided to delete the home partition and then adjust its position in order to allocate more space to the root partition.

# Rising action
There's a saying, "Two is one and one is none".
It means always count one as none and prepare for the case of failure.
For data, that would be always making a backup.
Remembering this saying, before formatting the home partition I copied all user data under home to a separate hard disk.

```bash
sudo cp -r /home/* /mnt/hdd0/Home_bk/
```

After that I rebooted with a USB that had an Ubuntu boot disk image.
At this point, if I newly installed Ubuntu, root would all be wiped and I'd have to restore the settings, so I didn't do a new install.
Instead, during the install process I only deleted the home partition and grew the root partition.
After that, rather than the install process, I proceeded with the work using gparted from "Try Ubuntu".
I successfully changed the size of the root partition and unallocated home, then rebooted.

# Crisis

**But it doesn't boot.**

It doesn't boot.
If you've used Ubuntu you may already have run into this kind of situation several times, so during the boot process I was able to enter safe mode and see a terminal screen.
After that I tried reboot, but this time an error I'd never seen before occurred.

```bash
Failed to start reboot.target: Transaction is destructive.
See system logs and 'systemctl status reboot.target' for details.
```

I got curious what on earth the phrase "Transaction is destructive" means.
Why would there be a destructive element when rebooting?
This question made the confusion even bigger.

When I checked the status of "reboot.target" as the suggested command said, I could confirm that "reboot.target" was disabled and in a dead state.

```bash
$ systemctl status reboot.target
● reboot.target - Reboot
   Loaded: loaded (/lib/systemd/system/reboot.target; disabled; vendor preset: disabled)
   Active: inactive (dead)
     Docs: man:systemd.special(7)
```

After that, in a despairing mood I meaninglessly repeated the same process several times but didn't get much out of it.

Fortunately I looked it up on the internet and got a hint that boot problems can occur if the contents registered in fstab are missing.
Thinking about it, if I had formatted the home partition and completely removed it, it occurred to me that it might not boot.
According to what I'd looked up before, if the information registered in fstab is inappropriate, booting may not happen.

So I checked and the home partition related registration info was still left in /etc/fstab, and when I checked the uuid, the uuid registered in fstab didn't exist.

```bash
sudo blkid
```

I commented out that location in fstab and rebooted. This time it booted fine!

> Takeaway: If the contents in /etc/fstab cannot be loaded, it doesn't boot.

However, as if telling me to slow down a bit, this time login didn't work.
On the login screen the users that originally existed were displaying fine.
Probably because the root partition is well preserved, and user information is registered on the root partition, I think.

I expected that if I put a symbolic link from /home to the location I'd backed up, it would be able to find the user home files. But login still didn't work.

So I thought if I recreated the home partition since I'd removed it, login would work, and I tried creating it. In this process there were also some difficulties related to gparted, but eventually I recreated the home partition through gparted and manually changed fstab and successfully mounted it. But login still didn't work.

I expected I'd be able to log in with a new user so I tried creating a new user. Using the "adduser" command to add a new user, the user's home directory was automatically created at the home location. Fortunately login worked this way. But if I can't log in with the existing users, that's a problem.

```bash
sudo adduser username
```

Having confirmed that login works with the new user, I wondered if putting the existing users' backed-up data in the original location would make login work, so I went into the terminal and looked for the backed-up data.

But then, what do you know, **the backed-up data was not visible.**

# Climax

To briefly explain, the backed-up data, even if the size might not be that large (total ~200GB), has various setting values in it.
From simple things like zsh or asdf settings to installed apps, and VPN settings used at the company would also be in the home directory.
Fortunately the project files are stored on a separate hard drive and synced with git, so that's not a problem.

But the biggest problem is the time spent setting things up again.
No matter how important the data is you can get it back, but that process is truly exhausting.
There are still several days of holiday left and I didn't want to blow this nice holiday on "tidying up settings I didn't have to do but touched anyway and now have to do again".

I'm not usually someone who panics much.
Even when I panic I consciously think "in this situation I guess I should panic a bit to be human" and fall into a somewhat intentional panic state.
This time was different.

My hands were actually shaking and dismay rose up from the core.
Thinking about it now, I think it was more so because the two hours until just now of staying up late struggling to grow the partition size a bit seemed to have gone to waste.

I checked the command history, but I couldn't confirm whether I'd deleted it by mistake.
I checked what was in the location I'd created, and the newly created users were in there.
I thought maybe I'd misconfigured something and the newly created users had gone that way.

For some reason I listed up the root directory.
```bash
sudo ls -al /
```

But then, what do you know, the /home I'd created earlier was still a symbolic link.
This was very strange.

I deleted the symbolic link and rebooted.. and the original data was still alive!
The thought that I hadn't done anything wrong came to me and in that moment a deep relief set in.

What I learned afterward is that in Linux, if you mount another disk B at the location where disk A's data physically is, only B's data becomes visible.

If disk B is a picture frame, the mural is still there, but you hang the frame and the mural becomes invisible.

> Takeaway: In Linux, if you mount another disk B at the location where disk A's data physically is, only B's data is visible.

# Ending

But login still didn't work.
This time, rather than the earlier failures, it was simply an ownership problem of the copied files.

I got a hint referring to askubuntu.
They say when login doesn't work properly, you need to suspect a file ownership problem.

When I actually checked the ownership of the copied home, it was all set to root.
Probably when trying to log in as a specific user it tried to use the files in that user's home directory, but lacked permission, so login failed.

```bash
stat /path/to/file`
```

I changed the directory ownership and tried logging in again.

```bash
sudo chown -R username: /home/username
```

This time login worked fine. The settings were all as they were, and I could use the environment I'd originally been using as-is.

> Takeaway: Ubuntu seems to check the user's file ownership on the login screen, and restrict login if it's not their own permission.
