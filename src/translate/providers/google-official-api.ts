import { Translate as GoogleTranslate } from '@google-cloud/translate/build/src/v2';
import { decode, encode } from 'html-entities';
import { argv } from '../cli';
import { JSONObj } from '../payload';
import { Translate } from '../translate';

interface ErrorResponse {
    response: { statusCode: number; statusMessage: string };
    errors: [{ message: string }];
}

export class GoogleOfficialAPI extends Translate {
    protected callTranslateAPI = async (
        valuesForTranslation: string[],
        originalObject: JSONObj,
        saveTo: string
    ): Promise<void> => {
        const response = await new GoogleTranslate({ key: argv.key }).translate(
            encode(valuesForTranslation.join(Translate.sentenceDelimiter)),
            {
                from: argv.from,
                to: argv.to
            }
        );
        const value = response[0];
        this.saveTranslation(decode(value), originalObject, saveTo);
    };
}
