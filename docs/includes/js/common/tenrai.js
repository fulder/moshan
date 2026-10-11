import {request} from './http.js';

// Tenrai rate limits parallel calls, so its requests go one at a time
let tenraiQueue = Promise.resolve();
export function tenrai(path) {
  const result = tenraiQueue.then(async () => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await request(`https://api.tenrai.org/v1/anime/${path}`);
      } catch (error) {
        if (error.status !== 429 || attempt >= 3) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
      }
    }
  });
  tenraiQueue = result.catch(() => {});
  return result;
}
