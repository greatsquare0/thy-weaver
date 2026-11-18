---
"@thy-weaver/core": patch
---

Fix `weaver setup --clean-setup` (only `-c` was recognized), and `?raw` imports ignoring the encoding: both `?raw&encoding=latin1` and `?raw?encoding=latin1` now work (the old misspelled `enconding` is still accepted). Read errors other than a missing file are now reported instead of crashing the plugin
