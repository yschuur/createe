import type { CSSProperties } from "react";

type AboutCollageProps = {
  image: string;
  alt: string;
  detail: string;
  detailAlt: string;
  imageStyle?: CSSProperties | undefined;
  detailStyle?: CSSProperties | undefined;
};

/** Shared art-directed image composition for both CREATEE editorial pages. */
export function AboutCollage({ image, alt, detail, detailAlt, imageStyle, detailStyle }: AboutCollageProps) {
  return <div className="about-collage">
    <div className="about-collage-main">{image && <img src={image} alt={alt} style={imageStyle} fetchPriority="high" />}</div>
    <div className="about-collage-detail">{detail && <img src={detail} alt={detailAlt} style={detailStyle} />}</div>
    <div className="about-collage-mark" aria-hidden="true" />
  </div>;
}
