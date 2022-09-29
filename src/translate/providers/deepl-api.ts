import axios, { AxiosRequestConfig } from 'axios';
import { decode, encode } from 'html-entities';
import { DeepLResponse, JSONObj } from '../payload';
import { Translate } from '../translate';
import querystring from 'querystring';

export class DeeplAPI extends Translate {
    private static readonly endpoint: string = 'api-free.deepl.com';

    protected callTranslateAPI = async (
        valuesForTranslation: string[],
        originalObject: JSONObj,
        saveTo: string
    ): Promise<void> => {
        const axiosConfig: AxiosRequestConfig = {
            headers: {
                Authorization: `DeepL-Auth-Key ${this.argv.key}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            responseType: 'json'
        };

        const response = await axios.post(
            `https://${DeeplAPI.endpoint}/v2/translate`,
            querystring.stringify({
                text: encode(valuesForTranslation.join(Translate.sentenceDelimiter)),
                source_lang: this.argv.from.toUpperCase(),
                target_lang: this.argv.to.toUpperCase()
            }),
            axiosConfig
        );
        const value = (response as DeepLResponse).data.translations[0].text;
        this.saveTranslation(decode(value), originalObject, saveTo);
    };
}
