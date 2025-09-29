
import { customAlphabet } from "nanoid";

const nanoidObject = customAlphabet("abcdefghijklmnopqrstuvwxyz1234567890", 3);

export const objectID = (prefix) => prefix + "_" + nanoidObject();
