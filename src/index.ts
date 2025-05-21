import { SteadFast } from "./services/steadfast";

function main() {
  const steadfast = new SteadFast('your@email.com', 'your-password');

  steadfast.check('01000000000').then(console.log).catch(console.error);
}

main();
