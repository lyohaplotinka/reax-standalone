import forFunctional from '../forFunctional';
import forClasses from '../forClasses';
export default function forAll(store) {
    return forClasses(forFunctional(store));
}
