/* eslint-disable import/first */
import path from 'path';
import fs from 'fs';

const esTempFile = `tmp${path.sep}main-es.json`;
const enTempFile = `tmp${path.sep}main-en.json`;

// import * as axios from 'axios';
import axios from 'axios';
import { DeeplAPI } from '../translate/providers/deepl-api';
import { DeepLResponse } from '../translate/payload';
import { Translate } from '../translate/translate';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Translate with deepl works correctly', () => {
    test('When translating json from ES to EN, they should have the same keys at the end', async () => {
        const deeplAPI = new DeeplAPI();
        deeplAPI.argv = {
            apiProvider: 'deepl',
            key: 'test',
            region: '',
            filePath: path.resolve(__dirname, esTempFile),
            dirPath: '',
            from: '',
            to: 'en',
            override: false,
            baseName: 'main-',
            testKeys: false
        };
        fs.copyFileSync(
            path.resolve(__dirname, 'main-en.json'),
            path.resolve(__dirname, enTempFile)
        );
        fs.copyFileSync(
            path.resolve(__dirname, 'main-es.json'),
            path.resolve(__dirname, esTempFile)
        );
        mockedAxios.post.mockResolvedValue({
            data: {
                translations: [
                    {
                        text: `This line is not in the other file${Translate.sentenceDelimiter}si${Translate.sentenceDelimiter}This line is not in the other file either`
                    }
                ]
            }
        } as DeepLResponse);
        await deeplAPI.translate();
        expect(fs.readFileSync(path.resolve(__dirname, enTempFile), 'utf-8')).toEqual(
            JSON.stringify(
                {
                    translation: {
                        example: 'Hello, this is an example',
                        'not-found': 'This line is not in the other file',
                        complex: {
                            inner: 'si'
                        }
                    },
                    'not-found-either': 'This line is not in the other file either'
                },
                null,
                4
            )
        );
    });
});
