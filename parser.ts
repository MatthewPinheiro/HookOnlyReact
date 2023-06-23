import * as fs from 'fs'
import { parse } from 'node-html-parser';
import type { Node } from 'node-html-parser';


const JSX_STRING = /\(\s*(<.*)>\s*\)/gs
const JSX_INTERPOLATION = /\{([a-zA-Z0-9]+)\}/gs
const QUOTED_STRING = /["|'](.*)["|']/gs

function getAttrs(attrsStr: string) {
    if (attrsStr.trim().length == 0) return {};
    const objAttrs: Record<string, string> = {};
    const parts = attrsStr.split(" ");

    parts.forEach(p => {
        const [name, value] = p.split("=")
        console.log(name)
        console.log(value)
        objAttrs[name] = (value)
    })
    return objAttrs
}

function parseText(txt: string) {
    let interpolations = txt.match(JSX_INTERPOLATION)
    if (!interpolations) {
        console.log("no inerpolation found: ", txt);
        return txt;
    } else {
        console.log("inerpolation found!", txt);
        txt = replaceInterpolations(txt);
        // interpolations.shift()
        // interpolations.forEach( v => {
        //     txt = txt.replace(`{${v}}`, `" + (${v}) + "`)
        // })
        return `"${txt}"`
    }
}

function replacer(k: string, v: any) {
    if (k) {
        let quoted = QUOTED_STRING.exec(v)
        if (quoted) {
            return parseText(quoted[1])
        }
        return (v)
    } else {
        return v
    }
}

function replaceInterpolations(txt: string, isOnJSON = false) {
    let interpolations = null;

    while (interpolations = JSX_INTERPOLATION.exec(txt)) {
        console.log("fixing interpolation for ", txt)
        console.log(interpolations)
        if (isOnJSON) {
            txt = txt.replace(`"{${interpolations[1]}}"`, interpolations[1])
        } else {
            txt = txt.replace(`{${interpolations[1]}}`, `"+ ${interpolations[1]} +"`)
        }
    }
    return txt
}



type NodeWithRaw = Node & { _rawText: string, rawAttrs: string, rawTagName: string };

function translate(root: NodeWithRaw): string | undefined | null {
    if (Array.isArray(root) && root.length == 0) return;
    console.log("Current root: ")
    console.log(root)
    const children = (root.childNodes.length > 0)
        ? root.childNodes.map(child => translate(child as NodeWithRaw)).filter(c => c != null)
        : [];
    if (root.nodeType == 3) { //Textnodes
        if (root._rawText.trim() === "") return null
        return parseText(root._rawText)

    }
    let tagName = root.rawTagName

    let opts = getAttrs(root.rawAttrs)
    console.log("Opts: ")
    console.log(opts)
    console.log(JSON.stringify(opts))

    return `[${tagName}, ${replaceInterpolations(JSON.stringify(opts, replacer), true)}, ${children}]`;
}

async function parseJSXFile(inputName: string, outputName: string) {
    let content = await fs.promises.readFile(inputName)
    let str = content.toString();

    let matches = JSX_STRING.exec(str)
    if (matches) {
        let HTML = matches[1] + ">"
        console.log("parsed html");
        console.log(HTML);
        const root = parse(HTML);
        //console.log(root.firstChild)
        let translated = (translate(root.firstChild as NodeWithRaw));
        console.log(translated);
        str = str.replace(matches[1] + ">", translated as string);
        await fs.promises.writeFile(outputName, str);
    }

}

(async () => {
    await parseJSXFile("./example.jsx", "./dist.js");
})();