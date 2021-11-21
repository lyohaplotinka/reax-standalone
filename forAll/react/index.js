import forFunctional from '../../forFunctional/react';
import forClasses from '../../forClasses';
export default function forAll(store) {
    return forClasses(forFunctional(store));
}
