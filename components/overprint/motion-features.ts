// Its own module so the dynamic import in motion-root.tsx pulls in only
// these animation features, not the whole "motion/react" barrel.
import { domMax } from "motion/react";

export default domMax;
