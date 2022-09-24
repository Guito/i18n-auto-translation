import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { decode, encode } from 'html-entities';
import { argv } from '../cli';
import { DeepLResponse, JSONObj } from '../payload';
import { Translate } from '../translate';

export class DeeplAPI extends Translate {
  private static readonly endpoint: string = 'api-free.deepl.com';
  private static readonly axiosConfig: AxiosRequestConfig = {
    headers: {
      Authorization: `DeepL-Auth-Key ${argv.key}`,
      'Content-type': 'application/json',
    },
    responseType: 'json',
  };

  protected callTranslateAPI = (
    valuesForTranslation: string[],
    originalObject: JSONObj,
    saveTo: string
  ): void => {
    axios
      .post(
        `https://${DeeplAPI.endpoint}/v2/translate`,
        {
          text: encode(valuesForTranslation.join(Translate.sentenceDelimiter)),
          source_lang: argv.from.toUpperCase(),
          target_lang: argv.to.toUpperCase(),
        },
        DeeplAPI.axiosConfig
      )
      .then((response) => {
        const value = (response as DeepLResponse).data.translations.text;
        this.saveTranslation(decode(value), originalObject, saveTo);
      })
      .catch((error) => this.printAxiosError(error as AxiosError, saveTo));
  };
}
