"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-shadow */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/prefer-includes */
/* eslint-disable @typescript-eslint/no-for-in-array */
const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
function createMessage(pytestResult) {
    const file = fs.readFileSync(pytestResult);
    const newString = new String(file);
    const lineOfText = newString.split('\n');
    let startKey = '0';
    let newMessage = '### :white_check_mark: Result of Pytest Coverage\n';
    let lastMessage = '';
    let delLine = '';
    for (const i in lineOfText) {
        if (lineOfText[i].indexOf('coverage: platform') >= 0) {
            startKey = i;
            newMessage += `\n${lineOfText[i]}\n`;
            delete lineOfText[i];
            const iNext = parseInt(i) + 1;
            delLine = iNext.toString();
            newMessage +=
                '| Name | Stmts | Miss | Cover |\n| :--- | ----: | ---: | ----: |\n';
        }
        if (i === delLine) {
            delete lineOfText[i];
        }
        if (startKey !== '0' && lineOfText[i] !== undefined) {
            if (lineOfText[i].indexOf('---------------------------------------------------------') >= 0) {
                delete lineOfText[i];
            }
            else if (lineOfText[i].indexOf('passed in') >= 0) {
                lastMessage += `\n~${lineOfText[i].replace(/=/g, '')}~`;
                delete lineOfText[i];
            }
            if (lineOfText[i] !== undefined) {
                const tabOfText = lineOfText[i].split(/\s+/);
                for (const t in tabOfText) {
                    if (tabOfText[t] !== '') {
                        tabOfText[t] = `| ${tabOfText[t]}`;
                    }
                    else {
                        delete tabOfText[t];
                    }
                }
                if (tabOfText[3] !== undefined) {
                    newMessage += `${tabOfText[0] + tabOfText[1] + tabOfText[2] + tabOfText[3]}|\n`;
                }
            }
        }
    }
    return newMessage + lastMessage;
}
function run() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        core.info(github.context.eventName);
        if (['pull_request', 'pull_request_target'].indexOf(github.context.eventName) == -1) {
            core.info('Comment only will be created on pull requests!');
            return;
        }
        const githubToken = core.getInput('token');
        const pytestFileName = core.getInput('pytest-coverage');
        const message = createMessage(pytestFileName);
        const context = github.context;
        const pullRequestNumber = (_a = context.payload.pull_request) === null || _a === void 0 ? void 0 : _a.number;
        const octokit = github.getOctokit(githubToken);
        // Now decide if we should issue a new comment or edit an old one
        const { data: comments } = yield octokit.issues.listComments(Object.assign(Object.assign({}, context.repo), { issue_number: pullRequestNumber !== null && pullRequestNumber !== void 0 ? pullRequestNumber : 0 }));
        const comment = comments.find((comment) => {
            return (comment.user.login === 'github-actions[bot]' &&
                comment.body.startsWith('### :white_check_mark: Result of Pytest Coverage\n'));
        });
        if (comment) {
            yield octokit.issues.updateComment(Object.assign(Object.assign({}, context.repo), { comment_id: comment.id, body: message }));
        }
        else {
            yield octokit.issues.createComment(Object.assign(Object.assign({}, context.repo), { issue_number: pullRequestNumber !== null && pullRequestNumber !== void 0 ? pullRequestNumber : 0, body: message }));
        }
    });
}
// eslint-disable-next-line github/no-then
run().catch(error => core.setFailed(`Workflow failed! ${error.message}`));
