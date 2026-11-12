---
title: "Benchmark coming out lower after splitting Typescript into multiple files"
date: 2026-02-11 15:00
categories: dev
tags: ["performance"]
layout: post
lang: en
locale: en_US
ref: typescript-file-split-benchmark
permalink: /en/typescript-file-split-benchmark.html
machine_translated: true
original_url: /typescript-file-split-benchmark.html
---

A phenomenon where performance dropped after splitting the scripts into multiple files in a CSS parser..??
- How about connecting to a local server, running parse several times on the same site, then collecting execution time via logs? I think I'll be able to confirm whether performance actually dropped. Collect statistical figures.
	- If I were to do it..
		- Inside the stylesheet processing function set start/end time before and after start, and put a float in a log file
			- (Could also put it in a different file per CSS)
		- Run the local server
		- Run an example site, set the domain
		- Collect data while refreshing (assumption that variance will be small since the range of CSS that runs would be limited)
		- Statistical analysis of the collected data - mean, stdev, p50, p99, p999
- After splitting, have I ever compared the performance of the pre-split version and csstree?
	- Split version vs pre-split version vs csstree
```
✓ Core Operations - Baseline 6730ms
     name                                      hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · tokenize - 1KB CSS                 49,405.69  0.0164  0.3661  0.0202  0.0199  0.0355  0.0579  0.1511  ±0.48%    24703
   · unsplit tokenize - 1KB CSS   54,789.94  0.0148  0.2394  0.0183  0.0182  0.0281  0.0372  0.1392  ±0.41%    27396
   · parse - 1KB CSS                    13,225.53  0.0549  4.8883  0.0756  0.0670  0.1406  0.1705  2.9978  ±5.26%     6613
   · unsplit parse - 1KB CSS      41,056.65  0.0199  0.3160  0.0244  0.0241  0.0382  0.0656  0.1926  ±0.51%    20529
   · csstree parse - 1KB CSS            13,738.37  0.0570  0.5432  0.0728  0.0735  0.1020  0.1504  0.2764  ±0.43%     6870
   · generate - 1KB AST                 58,436.16  0.0141  0.4674  0.0171  0.0169  0.0280  0.0435  0.1348  ±0.49%    29219
   · unsplit generate - 1KB AST   58,647.22  0.0142  0.2253  0.0171  0.0170  0.0222  0.0286  0.1221  ±0.39%    29324
   · csstree generate - 1KB AST         63,290.74  0.0135  0.2494  0.0158  0.0157  0.0200  0.0245  0.0882  ±0.31%    31646
   · walk - 1KB AST                    249,850.56  0.0034  0.5423  0.0040  0.0040  0.0050  0.0055  0.0157  ±0.29%   124926
   · unsplit walk - 1KB AST      252,214.09  0.0034  0.0935  0.0040  0.0040  0.0049  0.0051  0.0146  ±0.14%   126108
   · csstree walk - 1KB AST             42,875.87  0.0155  3.5211  0.0233  0.0182  0.1065  0.2110  1.0915  ±3.82%    21438
```
- The parser got especially slow. The others are to a degree you can let slide.. they did get slower, though.
	- Don't tell me it gets better if I reduce imports?
		- If that's the case it would be a problem of the benchmark code
		- Is there no other benchmark framework?
```
✓ Core Operations - Baseline 6735ms
     name                                      hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · tokenize - 1KB CSS                 68,563.76  0.0119  0.2123  0.0146  0.0146  0.0217  0.0293  0.1129  ±0.37%    34282
   · unsplit tokenize - 1KB CSS   55,575.69  0.0148  0.2602  0.0180  0.0182  0.0232  0.0283  0.1075  ±0.33%    27788
   · parse - 1KB CSS                    29,989.49  0.0185  6.4975  0.0333  0.0243  0.0898  0.1399  2.3937  ±7.27%    14995
   · unsplit parse - 1KB CSS      42,017.72  0.0197  0.2293  0.0238  0.0238  0.0287  0.0373  0.1680  ±0.43%    21009
   · csstree parse - 1KB CSS            14,114.10  0.0579  0.3375  0.0709  0.0725  0.0841  0.0909  0.1451  ±0.28%     7058
   · generate - 1KB AST                 59,300.46  0.0141  0.3340  0.0169  0.0167  0.0216  0.0287  0.1235  ±0.41%    29651
   · unsplit generate - 1KB AST   59,956.96  0.0140  0.2238  0.0167  0.0167  0.0208  0.0241  0.0896  ±0.32%    29979
   · csstree generate - 1KB AST         65,712.18  0.0133  0.2287  0.0152  0.0153  0.0180  0.0212  0.0722  ±0.25%    32857
   · walk - 1KB AST                    243,734.22  0.0034  4.2963  0.0041  0.0039  0.0126  0.0127  0.0135  ±2.06%   121868
   · unsplit walk - 1KB AST      255,145.85  0.0033  0.5161  0.0039  0.0039  0.0047  0.0050  0.0143  ±0.24%   127573
   · csstree walk - 1KB AST             52,870.65  0.0160  0.3952  0.0189  0.0190  0.0280  0.0372  0.0883  ±0.32%    26436
```
- I reduced imports and it actually got better..?!
```
✓ Core Operations - Baseline 6730ms
     name                                      hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · tokenize - 1KB CSS                 70,587.00  0.0118  0.1710  0.0142  0.0143  0.0183  0.0225  0.0905  ±0.28%    35294
   · unsplit tokenize - 1KB CSS   55,293.99  0.0149  0.1951  0.0181  0.0182  0.0246  0.0303  0.1076  ±0.32%    27648
   · parse - 1KB CSS                    30,563.71  0.0183  8.8594  0.0327  0.0241  0.0872  0.1185  2.3404  ±7.91%    15282
   · unsplit parse - 1KB CSS      42,015.35  0.0196  0.2888  0.0238  0.0241  0.0294  0.0351  0.1467  ±0.40%    21008
   · csstree parse - 1KB CSS            13,818.62  0.0589  0.4234  0.0724  0.0730  0.0908  0.1420  0.2845  ±0.43%     6910
   · generate - 1KB AST                 60,047.01  0.0142  0.1985  0.0167  0.0167  0.0205  0.0240  0.0970  ±0.28%    30024
   · unsplit generate - 1KB AST   60,217.62  0.0142  0.2339  0.0166  0.0167  0.0202  0.0225  0.0957  ±0.30%    30109
   · csstree generate - 1KB AST         59,270.96  0.0146  0.2392  0.0169  0.0170  0.0211  0.0242  0.0510  ±0.27%    29636
   · walk - 1KB AST                    256,761.41  0.0034  0.5234  0.0039  0.0039  0.0041  0.0046  0.0079  ±0.21%   128381
   · unsplit walk - 1KB AST      258,398.11  0.0033  0.6104  0.0039  0.0039  0.0043  0.0048  0.0088  ±0.24%   129200
   · csstree walk - 1KB AST             53,216.63  0.0160  0.0909  0.0188  0.0192  0.0220  0.0250  0.0365  ±0.10%    26609
```
- Moved types and it got a bit better.
- Sometimes the split one's performance comes out higher.
	- Should I try increasing the benchmark time a bit more?
	- If it doesn't get verified here I'll try a browser test, and if even then it doesn't, I'll have no choice but to do it as one file..

```
✓ Core Operations - Baseline 67378ms
     name                                      hz     min      max    mean     p75     p99    p995    p999     rme  samples
   · tokenize - 1KB CSS                 68,703.12  0.0117   0.8580  0.0146  0.0146  0.0206  0.0290  0.1159  ±0.13%   343516
   · unsplit tokenize - 1KB CSS   52,879.59  0.0148  11.3851  0.0189  0.0183  0.0341  0.0569  0.1484  ±0.75%   264398
   · parse - 1KB CSS                    42,495.64  0.0171   6.7236  0.0235  0.0212  0.0730  0.1133  0.2963  ±1.09%   212479
   · unsplit parse - 1KB CSS      39,765.45  0.0201   4.3439  0.0251  0.0244  0.0471  0.0816  0.1800  ±0.45%   198828
   · csstree parse - 1KB CSS            13,954.94  0.0581   2.7289  0.0717  0.0704  0.1590  0.2040  0.3600  ±0.31%    69775
   · generate - 1KB AST                 57,935.34  0.0140  15.3746  0.0173  0.0167  0.0327  0.0473  0.1501  ±0.73%   289677
   · unsplit generate - 1KB AST   59,584.92  0.0139   1.2257  0.0168  0.0166  0.0229  0.0422  0.1052  ±0.13%   297925
   · csstree generate - 1KB AST         59,006.01  0.0145   0.3388  0.0169  0.0169  0.0214  0.0264  0.0856  ±0.09%   295031
   · walk - 1KB AST                    253,285.25  0.0033   0.3166  0.0039  0.0040  0.0046  0.0049  0.0124  ±0.04%  1266427
   · unsplit walk - 1KB AST      236,849.12  0.0033   8.3706  0.0042  0.0040  0.0052  0.0125  0.0352  ±0.89%  1184246
   · csstree walk - 1KB AST             51,653.22  0.0156  27.7234  0.0194  0.0187  0.0291  0.0523  0.1168  ±1.31%   258267
```
- I increased the benchmark time to 5 seconds and warmup to 1 second, and the difference shrank a lot or the current version was actually better.
	- If I reduce the time more, there seems to be some variance per run.
- 


	- Should I try putting the tokenizer inside the parser to reduce imports?
	- If I copy it in as-is, is it the same?
	- Is it the same if I do it with jsdom?
	- Is there a difference when creating the Parser class?
```
· parse - premade Parser - 1KB CSS                31,316,788.87  0.0000  4.8605  0.0000  0.0000  0.0001  0.0001   0.0002   ±2.77%  15658395
   · unsplit parse - premade Parser - 1KB CSS  36,786,837.12  0.0000  0.6995  0.0000  0.0000  0.0001  0.0001   0.0001   ±0.47%  18393419
```
- I created the Parser class in advance and tested, and looking at these numbers alone the split one is slower. But hz is in the 30 million range and mean comes out as 0.0000, so it's unrealistically fast to see it as the result of actually parsing 1KB CSS. I need to look again at what this bench measured, and when I increased the bench time above the difference shrank or the current version was even better, so it's still hard to draw a conclusion.
