import sdk from "./1-initialize-sdk.js";
import { readFileSync } from "fs";

const editionDrop = sdk.getEditionDrop("0x1d8DEAABa02D93c9C5Df2dAE28274ec745e25DeB");

(async () => {
  try {
    await editionDrop.createBatch([
      {
        name: "DAO Cigar Limited Edition",
        description: "This cigar NFT will give you access to Cigar DAO! The standard dimensions are 7 inches by 47 ring gauge.",
        image: readFileSync("scripts/assets/DAO-cigar-limited.png"),
      },
    ]);
    console.log("✅ Successfully created a new NFT in the drop!");
  } catch (error) {
    console.error("failed to create the new NFT", error);
  }
})();