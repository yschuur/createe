type AboutCollageProps = {
  image: string;
  alt: string;
  detail: string;
  detailAlt: string;
};

/** Shared art-directed image composition for both CREATEE editorial pages. */
export function AboutCollage({ image, alt, detail, detailAlt }: AboutCollageProps) {
  return <div className="about-collage">
    <div className="about-collage-main"><img src={image} alt={alt} fetchPriority="high" /></div>
    <div className="about-collage-detail"><img src={detail} alt={detailAlt} /></div>
    <div className="about-collage-mark" aria-hidden="true" />
  </div>;
}