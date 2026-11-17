import { Fragment } from "react";
import { groupLatinConjunctions, isLatinList, shouldIsolateLatin, splitLatinRuns } from "@shared/bidi";
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
      {groupLatinConjunctions(splitLatinRuns(text)).map((part, index) => {
        if (!part.ltr) {
          return <Fragment key={index}>{part.text}</Fragment>;
        }
        const bdi = (
          <bdi dir="ltr" className={part.segments || isLatinList(part.text) ? "bdi-list" : undefined}>
            {part.segments
              ? part.segments.map((segment, segmentIndex) =>
                  segment.isolate ? (
                    <bdi dir="ltr" key={segmentIndex}>
                      {segment.text}
                    </bdi>
                  ) : (
                    <Fragment key={segmentIndex}>{segment.text}</Fragment>
                  )
                )
              : part.text}
          </bdi>
        );
        if (!part.trailing) return <Fragment key={index}>{bdi}</Fragment>;
        const list = Boolean(part.segments) || isLatinList(part.text);
        if (list) {
          return (
            <Fragment key={index}>
              {bdi}
              {part.trailing}
            </Fragment>
          );
        }
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
