import { Fragment } from "react";
import { shouldIsolateLatin, splitLatinRuns } from "@shared/bidi";
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
      {splitLatinRuns(text).map((part, index) =>
        part.ltr ? (
          <bdi dir="ltr" key={index}>
            {part.text}
          </bdi>
        ) : (
          <Fragment key={index}>{part.text}</Fragment>
        )
      )}
    </>
  );
}
