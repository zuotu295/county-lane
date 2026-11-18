import assert from 'node:assert/strict';
import { deploy } from '../scripts/deploy.mjs';
import { calldataAddress, read, signer, submit } from '../scripts/studionet.mjs';

const [organizer, first, second, outside] = await Promise.all([
  signer(process.env.STUDIONET_PRIVATE_KEY), signer(), signer(), signer(),
]);
const { address, evidence } = await deploy(organizer);
const transactions = { deploy: evidence };
const send = async (label, client, method, args, error) => {
  transactions[label] = await submit(client, address, method, args, label, error);
};
const guest = (client) => calldataAddress(client.account.address);
const booking = (client) => read(address, 'get_booking', [guest(client)]);
const dc = () => read(address, 'capacity', ['11001']);

await send('authorizeFirst', organizer, 'authorize', [guest(first), 388977, -770365]);
await send('authorizeSecond', organizer, 'authorize', [guest(second), 388900, -770260]);
await send('authorizeOutside', organizer, 'authorize', [guest(outside), 388800, -771000]);
await send('reserveFirst', first, 'reserve', []);
assert.deepEqual(await dc(), { limit: 1, used: 1 });
assert.equal((await booking(first)).county, '11001');

await Promise.all([
  send('rejectFull', second, 'reserve', [], /No slot available for county 11001/),
  send('rejectOutside', outside, 'reserve', [], /No slot available for county 51013/),
  send('rejectDuplicate', first, 'reserve', [], /live authorization is required/),
]);
assert.equal((await booking(second)).state, 'AUTHORIZED');
assert.equal((await booking(outside)).state, 'AUTHORIZED');
const afterRejectedReservations = await dc();
assert.deepEqual(afterRejectedReservations, { limit: 1, used: 1 });

await send('releaseFirst', first, 'release', [guest(first)]);
assert.deepEqual(await dc(), { limit: 1, used: 0 });
await send('reserveSecond', second, 'reserve', []);
const snapshots = {
  afterRejectedReservations,
  dc: await dc(),
  first: await booking(first),
  second: await booking(second),
  outside: await booking(outside),
};
assert.deepEqual(snapshots.dc, { limit: 1, used: 1 });
assert.equal(snapshots.first.state, 'RELEASED');
assert.equal(snapshots.second.state, 'RESERVED');
assert.equal(snapshots.second.county, '11001');
assert.equal(snapshots.outside.state, 'AUTHORIZED');
console.log(JSON.stringify({ chainId: 61999, address, transactions, snapshots }, null, 2));
