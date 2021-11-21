import { useLayoutEffect, useState, useRef } from 'preact/hooks';
import forFunctionalCore from '../core';
export default function forFunctional(store) {
    const hooks = { useLayoutEffect, useRef, useState };
    return forFunctionalCore(store, hooks);
}
