---
title: "What I learned building MCP servers"
date: 2025-06-01 22:16
categories: dev
tags: ["mcp"]
---

# MCP

Two months after Anthropic published their famous protocol, called "Model Context Protocol", I got really enthusiastic about it. There were bunch of companies who developed fancy infra chatbot in AWS Summit Seoul 2024. I thought it's finally the time we can jump between the gap at once. I got so excited that I shared what I learned about MCP to my colleagues, did demo using it with Cursor and even built two MCP servers(which I opensourced[[1]](https://github.com/yangkyeongmo/mcp-server-apache-airflow)[[2]](https://github.com/yangkyeongmo/mcp-server-openmetadata)) that we might find useful. The whole spotlight around MCP seems to be settled down a lot, but I wanted to share about, including but not limited to, MCP and my journey through it.

MCP looks really cool because it's an API in essence. While we could deframe it saying MCP is just a wrapper around existing system, I'd say that's the beauty of it. LLMs are just mathematical models. They're given some initial states and we push them to do something useful by feeding quality data, then they do become something useful. But they're still just a model, not a whole system. MCP bridges the gap between the models and our existing computational world.

Previously, integrating existing system was only for developers. Developers used LangChain(or LangGraph in these days) to create complex LLM workflow and embed calls into the workflow. It not only incurs additional workload to people, but the thing gets redundant too. Imagine there are hundreds of developer implementing the effectively same thing over and over.

MCP reduces the redundancy caused from lack of common protocol. If a developer or a company shows a MCP server implementation, then, voila, you don't have to develop the same thing again. It's like connector pattern from other software engineering domains, like Kafka Connectors in Kafka.

There were such things like MCP indeed, ChatGPT Apps for example. However using the framework was too bounded to one platform. Like such, there were some approaches. But MCP has gone viral so much since its reveal. My guess is: 1. It's open source 2. It's client-server model, which leverages well developed existing model 3. It's extremely generic. Also, there's one more reason.. it just makes sense.

Anthropic has open sourced their implementations. Traditionally giving something away free has given a unique benefit compared to closed-sourcing, fast distribution. It's a protocol anyways. If they want it to be a standard, people should be using it. Just like HTTP. Imagine there wasn't a RFC for HTTP. Who could implement it by themselves and make http server framework? So, open sourcing was a great idea. I guess they didn't have other choices though.

MCP is using client-server model. I assumed this must have attributed to its success quite much because that's extremely general. So, you have an existing system? Wrap it with a server! It's that easy. This model has prevailed since the very start of IT industry. The way MCP client is viewing MCP server is just like how a server would view a database. MCP server is an interface to its data, so it's effectively a database for LLMs, or MCP clients to be specific. This explains how MCP is extremely generic too. Just think how variant server and databases there are.

## Limitations

However, the more I used MCP I found there's still a room for development. 1. It's hard to make it work as intended. 2. Implementing a server was harder than I thought. 3. It's hard to pass company's security check.

Adding a bunch of MCP servers to a MCP client doesn't guarantee flawless execution as user's intention. A MCP server provides a list of tools, resources or else with description embedded to themselves. MCP client knows what tools it can use because MCP servers are registered to it. However, there's a limit like other techs. If you're familiar with LLMs these days, you might be familiar with context limit too. Some models claim to be consistent even with 3M token window, but shorter is always better. You might wonder how we can tell LLMs to use tool. To my surprise, there isn't a magic behind. MCP client just passes list of tools to LLM and let it choose. As far as I know it's the similar way how function call works in other frameworks. What this imply is too many tools integrated might hinder model's performance, and also the model might not be able to choose the right tool for user's intention. This must be the reason why MCP client often doesn't find right tool at right moment.

While I started to build a new MCP server, which are [mcp-server-apache-airflow](https://github.com/yangkyeongmo/mcp-server-apache-airflow) and [mcp-server-openmetadata](https://github.com/yangkyeongmo/mcp-server-openmetadata), it wasn't like one-click development. There were many errors and things weren't documented right. When I used other MCP servers, I noticed there's hidden message types like `server/notification` and it was hard to navigate to a reference documenting it.

Besides MCP not having a security protocol, which I heard to be under development, adding MCP server to an agent itself becomes a security threat. Let's say your company has google workspace and Slack. You've given read and write permission to each MCP server that handles each service, because that sounds convenient. You told the agent, "Let my colleagues know about \<top secret document>." That's a very exaggerated example, but even if you prompt engineered so well the agent understood what "my colleague" is and which Slack channel they dwell on, problem is that since LLM is stochastic we can't be sure what's doing to happen. If the agent couldn't find the channel, what's it going to do?

Things get worse if MCP server is attached to a fully autonomous agent. Even if you're not an ill-hearted worker who want to share company secret outside, there's a risk for making a non-security reviewed path with potential of taking literally everything out of a company. If it's given enough permission, they might also "delete" everything. 

My advice on this is to attach MCP server only to predictable agents or provide only necessary permissions to API tokens used for integration. If the agent can only read, not write or delete the data, then some problem is resolved.

# Personal Lessons

Other than MCP itself, I learned the importance of minding ROI. If you look at MCP servers other than I developed, you could see they received many stars. More stars for more popular services. So mind your ROI. Seriously. Resource for building a MCP server, to a backend engineer like me, was effectively nothing. If I had tuned my interest to other popular services then I might have got more stars.

It's a really interesting time to live. Developers like me are still fearful whether AI is really going to take over our jobs. But from engineer's perspective the growth of the tech is fascinating. It's almost blinding my eyes. This mindset has driven me to writing this article, what MCP is and its limitations too. While it feels like standing on a rope tied between skyscrapers and trying to cross on it, it's fortunate to live a time like this.
