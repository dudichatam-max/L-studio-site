import { BidiText } from "./BidiText";
import type { FeatureBlock } from "@shared/prerender";
import type { Language } from "@shared/seo";

type Props = {
  feature: FeatureBlock;
  language: Language;
  rtl: boolean;
};

export function DrumsCopy({ feature, language, rtl }: Props) {
  const groups = feature.styleGroups ?? [];
  return (
    <div className="drums-copy">
      {feature.lead ? (
        <p>
          <BidiText text={feature.lead} language={language} rtl={rtl} />
        </p>
      ) : null}
      {feature.stylesLead ? (
        <p>
          <BidiText text={feature.stylesLead} language={language} rtl={rtl} />
        </p>
      ) : null}
      {groups.length > 0 ? (
        <ul className="drums-style-groups">
          {groups.map(group => (
            <li key={group.genre}>
              <b>
                <bdi dir="ltr">{group.genre}</bdi>
              </b>
              <span className="drums-style-chips">
                {group.styles.map(style => (
                  <span key={style}>
                    <bdi dir="ltr">{style}</bdi>
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      ) : feature.body ? (
        <p>
          <BidiText text={feature.body} language={language} rtl={rtl} />
        </p>
      ) : null}
      {feature.channels ? (
        <p>
          <BidiText text={feature.channels} language={language} rtl={rtl} />
        </p>
      ) : null}
      {feature.packs ? (
        <p>
          <BidiText text={feature.packs} language={language} rtl={rtl} />
        </p>
      ) : null}
    </div>
  );
}
