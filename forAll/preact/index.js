import forFunctional from '../../forFunctional/preact';
import forClasses from '../../forClasses';
export default function forAll(store) {
    return forClasses(forFunctional(store));
}
