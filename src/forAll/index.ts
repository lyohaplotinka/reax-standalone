import forFunctional from '../forFunctional';
import forClasses from '../forClasses';
import { ReaxInstance, ReaxInstanceForAll } from '../types';

export default function forAll(store: ReaxInstance): ReaxInstanceForAll {
  return forClasses(forFunctional(store)) as ReaxInstanceForAll;
}
