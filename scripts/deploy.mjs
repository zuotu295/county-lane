import { pathToFileURL } from 'node:url';
import { makeDeployment, signer } from './studionet.mjs';

export const deploy = (organizer, counties = ['11001'], quotas = [1]) => makeDeployment(
  organizer, new URL('../contracts/county_lane.py', import.meta.url), [counties, quotas], 'CountyLane',
);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [counties = '["11001"]', quotas = '[1]'] = process.argv.slice(2);
  console.log(JSON.stringify(await deploy(await signer(process.env.STUDIONET_PRIVATE_KEY), JSON.parse(counties), JSON.parse(quotas)), null, 2));
}
