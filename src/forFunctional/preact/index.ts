import { useLayoutEffect, useState, useRef } from 'preact/hooks';
import forFunctionalCore from '../core';
import { ReaxInstance } from '../../types';
import { FrameworkHooksObject } from '../core/types';

export default function forFunctional(store: ReaxInstance) {
  const hooks: FrameworkHooksObject = { useLayoutEffect, useRef, useState };
  return forFunctionalCore(store, hooks);
}
