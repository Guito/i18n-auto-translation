import { AxiosError } from 'axios';
import { addedDiff, deletedDiff } from 'deep-object-diff';
import fs from 'fs';
import glob from 'glob';
import extend from 'just-extend';
import path from 'path';
import { Arguments } from './cli';
import { JSONObj } from './payload';

export abstract class Translate {
    public get argv(): Arguments {
        return this._argv as Arguments;
    }

    public set argv(value: Arguments) {
        this._argv = value;
    }
    static readonly sentenceDelimiter: string = '\n{|}\n';
    private _argv: Arguments | undefined;
    private keys = {
        toAdd: {},
        toDelete: {}
    };

    public translate = (): void => {
        if (this.argv.filePath && this.argv.dirPath)
            throw new Error('You should only provide a single file or a directory.');

        if (!this.argv.filePath && !this.argv.dirPath)
            throw new Error('You must provide a single file or a directory.');

        if (this.argv.dirPath) this.translateFiles(this.argv.dirPath);
        else if (this.argv.filePath) this.translateFile(this.argv.filePath);
    };

    public getKeys = () => {
        this.keys = {
            toAdd: {},
            toDelete: {}
        };
        this.argv.testKeys = true;
        if (this.argv.filePath && this.argv.dirPath)
            throw new Error('You should only provide a single file or a directory.');

        if (!this.argv.filePath && !this.argv.dirPath)
            throw new Error('You must provide a single file or a directory.');

        if (this.argv.dirPath) this.translateFiles(this.argv.dirPath);
        else if (this.argv.filePath) this.translateFile(this.argv.filePath);
        return this.keys;
    };

    private translateFiles = (dirPath: string): void => {
        console.log('Finding files for translation...');
        const filePaths: string[] = glob.sync(`${dirPath}/**/${this.argv.from}.json`, {
            ignore: [`${dirPath}/**/node_modules/**`, `${dirPath}/**/dist/**`]
        });
        if (filePaths.length === 0) throw new Error(`0 files found for translation in ${dirPath}`);
        console.log(`${filePaths.length} files found.`);
        filePaths.forEach((filePath) => this.translateFile(filePath));
    };

    private translateFile = (filePath: string): void => {
        const fileForTranslation = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as JSONObj;
        const saveTo: string = path.join(
            path.dirname(filePath),
            `${this.argv.baseName}${this.argv.to}.json`
        );
        if (this.argv.override || !fs.existsSync(saveTo))
            this.translationDoesNotExists(fileForTranslation, saveTo);
        else this.translationAlreadyExists(fileForTranslation, saveTo);
    };

    private translationAlreadyExists(fileForTranslation: JSONObj, saveTo: string): void {
        const existingTranslation = JSON.parse(fs.readFileSync(saveTo, 'utf-8')) as JSONObj;
        this.deleteIfNeeded(fileForTranslation, existingTranslation, saveTo);
        this.translateIfNeeded(fileForTranslation, existingTranslation, saveTo);
    }

    private deleteIfNeeded = (
        fileForTranslation: JSONObj,
        existingTranslation: JSONObj,
        saveTo: string
    ): void => {
        const diffForDeletion: JSONObj = deletedDiff(
            existingTranslation,
            fileForTranslation
        ) as JSONObj;
        if (Object.keys(diffForDeletion).length === 0) {
            console.log(`There is nothing to delete in: ${saveTo}`);
            return;
        }
        if (this.argv.testKeys) {
            this.keys.toDelete = diffForDeletion;
            return;
        }
        if (Object.keys(diffForDeletion).length !== 0) {
            const content = extend(true, existingTranslation, diffForDeletion) as JSONObj;
            this.writeToFile(content, saveTo, `Unnecessary lines deleted for: ${saveTo}`);
        }
    };

    private translateIfNeeded = (
        fileForTranslation: JSONObj,
        existingTranslation: JSONObj,
        saveTo: string
    ): void => {
        const diffForTranslation: JSONObj = addedDiff(
            existingTranslation,
            fileForTranslation
        ) as JSONObj;
        if (Object.keys(diffForTranslation).length === 0) {
            console.log(`There is nothing to translate in: ${saveTo}`);
            return;
        }
        if (this.argv.testKeys) {
            this.keys.toAdd = diffForTranslation;
            return;
        }
        const valuesForTranslation: string[] = this.getValuesForTranslation(diffForTranslation);
        this.callTranslateAPI(valuesForTranslation, diffForTranslation, saveTo);
    };

    private translationDoesNotExists(fileForTranslation: JSONObj, saveTo: string): void {
        if (Object.keys(fileForTranslation).length === 0) {
            console.log(`Nothing to translate, file is empty: ${saveTo}`);
            return;
        }
        const valuesForTranslation: string[] = this.getValuesForTranslation(fileForTranslation);
        this.callTranslateAPI(valuesForTranslation, fileForTranslation, saveTo);
    }

    private getValuesForTranslation = (object: JSONObj): string[] => {
        const values: string[] = [];

        (function findValues(json: JSONObj): void {
            Object.values(json).forEach((value) => {
                if (typeof value === 'object') findValues(value);
                else values.push(value);
            });
        })(object);

        return values;
    };

    protected abstract callTranslateAPI: (
        valuesForTranslation: string[],
        originalObject: JSONObj,
        saveTo: string
    ) => Promise<void>;

    protected printAxiosError = (error: AxiosError, saveTo: string): void => {
        const errorFilePath = saveTo.replace(`${this.argv.to}.json`, `${this.argv.from}.json`);
        console.error(`Request error for file: ${errorFilePath}`);
        if (error.response?.status && error.response.statusText && error.response.data) {
            console.log(`Status Code: ${error.response?.status}`);
            console.log(`Status Text: ${error.response?.statusText}`);
            console.log(`Data: ${JSON.stringify(error.response?.data)}`);
        } else {
            console.log(error.message);
        }
    };

    protected saveTranslation = (value: string, originalObject: JSONObj, saveTo: string): void => {
        let content: JSONObj = this.createTranslatedObject(
            value.split(Translate.sentenceDelimiter.trim()),
            originalObject
        );
        let message: string = `File saved: ${saveTo}`;
        if (fs.existsSync(saveTo) && !this.argv.override) {
            const existingTranslation = JSON.parse(fs.readFileSync(saveTo, 'utf-8')) as JSONObj;
            content = extend(true, existingTranslation, content) as JSONObj;
            message = `File updated: ${saveTo}`;
        }
        this.writeToFile(content, saveTo, message);
    };

    private createTranslatedObject = (translations: string[], originalObject: JSONObj): JSONObj => {
        const translatedObject: JSONObj = { ...originalObject };
        let index: number = 0;

        (function addTranslations(json: JSONObj): void {
            Object.keys(json).forEach((key: string) => {
                if (typeof json[key] === 'object') addTranslations(json[key] as JSONObj);
                // eslint-disable-next-line no-param-reassign
                else json[key] = translations[index++]?.trim();
            });
        })(translatedObject);

        return translatedObject;
    };

    private writeToFile = (content: JSONObj, saveTo: string, message: string): void => {
        fs.writeFileSync(saveTo, JSON.stringify(content, null, 4));
        console.log(message);
    };
}
