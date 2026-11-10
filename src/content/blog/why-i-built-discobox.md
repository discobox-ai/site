---
title: Why I built discobox
description: I run a handful of agents on my laptop every day. This is what that looks like, and what I will not hand an agent without a box around it.
author: Darren Shepherd
slug: why-i-built-discobox
published: 2026-11-10
draft: true
---

I use discobox one to one, every day, on my own laptop. Not as a platform, not
as a factory: one person, a few agents, and a stream of diffs to read.

My afternoon looks like this. In the morning I started three or four boxes from
whatever repository I am in, one per thing on my list: a bug someone filed
overnight, the feature I actually want to be working on, and an idea I am not
sure about. By the afternoon they have each opened a pull request. I read them
the way I read anyone's, merge the ones that are right, and throw away the one
that showed me the idea was wrong. That last one is the point. An experiment I
can discard for free is an experiment I will actually run.

There are things I do not trust an agent with. My checkout, because I am
working in it. My browser, because it is logged in to everything I have. And
my keys, because an agent that can read a token can paste it anywhere. I also
do not want to approve every command it runs, because then I am the agent.

The box is how I get both. Inside it the agent has everything: sudo, Docker,
a desktop and a browser of its own, and its own clone of the code. Nothing it
does touches my files or my tabs. My credentials never go in at all; it gets a
stand-in, and the proxy on the way out swaps in the real one only for the hosts
I said it could talk to. So I can let it run without watching, and still sleep.

If that sounds like how you want to work, [try it](/try/). It takes about ten
minutes.
