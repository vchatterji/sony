sony
====

This simple library and program allows you to remotely take a picture using a Sony camera (tested on the A7R) from your laptop.

To use this program, you need to have Node.js installed on your computer.

Click on the picture below to watch a short video on how to use this:
[![How this works](http://img.youtube.com/vi/HKjiKA-p6a0/0.jpg)](http://www.youtube.com/watch?v=HKjiKA-p6a0)

Disclaimer
==========

The code is ported from the Android version of the Sony Remote API sample:
https://developer.sony.com/develop/cameras/get-started/

The purpose of writing the code was to enable clicking sequential photos using the camera over a long duration of time and also to serve as a PoC of writing apps using the SDK on a non-Android platform.

If you wish to simply use the Remote API, you can download and use the Sony Play Memories app.

Wishlist
========
The Play memories lacks the following features which would be very useful:

1. Switching to Manual Focus (though this is in part addressed by mapping the C2 button to focus mode selection while the Remote app is running).
2. Manual focus through the app (turning the lens motor while provided a zoomed view). This would be useful in cases where the camera is mounted beyond physical reach.
3. Repeated clicking at specified intervals (like in this sample). This would be useful for time-lapse stuff.