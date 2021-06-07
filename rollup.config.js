import typescript from "@rollup/plugin-typescript";
import {terser} from 'rollup-plugin-terser'

export default [
    {
        input: 'src/index.ts',
        external: ['react'],
        plugins: [
            typescript(),
        ],
        output: {
            dir: 'dist'
        }
    }
]
