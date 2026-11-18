# Stable Studionet evidence

- Contract — [`0x62a07cbF65c395AF3429F4ad07cf9F7C9E0aC8Ca`](https://explorer-studio.genlayer.com/address/0x62a07cbF65c395AF3429F4ad07cf9F7C9E0aC8Ca)
- Network — chain ID `61999`, RPC `https://studio.genlayer.com/api`
- Source SHA-256 — `0b01d9138bc9cc082a05f068a9548a7ada6d833e8fecceb10627513e496e140c`

The first participant occupies the sole slot in GEOID 11001. A second eligible participant is refused while full. The separately authorized outside location resolves to GEOID 51013, which has no configured slot. Release makes the first slot available for the second participant.

| Case | Transaction | Finality | Execution | Validator agreement |
| --- | --- | --- | --- | --- |
| deploy | [`0x75f80695a4…6fbdb8`](https://explorer-studio.genlayer.com/tx/0x75f80695a484fe5c0f5f4dac180e66cf76aa4618335fee206f596e13426fbdb8) | FINALIZED | SUCCESS | 3 agree, MAJORITY_AGREE |
| authorizeFirst | [`0x351562165d…80a7c4`](https://explorer-studio.genlayer.com/tx/0x351562165d638d8d68d9d45a3da2c659414d91e74cec7711e4de0430e580a7c4) | FINALIZED | SUCCESS | 3 agree, MAJORITY_AGREE |
| authorizeSecond | [`0x9c5a8353e0…5de3cd`](https://explorer-studio.genlayer.com/tx/0x9c5a8353e0c0697e2e111541d655d1e6aa7fa464cb959cf331b3ba43575de3cd) | FINALIZED | SUCCESS | 3 agree, MAJORITY_AGREE |
| authorizeOutside | [`0xd5ad6be648…7606d5`](https://explorer-studio.genlayer.com/tx/0xd5ad6be6482cb8562ebb4ec873c06fa7407e2c62c78ce685402490a8547606d5) | FINALIZED | SUCCESS | 4 agree, MAJORITY_AGREE |
| reserveFirst | [`0x237eeb4697…380cfc`](https://explorer-studio.genlayer.com/tx/0x237eeb469711bc412cd7ce1ff9218ead9ef893cec8f95916b0ce8cc2b6380cfc) | FINALIZED | SUCCESS | 3 agree, MAJORITY_AGREE |
| rejectFull | [`0x17b6bd0aa5…612bc6`](https://explorer-studio.genlayer.com/tx/0x17b6bd0aa5c8e8bd410e4926d08077977f4ebce11b06f84bc6493be5e7612bc6) | FINALIZED | ERROR | 3 agree, MAJORITY_AGREE |
| rejectOutside | [`0x003f1aa29a…b07cea`](https://explorer-studio.genlayer.com/tx/0x003f1aa29aac73cbd2ca5229c4857e63c916e16c48952044ff9f414514b07cea) | FINALIZED | ERROR | 3 agree, MAJORITY_AGREE |
| rejectDuplicate | [`0x15d0fe6ddf…cfe9d1`](https://explorer-studio.genlayer.com/tx/0x15d0fe6ddf0cd5bfce941abce9040388dc9ea850373cfe20eae2ea458bcfe9d1) | FINALIZED | ERROR | 3 agree, MAJORITY_AGREE |
| releaseFirst | [`0x7f0972d2c4…3681c3`](https://explorer-studio.genlayer.com/tx/0x7f0972d2c48d8ca36545e9aceecf24a7e92076a6d513374a5cb98576c23681c3) | FINALIZED | SUCCESS | 3 agree, MAJORITY_AGREE |
| reserveSecond | [`0x2322863e21…61f249`](https://explorer-studio.genlayer.com/tx/0x2322863e21153c49cbe105431a9d8178cef0266e9c37df1ed8087912a261f249) | FINALIZED | SUCCESS | 3 agree, MAJORITY_AGREE |

Expected business-rule rejections have finalized receipts with an execution error. Their exact messages and the finalized state readbacks are recorded in [EVIDENCE.json](EVIDENCE.json).

Run `npm ci` and `npm run verify` to compare the deployed byte-for-byte source, re-fetch each transaction, decode the actual equivalence results, and reproduce the final public reads. Intermediate readbacks are produced by the integration test immediately after the relevant finalized transactions.
