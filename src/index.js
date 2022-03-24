#!/usr/bin/env node

const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const returnObj = [];

const result = (args) => cp.spawnSync('git', args,
{
    stdio: 'pipe',
});

const packageInfo = (info) => cp.spawnSync('node', [`-p`, `require('./package.json').${ info }`],
{
    stdio: 'pipe',
});

const versions = result(["tag"])
    .stdout
    .toString()
    .split('\n')
    .sort((a, b) => a - b);

const releaseList = versions.map((version, i) =>
{
    if(version !== '')
    {
        const releases = version.slice(1).split(".");
        const major = releases[0];
        const minor = releases[1];
        const patch = releases[2];

        return {
            major, 
            minor, 
            patch
        };
    }
});

if(releaseList[releaseList.length] === undefined)
{
    releaseList.pop();
}


const formatVersionCollections = () =>
{
    for (let i = 0; i < releaseList.length; i++)
    {
        let dt;
        let cm;

        if(i === 0)
        {
            dt = result(["log", `v${ releaseList[i].major }.${ releaseList[i].minor }.${ releaseList[i].patch }`, "--pretty=format:%s"]).stdout.toString();

            cm = {
                tag: `v${ releaseList[i].major }.${ releaseList[i].minor }.${ releaseList[i].patch }`,
                notes: dt.split('\n')
            }
            
        }
            else
        {
            dt = result(["log", `v${ releaseList[i - 1].major }.${ releaseList[i - 1].minor }.${ releaseList[i - 1].patch }...v${ releaseList[i].major }.${ releaseList[i].minor }.${ releaseList[i].patch }`, "--pretty=format:%s"]).stdout.toString();

            cm = {
                tag: `v${ releaseList[i].major }.${ releaseList[i].minor }.${ releaseList[i].patch }`,
                notes: dt.split('\n')
            }
        }

        returnObj.push(cm);
    }
}

formatVersionCollections();

const createFile = () =>
{
    const data = {
        title: packageInfo("name").stdout.toString().replace('\n', ''),
        packageVersion: packageInfo("version").stdout.toString().replace('\n', ''),
        versions: returnObj
    }

    fs.writeFile("./changelog.json", JSON.stringify(data, null, 4), (err) => {
        if (err) {
            console.error(err);
            return;
        };
        console.log("Changelog updated!");
    });
}

createFile();
