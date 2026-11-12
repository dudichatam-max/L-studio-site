import { Fragment } from "react";
import { isLatinList, shouldIsolateLatin, splitLatinRuns } from "@shared/bidi";
import type { Language } from "@shared/seo";

type Props = {
  text: string;
  language?: Language;
  rtl?: boolean;
};

export function BidiText({ text, language, rtl }: Props) {
  const isolate = shouldIsolateLatin(language ?? "", rtl);
  if (!isolate) return <>{text}</>;
  return (
    <>
      {splitLatinRuns(text).map((part, index) => {
        if (!part.ltr) {
          return <Fragment key={index}>{part.text}</Fragment>;
        }
        const bdi = (
          <bdi dir="ltr" className={isLatinList(part.text) ? "bdi-list" : undefined}>
            {part.text}
          </bdi>
        );
        if (!part.trailing) return <Fragment key={index}>{bdi}</Fragment>;
        return (
          <span className="bdi-attach" key={index}>
            {bdi}
            {part.trailing}
          </span>
        );
      })}
    </>
  );
}
