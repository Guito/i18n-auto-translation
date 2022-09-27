#!/usr/bin/env node
import { argv } from './translate/cli';
import { TranslateSupplier } from './translate/translate-supplier';

try {
    const provider = TranslateSupplier.getProvider(argv.apiProvider);
    provider.argv = argv;
    provider.translate();
} catch (e) {
    if (e instanceof Error) console.log(e.message);
    else console.log(e);
}
