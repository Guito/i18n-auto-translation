import { AzureOfficialAPI } from './providers/azure-official-api';
import { AzureRapidAPI } from './providers/azure-rapid-api';
import { DeepRapidAPI } from './providers/deep-rapid-api';
import { GoogleOfficialAPI } from './providers/google-official-api';
import { JustRapidAPI } from './providers/just-rapid-api';
import { LectoRapidAPI } from './providers/lecto-rapid-api';
import { LingvanexRapidAPI } from './providers/lingvanex-rapid-api';
import { NLPRapidAPI } from './providers/nlp-rapid-api';
import { Translate } from './translate';
import { DeeplAPI } from './providers/deepl-api';

interface Providers {
    'google-official': GoogleOfficialAPI;
    'azure-official': AzureOfficialAPI;
    'azure-rapid': AzureRapidAPI;
    'deep-rapid': DeepRapidAPI;
    deepl: DeeplAPI;
    'just-rapid': JustRapidAPI;
    'lecto-rapid': LectoRapidAPI;
    'lingvanex-rapid': LingvanexRapidAPI;
    'nlp-rapid': NLPRapidAPI;
}

export class TranslateSupplier {
    private static readonly providers: Providers = {
        'google-official': new GoogleOfficialAPI(),
        'azure-official': new AzureOfficialAPI(),
        'azure-rapid': new AzureRapidAPI(),
        'deep-rapid': new DeepRapidAPI(),
        deepl: new DeeplAPI(),
        'just-rapid': new JustRapidAPI(),
        'lecto-rapid': new LectoRapidAPI(),
        'lingvanex-rapid': new LingvanexRapidAPI(),
        'nlp-rapid': new NLPRapidAPI()
    };

    public static getProvider = (provider: string): Translate =>
        TranslateSupplier.providers[provider as keyof Providers];
}
