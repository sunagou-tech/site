"use client";

import { SectionBlock, SiteConfig } from "@/types/site";
import HeroBlockComponent from "./HeroBlock";
import AboutBlockComponent from "./AboutBlock";
import WhyBlockComponent from "./WhyBlock";
import ServicesBlockComponent from "./ServicesBlock";
import ContactBlockComponent from "./ContactBlock";
import FooterBlockComponent from "./FooterBlock";
import SplitBlockComponent from "./SplitBlock";
import FullscreenBgBlockComponent from "./FullscreenBgBlock";
import GalleryBlockComponent from "./GalleryBlock";
import HeroSplitBlockComponent from "./HeroSplitBlock";
import HeroVideoBlockComponent from "./HeroVideoBlock";
import HeroInteractiveBlockComponent from "./HeroInteractiveBlock";
import StatsBlockComponent from "./StatsBlock";
import FeaturesBlockComponent from "./FeaturesBlock";
import FAQBlockComponent from "./FAQBlock";
import TeamBlockComponent from "./TeamBlock";
import TestimonialsBlockComponent from "./TestimonialsBlock";
import CTABlockComponent from "./CTABlock";
import HeroCenteredBlockComponent from "./HeroCenteredBlock";
import HeroMinimalBlockComponent from "./HeroMinimalBlock";
import LogoCloudBlockComponent from "./LogoCloudBlock";
import StepsBlockComponent from "./StepsBlock";
import PricingBlockComponent from "./PricingBlock";
import NewsBlockComponent from "./NewsBlock";
import TimelineBlockComponent from "./TimelineBlock";
import TwoColCtaBlockComponent from "./TwoColCtaBlock";
import NewsletterBlockComponent from "./NewsletterBlock";
import TabsBlockComponent from "./TabsBlock";
import MarqueeTextBlockComponent from "./MarqueeTextBlock";
import VideoBlockComponent from "./VideoBlock";
import ComparisonBlockComponent from "./ComparisonBlock";
import ImageGridBlockComponent from "./ImageGridBlock";
import BannerBlockComponent from "./BannerBlock";
import ColumnBlockComponent from "./ColumnBlock";
import HeroGradientBlockComponent from "./HeroGradientBlock";
import HeroGlassBlockComponent from "./HeroGlassBlock";
import HeroTypoBlockComponent from "./HeroTypoBlock";
import HeroAsymBlockComponent from "./HeroAsymBlock";
import HeroPhotoBlockComponent from "./HeroPhotoBlock";
import HeroDarkBlockComponent from "./HeroDarkBlock";
import HeroMosaicBlockComponent from "./HeroMosaicBlock";
import HeroJapaneseBlockComponent from "./HeroJapaneseBlock";
import HeroDiagonalBlockComponent from "./HeroDiagonalBlock";
import ProblemBlockComponent from "./ProblemBlock";
import SolutionBlockComponent from "./SolutionBlock";
import FreeBlockComponent from "./FreeBlock";
import HeroGameBlockComponent from "./HeroGameBlock";
import HeroReelBlockComponent from "./HeroReelBlock";
import HeroSlideBlockComponent from "./HeroSlideBlock";

interface Props {
  block: SectionBlock;
  config: SiteConfig;
  onChange: (block: SectionBlock) => void;
}

export default function BlockRenderer({ block, config, onChange }: Props) {
  switch (block.type) {
    case "hero":
      return <HeroBlockComponent block={block} config={config} onChange={onChange} />;
    case "about":
      return <AboutBlockComponent block={block} config={config} onChange={onChange} />;
    case "why":
      return <WhyBlockComponent block={block} config={config} onChange={onChange} />;
    case "services":
      return <ServicesBlockComponent block={block} config={config} onChange={onChange} />;
    case "contact":
      return <ContactBlockComponent block={block} config={config} onChange={onChange} />;
    case "footer":
      return <FooterBlockComponent block={block} config={config} onChange={onChange} />;
    case "split":
      return <SplitBlockComponent block={block} config={config} onChange={onChange} />;
    case "fullscreen-bg":
      return <FullscreenBgBlockComponent block={block} config={config} onChange={onChange} />;
    case "gallery":
      return <GalleryBlockComponent block={block} config={config} onChange={onChange} />;
    case "hero-split":
      return <HeroSplitBlockComponent block={block} config={config} onChange={onChange} />;
    case "hero-video":
      return <HeroVideoBlockComponent block={block} config={config} onChange={onChange} />;
    case "hero-interactive":
      return <HeroInteractiveBlockComponent block={block} config={config} onChange={onChange} />;
    case "stats":
      return <StatsBlockComponent block={block} config={config} onChange={onChange} />;
    case "features":
      return <FeaturesBlockComponent block={block} config={config} onChange={onChange} />;
    case "faq":
      return <FAQBlockComponent block={block} config={config} onChange={onChange} />;
    case "team":
      return <TeamBlockComponent block={block} config={config} onChange={onChange} />;
    case "testimonials":
      return <TestimonialsBlockComponent block={block} config={config} onChange={onChange} />;
    case "cta":
      return <CTABlockComponent block={block} config={config} onChange={onChange} />;
    case "hero-centered":
      return <HeroCenteredBlockComponent block={block} config={config} onChange={onChange} />;
    case "hero-minimal":
      return <HeroMinimalBlockComponent block={block} config={config} onChange={onChange} />;
    case "logo-cloud":
      return <LogoCloudBlockComponent block={block} config={config} onChange={onChange} />;
    case "steps":
      return <StepsBlockComponent block={block} config={config} onChange={onChange} />;
    case "pricing":
      return <PricingBlockComponent block={block} config={config} onChange={onChange} />;
    case "news":
      return <NewsBlockComponent block={block} config={config} onChange={onChange} />;
    case "timeline":
      return <TimelineBlockComponent block={block} config={config} onChange={onChange} />;
    case "two-col-cta":
      return <TwoColCtaBlockComponent block={block} config={config} onChange={onChange} />;
    case "newsletter":
      return <NewsletterBlockComponent block={block} config={config} onChange={onChange} />;
    case "tabs":
      return <TabsBlockComponent block={block} config={config} onChange={onChange} />;
    case "marquee-text":
      return <MarqueeTextBlockComponent block={block} config={config} onChange={onChange} />;
    case "video":
      return <VideoBlockComponent block={block} config={config} onChange={onChange} />;
    case "comparison":
      return <ComparisonBlockComponent block={block} config={config} onChange={onChange} />;
    case "image-grid":
      return <ImageGridBlockComponent block={block} config={config} onChange={onChange} />;
    case "banner":
      return <BannerBlockComponent block={block} config={config} onChange={onChange} />;
    case "column":
      return <ColumnBlockComponent block={block} config={config} onChange={onChange} />;
    case "hero-gradient":
      return <HeroGradientBlockComponent block={block} config={config} onChange={onChange} />;
    case "hero-glass":
      return <HeroGlassBlockComponent block={block} config={config} onChange={onChange} />;
    case "hero-typo":
      return <HeroTypoBlockComponent block={block} config={config} onChange={onChange} />;
    case "hero-asym":
      return <HeroAsymBlockComponent block={block} config={config} onChange={onChange} />;
    case "hero-photo":
      return <HeroPhotoBlockComponent block={block} config={config} onChange={onChange} />;
    case "hero-dark":
      return <HeroDarkBlockComponent block={block} config={config} onChange={onChange} />;
    case "hero-mosaic":
      return <HeroMosaicBlockComponent block={block} config={config} onChange={onChange} />;
    case "hero-japanese":
      return <HeroJapaneseBlockComponent block={block} config={config} onChange={onChange} />;
    case "hero-diagonal":
      return <HeroDiagonalBlockComponent block={block} config={config} onChange={onChange} />;
    case "problem":
      return <ProblemBlockComponent block={block} config={config} onChange={onChange} />;
    case "solution":
      return <SolutionBlockComponent block={block} config={config} onChange={onChange} />;
    case "free":
      return <FreeBlockComponent block={block} config={config} onChange={onChange} />;
    case "hero-game":
      return <HeroGameBlockComponent block={block} config={config} onChange={onChange} />;
    case "hero-reel":
      return <HeroReelBlockComponent block={block} config={config} onChange={onChange} />;
    case "hero-slide":
      return <HeroSlideBlockComponent block={block} config={config} onChange={onChange} />;
    default:
      return null;
  }
}
