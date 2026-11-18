# CountyLane

CountyLane allocates limited appointment or pickup capacity across U.S. counties. An organizer authorizes a particular participant wallet for a public service point. The participant claims their slot, and the contract resolves the county from the preselected point. Programs can configure per-county quotas without trusting the applicant or a booking frontend to supply jurisdiction labels.

## Contract interface

| Call | Behavior |
| --- | --- |
| Constructor `(counties, limits)` | Fix 1–16 unique five-digit county GEOIDs and their positive quotas. |
| `authorize(guest, latitude_e4, longitude_e4)` | Organizer binds a wallet to a four-decimal coordinate. |
| `reserve()` | Authorized guest requests a county slot at that point. |
| `release(guest)` | Guest or organizer cancels authorization or frees the reserved slot and point. |
| `get_booking(guest)` | Read participant status, authorized point, and assigned county. |
| `capacity(county)` | Read configured limit and current occupancy. |

Coordinates are signed integer degrees multiplied by 10,000, in latitude/longitude order. For example, `388977, -770365` corresponds to 38.8977°, −77.0365°.

## Consensus and invariants

The state sequence is `AUTHORIZED → RESERVED → RELEASED`, with direct release also allowed from `AUTHORIZED`. The organizer may issue another authorization after release. Only the authorized wallet can reserve, and the same coordinate cannot occupy two simultaneous slots. A quota failure retains the authorization so the guest can retry when capacity becomes available.

On reservation, GenLayer validators independently query the Census Bureau coordinate GeoLookup for the frozen coordinates, using the `Public_AR_Census2020` benchmark and `Census2020_Census2020` vintage. They require exactly one valid county GEOID and agree using `gl.eq_principle.strict_eq`. The canonical result drives which quota is checked and debited. Out-of-scope or full counties fail without consuming capacity. Release credits the originally assigned county and clears the same coordinate in one transaction.

A coordinate identifies an authorized **service location**. This model relies on the organizer for participant eligibility and does not attest to identity, residence or physical presence. The four-decimal inputs and Census 2020 boundary model define the precision and vintage. Use public service locations because coordinates and wallet addresses are public. Operators can deploy a separate instance for each program or capacity period and reconcile slots via the view methods.

[U.S. Census Geocoding Services API](https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html)

## Stable Studionet

Chain 61999 · RPC `https://studio.genlayer.com/api` · Node.js 24 · `genlayer-js@1.1.8`.

```sh
npm ci
STUDIONET_FAUCET=1 npm run deploy
STUDIONET_FAUCET=1 npm run test:studionet
npm run verify
```

For a reusable deployment, set `STUDIONET_PRIVATE_KEY` in the environment to a funded Studionet key you control and run `npm run deploy -- '["11001","51013"]' '[3,2]'`. The public evidence deployment used disposable test wallets.

The test deploys with one slot for GEOID 11001, uses an organizer and three distinct participant wallets, verifies a successful reservation, checks full-capacity, out-of-scope and duplicate failures, and confirms slot reuse after release. Successful writes must be both finalized and successful. Rejected claims are finalized execution errors. All state readbacks use the finalized state boundary.

The test demonstrates signed calls and address serialization. For a reviewer read, call `await read(address, 'capacity', ['11001'])` with the exported helper in `scripts/studionet.mjs`.

[Studionet evidence](EVIDENCE.md)
