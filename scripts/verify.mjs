import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { abi } from 'genlayer-js';
import { calldataAddress, read, reader, verify } from './studionet.mjs';

const evidence = JSON.parse(await readFile(new URL('../EVIDENCE.json', import.meta.url), 'utf8'));
const { address, chainId, transactions, snapshots } = evidence;
assert.equal(chainId, 61999);
assert.equal(Number(await reader.request({ method: 'eth_chainId' })), chainId);

const expectedObservations = {
  reserveFirst: '11001',
  rejectFull: '11001',
  rejectOutside: '51013',
  reserveSecond: '11001',
};

for (const [name, row] of Object.entries(transactions)) {
  const live = await verify(row.hash, row.error);
  assert.equal(live.state, row.state, name);
  assert.equal(live.execution, row.execution, name);
  assert.equal(live.consensus, row.consensus, name);
  assert.ok(Object.values(live.votes || {}).filter((vote) => vote === 'agree').length >= 2, name);
  const receipt = await reader.getTransaction({ hash: row.hash });
  const target = name === 'deploy' ? receipt.data?.contract_address : receipt.to_address ?? receipt.recipient;
  assert.equal(target?.toLowerCase(), address.toLowerCase(), name);
  if (expectedObservations[name]) {
    const leader = receipt.consensus_data.leader_receipt.find((entry) => entry.mode === 'leader');
    const outputs = Object.values(leader.eq_outputs || {});
    assert.equal(outputs.length, 1, name + ' equivalence output');
    const value = Buffer.from(typeof outputs[0] === 'string' ? outputs[0] : outputs[0].raw, 'base64');
    assert.equal(value[0], 0, name + ' observation returned');
    assert.equal(abi.calldata.decode(value.subarray(1)), expectedObservations[name], name + ' agreed observation');
  }
}

const local = await readFile(new URL('../contracts/county_lane.py', import.meta.url), 'utf8');
assert.equal(await reader.getContractCode(address), local, 'deployed source');
assert.deepEqual(await read(address, 'capacity', ['11001']), snapshots.dc);
assert.deepEqual(await read(address, 'capacity', ['51013']), { limit: 0, used: 0 });
for (const [role, transaction] of Object.entries({ first: 'reserveFirst', second: 'reserveSecond', outside: 'rejectOutside' })) {
  const receipt = await reader.getTransaction({ hash: transactions[transaction].hash });
  const guest = calldataAddress(receipt.from_address ?? receipt.sender);
  assert.deepEqual(await read(address, 'get_booking', [guest]), snapshots[role]);
}
console.log('Verified deployed source, finalized receipts and final capacity and booking states.');
