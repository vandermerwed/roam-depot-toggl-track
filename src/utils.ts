import { BlockRefernce, Block } from "./type";

export function randomInt(range: number) {
    const sign = Math.round(Math.random()) * 2 - 1;
    const abs = Math.floor(Math.random() * range);
    return sign * abs;
}

export function getBlockContent(blockReference: BlockRefernce) : Block {    
    return window.roamAlphaAPI
                 .q(`[:find (pull ?page [:block/string])
                      :where [?page :block/uid "${blockReference["block-uid"]}"]  ]`
                    )[0][0] as Block;
}

