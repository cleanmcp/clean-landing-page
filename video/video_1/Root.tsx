import React from "react";
import { Composition } from "remotion";
import { SyncedContext } from "./SyncedContext";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SyncedContext"
        component={SyncedContext}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

