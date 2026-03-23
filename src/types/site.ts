export type FontFamily = "sans" | "serif" | "mono";

// ─── ユーティリティ ────────────────────────────────────────────
export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

// ─── サービスブロック用のサブ型 ────────────────────────────────
export interface ServiceSub {
  label: string;
  items: [string, string];
}
export interface Service {
  num: string;
  tag: string;
  title: string;
  subtitle: string;
  desc: string;
  subs: [ServiceSub, ServiceSub, ServiceSub];
  figColors: string[];
  imageUrl: string; // 空文字のときはイラストプレースホルダーを表示
}

// ─── ギャラリー画像 ────────────────────────────────────────────
export interface GalleryImage {
  id: string;
  url: string;
  caption: string;
  span: "normal" | "wide" | "tall";
}

// ─── セクションブロック型（判別共用体） ────────────────────────

export interface HeroBlock {
  id: string;
  type: "hero";
  tagline: string;
  taglineSub: string;
  buttonText: string;
  buttonUrl: string;
}

export interface AboutBlock {
  id: string;
  type: "about";
  heading: string;
  body: string;
  buttonText: string;
  buttonUrl: string;
}

export interface WhyBlock {
  id: string;
  type: "why";
  label: string;
  body1: string;
  body2: string;
  imageUrl: string;
}

export interface ServicesBlock {
  id: string;
  type: "services";
  services: [Service, Service, Service];
}

export interface ContactBlock {
  id: string;
  type: "contact";
  heading: string;
  desc: string;
  buttonUrl: string;
}

export interface FooterBlock {
  id: string;
  type: "footer";
  companyName: string;
  address: string;
}

export interface SplitBlock {
  id: string;
  type: "split";
  heading: string;
  subheading: string;
  body: string;
  imageUrl: string;
  imagePosition: "left" | "right";
  buttonText: string;
  buttonUrl: string;
}

export interface FullscreenBgBlock {
  id: string;
  type: "fullscreen-bg";
  heading: string;
  subheading: string;
  body: string;
  imageUrl: string;
  buttonText: string;
  buttonUrl: string;
}

export interface GalleryBlock {
  id: string;
  type: "gallery";
  heading: string;
  subheading: string;
  images: GalleryImage[];
}

// ─── 追加ブロック型 ────────────────────────────────────────────

export interface StatItem { value: string; label: string; suffix: string; }
export interface StatsBlock {
  id: string;
  type: "stats";
  heading: string;
  items: [StatItem, StatItem, StatItem, StatItem];
}

export interface FeatureItem { emoji: string; title: string; desc: string; }
export interface FeaturesBlock {
  id: string;
  type: "features";
  heading: string;
  subheading: string;
  items: [FeatureItem, FeatureItem, FeatureItem, FeatureItem, FeatureItem, FeatureItem];
}

export interface FAQItem { question: string; answer: string; }
export interface FAQBlock {
  id: string;
  type: "faq";
  heading: string;
  items: FAQItem[];
}

export interface TeamMember { name: string; role: string; bio: string; imageUrl: string; }
export interface TeamBlock {
  id: string;
  type: "team";
  heading: string;
  subheading: string;
  members: TeamMember[];
}

export interface TestimonialItem { quote: string; name: string; role: string; }
export interface TestimonialsBlock {
  id: string;
  type: "testimonials";
  heading: string;
  items: TestimonialItem[];
}

export interface CTABlock {
  id: string;
  type: "cta";
  heading: string;
  body: string;
  buttonText: string; buttonUrl: string;
  buttonText2: string; buttonUrl2: string;
}

// ─── 追加ブロック型（第2弾） ───────────────────────────────────

/** 中央揃えヒーロー + 背景画像 */
export interface HeroCenteredBlock {
  id: string; type: "hero-centered";
  eyebrow: string;
  tagline: string;
  body: string;
  buttonText: string; buttonUrl: string;
  buttonText2: string; buttonUrl2: string;
  imageUrl: string;
}

/** ミニマルヒーロー（シンプル白背景） */
export interface HeroMinimalBlock {
  id: string; type: "hero-minimal";
  eyebrow: string;
  tagline: string;
  body: string;
  buttonText: string;
  buttonUrl: string;
}

/** クライアントロゴ一覧 */
export interface LogoItem { name: string; }
export interface LogoCloudBlock {
  id: string; type: "logo-cloud";
  heading: string;
  logos: LogoItem[];
}

/** ステップ・プロセス説明 */
export interface StepItem { number: string; title: string; desc: string; }
export interface StepsBlock {
  id: string; type: "steps";
  heading: string;
  subheading: string;
  items: StepItem[];
}

/** 料金プラン */
export interface PricingPlan {
  name: string; price: string; period: string; desc: string;
  features: string[]; highlighted: boolean; buttonText: string; buttonUrl: string;
}
export interface PricingBlock {
  id: string; type: "pricing";
  heading: string; subheading: string;
  plans: [PricingPlan, PricingPlan, PricingPlan];
}

/** ニュース・ブログカード */
export interface NewsItem { date: string; category: string; title: string; excerpt: string; imageUrl: string; articleId: string; }
export interface NewsBlock {
  id: string; type: "news";
  heading: string; subheading: string;
  viewAllUrl: string;
  items: NewsItem[];
}

/** 沿革・タイムライン */
export interface TimelineItem { year: string; title: string; desc: string; }
export interface TimelineBlock {
  id: string; type: "timeline";
  heading: string;
  items: TimelineItem[];
}

/** 2列CTA（法人向け/個人向けなど） */
export interface TwoColCtaBlock {
  id: string; type: "two-col-cta";
  leftHeading: string; leftBody: string; leftButtonText: string; leftButtonUrl: string;
  rightHeading: string; rightBody: string; rightButtonText: string; rightButtonUrl: string;
}

/** メルマガ・リード獲得 */
export interface NewsletterBlock {
  id: string; type: "newsletter";
  heading: string; body: string;
  placeholder: string; buttonText: string;
}

/** タブ切り替えコンテンツ */
export interface TabItem { label: string; heading: string; body: string; imageUrl: string; }
export interface TabsBlock {
  id: string; type: "tabs";
  heading: string;
  items: TabItem[];
}

/** スクロールテキストマーキー */
export interface MarqueeTextBlock {
  id: string; type: "marquee-text";
  items: string[];
}

/** 動画セクション */
export interface VideoBlock {
  id: string; type: "video";
  heading: string; body: string;
  videoUrl: string; thumbnailUrl: string;
}

/** 機能比較表 */
export interface ComparisonRow { feature: string; us: string; them: string; }
export interface ComparisonBlock {
  id: string; type: "comparison";
  heading: string; ourLabel: string; competitorLabel: string;
  rows: ComparisonRow[];
}

/** 画像グリッド（ポートフォリオ） */
export interface ImageGridItem { imageUrl: string; title: string; tag: string; }
export interface ImageGridBlock {
  id: string; type: "image-grid";
  heading: string; subheading: string;
  items: ImageGridItem[];
}

/** お知らせバナー */
export interface BannerBlock {
  id: string; type: "banner";
  label: string; text: string; linkText: string;
}

/** コラム一覧（config.articlesを自動表示） */
export interface ColumnBlock {
  id: string; type: "column";
  heading: string;
  subheading: string;
  maxItems: number;          // 表示件数
  viewAllUrl: string;
  viewAllText: string;
  layout: "grid" | "list";  // グリッドorリスト
}

/** パターンH: 大文字装飾 + エディトリアルタイポグラフィ */
export interface HeroTypoBlock {
  id: string; type: "hero-typo";
  kanjiDecor: string;          // 背景の装飾文字（例: "革新"）
  eyebrow: string;
  tagline: string;
  taglineSub: string;
  body: string;
  buttonText: string; buttonUrl: string;
}

/** パターンI: 左カラー帯 + 右写真の非対称スプリット */
export interface HeroAsymBlock {
  id: string; type: "hero-asym";
  eyebrow: string;
  tagline: string;
  body: string;
  buttonText: string; buttonUrl: string;
  imageUrl: string;
  accentWord: string;          // タイトルの中でアクセントカラーにする単語
}

/** パターンJ: フルブリード写真 + フローティングテキスト */
export interface HeroPhotoBlock {
  id: string; type: "hero-photo";
  imageUrl: string;
  eyebrow: string;
  tagline: string;
  body: string;
  buttonText: string; buttonUrl: string;
  caption: string; // 右下の写真キャプション
}

/** パターンK: ダーク・ラグジュアリー */
export interface HeroDarkBlock {
  id: string; type: "hero-dark";
  imageUrl: string;
  eyebrow: string;
  tagline: string;
  body: string;
  buttonText: string; buttonUrl: string;
  stat1Value: string; stat1Label: string;
  stat2Value: string; stat2Label: string;
}

/** パターンL: モザイク写真グリッド */
export interface HeroMosaicBlock {
  id: string; type: "hero-mosaic";
  eyebrow: string;
  tagline: string;
  body: string;
  buttonText: string; buttonUrl: string;
  image1: string; image2: string; image3: string; image4: string;
}

/** パターンM: 日本的ミニマル */
export interface HeroJapaneseBlock {
  id: string; type: "hero-japanese";
  imageUrl: string;
  kanjiLarge: string;  // 大きな漢字一文字
  taglineJp: string;   // 日本語キャッチコピー
  taglineEn: string;   // 英語サブコピー
  body: string;
  buttonText: string; buttonUrl: string;
}

/** パターンN: 斜めカット・ダイナミック */
export interface HeroDiagonalBlock {
  id: string; type: "hero-diagonal";
  imageUrl: string;
  eyebrow: string;
  tagline: string;
  body: string;
  buttonText: string; buttonUrl: string;
  buttonText2: string; buttonUrl2: string;
}

/** パターンF: グラデーション + フローティング実績カード */
export interface HeroGradientStat { value: string; label: string; }
export interface HeroGradientBlock {
  id: string; type: "hero-gradient";
  eyebrow: string;
  tagline: string;
  body: string;
  buttonText: string; buttonUrl: string;
  buttonText2: string; buttonUrl2: string;
  stats: HeroGradientStat[];
}

/** パターンG: フルスクリーン画像 + グラスモーフィズムカード */
export interface HeroGlassBlock {
  id: string; type: "hero-glass";
  imageUrl: string;
  eyebrow: string;
  tagline: string;
  body: string;
  buttonText: string; buttonUrl: string;
  scrollLabel: string;
}

// ─── 新ヒーローテンプレート ────────────────────────────────────

/** パターンA: 左画像 / 右グラデーション+白文字 */
export interface HeroSplitBlock {
  id: string;
  type: "hero-split";
  tagline: string;
  taglineSub: string;
  body: string;
  buttonText: string;
  buttonUrl: string;
  imageUrl: string;
}

/** パターンB: 動画背景 + 大タイポグラフィ */
export interface HeroVideoBlock {
  id: string;
  type: "hero-video";
  videoUrl: string;
  tagline: string;
  taglineSub: string;
  buttonText: string;
  buttonUrl: string;
}

/** パターンC: マウス追従インタラクティブシェイプ */
export interface HeroInteractiveBlock {
  id: string;
  type: "hero-interactive";
  tagline: string;
  taglineSub: string;
  buttonText: string;
  buttonUrl: string;
}

export type SectionBlock =
  | HeroBlock
  | AboutBlock
  | WhyBlock
  | ServicesBlock
  | ContactBlock
  | FooterBlock
  | SplitBlock
  | FullscreenBgBlock
  | GalleryBlock
  | HeroSplitBlock
  | HeroVideoBlock
  | HeroInteractiveBlock
  | StatsBlock
  | FeaturesBlock
  | FAQBlock
  | TeamBlock
  | TestimonialsBlock
  | CTABlock
  | HeroCenteredBlock
  | HeroMinimalBlock
  | LogoCloudBlock
  | StepsBlock
  | PricingBlock
  | NewsBlock
  | TimelineBlock
  | TwoColCtaBlock
  | NewsletterBlock
  | TabsBlock
  | MarqueeTextBlock
  | VideoBlock
  | ComparisonBlock
  | ImageGridBlock
  | BannerBlock
  | ColumnBlock
  | HeroGradientBlock
  | HeroGlassBlock
  | HeroTypoBlock
  | HeroAsymBlock
  | HeroPhotoBlock
  | HeroDarkBlock
  | HeroMosaicBlock
  | HeroJapaneseBlock
  | HeroDiagonalBlock;

export type BlockType = SectionBlock["type"];

// ─── ナビリンク ─────────────────────────────────────────────────
export interface NavLink {
  id: string;
  label: string;
  url: string;
}

// ─── サイトページ ────────────────────────────────────────────────
export interface SitePage {
  id: string;
  slug: string;
  title: string;
  sections: SectionBlock[];
}

// ─── コラム記事 ─────────────────────────────────────────────────
export interface Article {
  id: string;
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  body: string;
  imageUrl: string;
  author: string;
  published: boolean;
}

// ─── グローバル設定 ────────────────────────────────────────────
export interface SiteConfig {
  title: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: FontFamily;
  catchCopy: string;
  sections: SectionBlock[];   // ホームページのセクション
  pages: SitePage[];          // 追加ページ
  articles: Article[];        // コラム記事
  navLinks: NavLink[];        // ナビゲーション
}

// ─── ブロックのデフォルトファクトリ ────────────────────────────
export const BLOCK_DEFAULTS: Record<BlockType, () => SectionBlock> = {
  hero: () => ({
    id: uid(),
    type: "hero",
    tagline: "あなたが欲しい\n新しいチームが立ち上がる。",
    taglineSub: "We stand by your project.",
    buttonText: "はじめる",
    buttonUrl: "/contact",
  }),
  about: () => ({
    id: uid(),
    type: "about",
    heading: "プロジェクトが変われば\n編成も変わる。\nアウトソーシングの新しい形",
    body: "仕事は指示待ち、納品して終わり。\nプロジェクトの成果は発注企業持ち。\nそんな従来のアウトソーシングではなく、目的達成のため、\n何をすべきかを一緒に考える、提案する。",
    buttonText: "もっと見る",
    buttonUrl: "/about",
  }),
  why: () => ({
    id: uid(),
    type: "why",
    label: "why unicell",
    body1: "私たちはクラウドワーカーに特化した会社です。人材の紹介・就職支援にも注力し、自律・経営型のアウトソーシングで最高のチームを届けます。",
    body2: "自律・経営型のアウトソーサーとして、クラウドワーカーが自立して最高のスキルを発揮できるよう支えます。",
    imageUrl: "",
  }),
  services: () => ({
    id: uid(),
    type: "services",
    services: [
      {
        num: "01", tag: "recruiting support", title: "採用支援事業",
        subtitle: "製造・土木建設・サービス系企業の支援実績\n800社以上",
        desc: "リクルート・クラウドワークス出身のディレクターが貴社の採用を成功させます。",
        subs: [
          { label: "戦略", items: ["採用戦略・採用計画策定", "スタートアップのコンセプト立案"] },
          { label: "制作", items: ["求人原稿・LP制作", "採用ページ・SNS・サイト制作"] },
          { label: "運用", items: ["効果測定・PDCAサイクル", "スカウト業務"] },
        ],
        figColors: ["#fbbf24", "#6366f1", "#f87171"],
        imageUrl: "",
      },
      {
        num: "02", tag: "outsourcing", title: "アウトソーシング事業",
        subtitle: "ベンチャー企業のプロジェクトリーダーの強い味方",
        desc: "100人の外部専門家を活用で立ち上がる支援。社員雇用のリスクを負いません。",
        subs: [
          { label: "業務設計", items: ["プロジェクト設計から社内展開", "最適な外部パートナー探索"] },
          { label: "まるっと", items: ["全部お任せOK、納品まで", "コストとスケジュール管理"] },
          { label: "新プラン", items: ["新規事業立ち上げ支援", "ビジネスモデル・メニュー策定"] },
        ],
        figColors: ["#34d399", "#fbbf24", "#6366f1", "#f87171"],
        imageUrl: "",
      },
      {
        num: "03", tag: "consulting", title: "コンサルティング事業",
        subtitle: "組織や業務プロセスの改善支援",
        desc: "変化を恐れず、仕事を変える。",
        subs: [
          { label: "組織づくり", items: ["組織改革・組織設計", "チーム力を高める仕組みづくり"] },
          { label: "業務プロセス改善", items: ["業務フロー整理・効率化", "ムダ・ミス削減プロセス構築"] },
          { label: "クラウド活用コンサル", items: ["クラウドツール導入支援", "デジタル変革の推進"] },
        ],
        figColors: ["#6366f1", "#34d399", "#fbbf24"],
        imageUrl: "",
      },
    ],
  }),
  contact: () => ({
    id: uid(),
    type: "contact",
    heading: "お問い合わせ",
    desc: "お気軽にお問い合わせください。担当者よりご連絡いたします。",
    buttonUrl: "/contact",
  }),
  footer: () => ({
    id: uid(),
    type: "footer",
    companyName: "株式会社ユニセル",
    address: "〒000-0000\n東京都渋谷区〇〇1-2-3",
  }),
  split: () => ({
    id: uid(),
    type: "split",
    heading: "新しいサービスを\nはじめましょう",
    subheading: "Split Layout",
    body: "左右に分割されたレイアウトで、画像とテキストを並べることができます。視覚的に魅力的なセクションを簡単に作成できます。",
    imageUrl: "",
    imagePosition: "left",
    buttonText: "詳しくみる",
    buttonUrl: "",
  }),
  "fullscreen-bg": () => ({
    id: uid(),
    type: "fullscreen-bg",
    heading: "あなたのビジョンを\n現実に",
    subheading: "Full Screen Background",
    body: "背景画像の上に半透明のカードを重ねたダイナミックなデザインです。インパクトのあるメッセージを伝えるのに最適です。",
    imageUrl: "",
    buttonText: "今すぐ始める",
    buttonUrl: "",
  }),
  gallery: () => ({
    id: uid(),
    type: "gallery",
    heading: "ギャラリー",
    subheading: "Our Works",
    images: [
      { id: uid(), url: "", caption: "プロジェクト A", span: "wide" },
      { id: uid(), url: "", caption: "プロジェクト B", span: "normal" },
      { id: uid(), url: "", caption: "プロジェクト C", span: "normal" },
      { id: uid(), url: "", caption: "プロジェクト D", span: "normal" },
      { id: uid(), url: "", caption: "プロジェクト E", span: "tall" },
      { id: uid(), url: "", caption: "プロジェクト F", span: "normal" },
    ],
  }),
  "hero-split": () => ({
    id: uid(),
    type: "hero-split",
    tagline: "Vision meets\nExecution.",
    taglineSub: "左側の画像と右側のテキストで構成されるスプリットレイアウト。",
    body: "プロジェクトの成功に向けて、最適なチームとプロセスを設計します。ビジョンを現実に変えるパートナーとして、伴走します。",
    buttonText: "はじめる",
    buttonUrl: "",
    imageUrl: "https://picsum.photos/seed/hero-split/800/900",
  }),
  "hero-video": () => ({
    id: uid(),
    type: "hero-video",
    videoUrl: "",
    tagline: "STAND BY\nYOUR PROJECT.",
    taglineSub: "We stand by your project.",
    buttonText: "scroll →",
    buttonUrl: "",
  }),
  "hero-interactive": () => ({
    id: uid(),
    type: "hero-interactive",
    tagline: "新しいチームが\n立ち上がる。",
    taglineSub: "カーソルを動かしてみてください",
    buttonText: "はじめる",
    buttonUrl: "",
  }),
  stats: () => ({
    id: uid(),
    type: "stats",
    heading: "数字で見る実績",
    items: [
      { value: "800", suffix: "社以上", label: "支援企業数" },
      { value: "24", suffix: "h", label: "平均対応時間" },
      { value: "98", suffix: "%", label: "顧客満足度" },
      { value: "10", suffix: "年", label: "業界経験" },
    ],
  }),
  features: () => ({
    id: uid(),
    type: "features",
    heading: "私たちが選ばれる理由",
    subheading: "Our Features",
    items: [
      { emoji: "🚀", title: "スピード対応", desc: "ご連絡から24時間以内にご提案。スピーディーな対応で機会損失を防ぎます。" },
      { emoji: "🎯", title: "成果にコミット", desc: "納品して終わりではなく、目標達成まで伴走します。" },
      { emoji: "🛡️", title: "安心のサポート", desc: "専任担当者が最初から最後までサポート。いつでも相談できる体制です。" },
      { emoji: "💡", title: "柔軟な提案", desc: "画一的なプランではなく、貴社の課題に合わせたオーダーメイドの解決策を提供。" },
      { emoji: "🤝", title: "長期的パートナー", desc: "単発の取引ではなく、継続的な関係を大切にしています。" },
      { emoji: "📊", title: "データドリブン", desc: "感覚ではなくデータに基づいた意思決定で、確実な成果を追求します。" },
    ],
  }),
  faq: () => ({
    id: uid(),
    type: "faq",
    heading: "よくある質問",
    items: [
      { question: "どのような企業が対象ですか？", answer: "中小企業から大企業まで、業種・規模を問わずご対応しています。特にベンチャー企業や新規事業立ち上げフェーズの企業様からのご相談が多いです。" },
      { question: "費用はどのくらいかかりますか？", answer: "ご依頼内容や規模によって異なります。まずはお気軽にご相談ください。お客様の予算に合わせた最適なプランをご提案いたします。" },
      { question: "契約期間はどのくらいですか？", answer: "プロジェクト型（短期）から月額契約型（長期）まで選べます。最短1ヶ月からご利用いただけます。" },
      { question: "途中でプランを変更できますか？", answer: "はい、状況の変化に合わせて柔軟にプランを見直すことができます。担当者にご相談ください。" },
      { question: "契約後のサポート体制は？", answer: "専任の担当者がつき、Slack・メール・電話でいつでもご連絡いただけます。月次定例MTGも実施しています。" },
    ],
  }),
  team: () => ({
    id: uid(),
    type: "team",
    heading: "チームメンバー",
    subheading: "Our Team",
    members: [
      { name: "山田 太郎", role: "代表取締役CEO", bio: "リクルート出身。15年以上の採用・人材業界経験を持つ。", imageUrl: "" },
      { name: "鈴木 花子", role: "COO / 事業戦略", bio: "戦略コンサルファーム出身。事業立ち上げを多数経験。", imageUrl: "" },
      { name: "田中 一郎", role: "CTO / テックリード", bio: "メガベンチャー出身のエンジニア。DX推進を得意とする。", imageUrl: "" },
      { name: "佐藤 美咲", role: "クリエイティブ責任者", bio: "大手広告代理店出身。ブランディング・デザイン戦略を担う。", imageUrl: "" },
    ],
  }),
  testimonials: () => ({
    id: uid(),
    type: "testimonials",
    heading: "お客様の声",
    items: [
      { quote: "採用コストを大幅に削減しながら、質の高い候補者に出会えました。担当者の対応も丁寧で、安心して任せられました。", name: "株式会社〇〇", role: "人事部長" },
      { quote: "新規事業の立ち上げで手詰まりだったところを、チームを組んで一緒に動いてくれました。スピードと提案力に驚きました。", name: "△△株式会社", role: "代表取締役" },
      { quote: "社内ではリソースが足りなかった業務を丸ごとお任せできて、コア業務に集中できるようになりました。", name: "◇◇コーポレーション", role: "事業部長" },
    ],
  }),
  cta: () => ({
    id: uid(),
    type: "cta",
    heading: "新しい一歩を、\n一緒に踏み出しませんか。",
    body: "まずはお気軽にご相談ください。貴社の課題をヒアリングし、最適なご提案をいたします。",
    buttonText: "無料で相談する", buttonUrl: "/contact",
    buttonText2: "資料をダウンロード", buttonUrl2: "",
  }),
  "hero-centered": () => ({
    id: uid(), type: "hero-centered",
    eyebrow: "NEW ARRIVAL",
    tagline: "あなたのビジョンを\n現実に変える。",
    body: "私たちは、あなたのプロジェクトを成功に導くために存在しています。一緒に新しい未来を切り開きましょう。",
    buttonText: "無料で始める", buttonUrl: "/contact",
    buttonText2: "事例を見る", buttonUrl2: "/column",
    imageUrl: "https://picsum.photos/seed/hero-centered/1600/900",
  }),
  "hero-minimal": () => ({
    id: uid(), type: "hero-minimal",
    eyebrow: "Welcome",
    tagline: "シンプルに、\n力強く。",
    body: "余白と typography だけで語る、ミニマルなファーストビュー。",
    buttonText: "はじめる", buttonUrl: "",
  }),
  "logo-cloud": () => ({
    id: uid(), type: "logo-cloud",
    heading: "導入実績のある企業様",
    logos: [
      { name: "株式会社〇〇" }, { name: "△△ホールディングス" }, { name: "◇◇コーポレーション" },
      { name: "□□グループ" }, { name: "〇〇テクノロジー" }, { name: "△△パートナーズ" },
    ],
  }),
  steps: () => ({
    id: uid(), type: "steps",
    heading: "ご利用の流れ", subheading: "How It Works",
    items: [
      { number: "01", title: "お問い合わせ", desc: "まずはフォームまたはお電話にてお気軽にご連絡ください。" },
      { number: "02", title: "ヒアリング・ご提案", desc: "貴社の課題をじっくりお聞きし、最適なプランをご提案します。" },
      { number: "03", title: "ご契約・キックオフ", desc: "合意後すぐに担当チームをアサインし、プロジェクトを開始します。" },
      { number: "04", title: "実行・改善", desc: "定期的に進捗を共有しながら、目標達成に向けてPDCAを回します。" },
    ],
  }),
  pricing: () => ({
    id: uid(), type: "pricing",
    heading: "料金プラン", subheading: "Pricing",
    plans: [
      {
        name: "スタート", price: "¥50,000", period: "/ 月", desc: "小規模プロジェクトや個人事業主向け",
        features: ["担当者1名", "月5時間まで", "メール・チャットサポート", "月次レポート"],
        highlighted: false, buttonText: "このプランで始める", buttonUrl: "/contact",
      },
      {
        name: "スタンダード", price: "¥150,000", period: "/ 月", desc: "成長中の企業・中規模チーム向け",
        features: ["担当者2名", "月20時間まで", "電話・Slackサポート", "週次レポート", "優先対応"],
        highlighted: true, buttonText: "最も人気のプラン", buttonUrl: "/contact",
      },
      {
        name: "エンタープライズ", price: "要相談", period: "", desc: "大規模・カスタム要件のある企業向け",
        features: ["専任チーム", "時間制限なし", "24h緊急サポート", "カスタムレポート", "SLA保証"],
        highlighted: false, buttonText: "お問い合わせ", buttonUrl: "/contact",
      },
    ],
  }),
  news: () => ({
    id: uid(), type: "news",
    heading: "最新ニュース", subheading: "News & Topics",
    viewAllUrl: "/column",
    items: [
      { date: "2025.03.15", category: "プレスリリース", title: "新サービス「〇〇プラン」の提供を開始しました", excerpt: "このたび、より多くのお客様にご利用いただけるよう、新たな料金プランを追加しました。", imageUrl: "", articleId: "" },
      { date: "2025.02.28", category: "イベント", title: "東京ビジネスフォーラム2025に出展します", excerpt: "3月20日開催のビジネスフォーラムに出展予定です。ぜひ私たちのブースへお立ち寄りください。", imageUrl: "", articleId: "" },
      { date: "2025.02.10", category: "実績", title: "累計支援企業数が1,000社を突破しました", excerpt: "皆様のご支援のおかげで、この度大きなマイルストーンを達成することができました。", imageUrl: "", articleId: "" },
    ],
  }),
  timeline: () => ({
    id: uid(), type: "timeline",
    heading: "会社の歩み",
    items: [
      { year: "2015", title: "会社設立", desc: "東京・渋谷にて株式会社〇〇を設立。採用支援事業を開始。" },
      { year: "2017", title: "事業拡大", desc: "アウトソーシング事業を新たに立ち上げ。クライアント数100社突破。" },
      { year: "2019", title: "オフィス移転", desc: "業務拡大に伴い、新オフィスへ移転。スタッフ50名体制に。" },
      { year: "2021", title: "DX推進事業開始", desc: "デジタルトランスフォーメーション支援サービスをリリース。" },
      { year: "2023", title: "支援累計1000社突破", desc: "創業以来の支援企業数が1,000社を超える大きな節目を迎えた。" },
    ],
  }),
  "two-col-cta": () => ({
    id: uid(), type: "two-col-cta",
    leftHeading: "法人のお客様へ", leftBody: "企業のプロジェクト立ち上げから採用・業務改善まで、幅広くサポートします。まずはお気軽にご相談ください。", leftButtonText: "法人向けサービスを見る", leftButtonUrl: "/services",
    rightHeading: "個人のお客様へ", rightBody: "フリーランスや個人事業主の方も歓迎。スキルを活かせる案件をご紹介します。", rightButtonText: "個人向けサービスを見る", rightButtonUrl: "/column",
  }),
  newsletter: () => ({
    id: uid(), type: "newsletter",
    heading: "最新情報をお届けします",
    body: "業界トレンド、成功事例、お役立ち情報を定期的にお送りします。いつでも解除可能です。",
    placeholder: "メールアドレスを入力", buttonText: "無料で登録する",
  }),
  tabs: () => ({
    id: uid(), type: "tabs",
    heading: "サービス詳細",
    items: [
      { label: "採用支援", heading: "採用を成功させる、戦略的アプローチ", body: "求人媒体の選定から、魅力的な求人原稿の作成、応募者対応まで一貫してサポート。採用コストを抑えながら、自社にフィットした人材を獲得します。", imageUrl: "" },
      { label: "業務改善", heading: "無駄をなくし、チームの力を最大化", body: "業務フローの可視化・整理から、ツール導入支援、マニュアル整備まで対応。現場の生産性を高め、コア業務への集中を実現します。", imageUrl: "" },
      { label: "新規事業", heading: "アイデアを形に、スピーディーに", body: "事業アイデアのブラッシュアップから、市場調査、MVP開発、ローンチまでを伴走。失敗を最小化しながら新規事業を推進します。", imageUrl: "" },
    ],
  }),
  "marquee-text": () => ({
    id: uid(), type: "marquee-text",
    items: ["採用支援", "アウトソーシング", "コンサルティング", "DX推進", "新規事業支援", "組織改革", "業務効率化", "人材紹介"],
  }),
  video: () => ({
    id: uid(), type: "video",
    heading: "私たちの想いを、動画でお伝えします",
    body: "創業からの歩みと、私たちがどのようにお客様の課題に向き合っているかをご覧ください。",
    videoUrl: "", thumbnailUrl: "",
  }),
  comparison: () => ({
    id: uid(), type: "comparison",
    heading: "従来サービスとの違い", ourLabel: "私たちのサービス", competitorLabel: "従来のサービス",
    rows: [
      { feature: "提案スピード", us: "24時間以内", them: "1週間〜" },
      { feature: "担当者との関係", us: "専任担当が伴走", them: "都度対応・担当変更あり" },
      { feature: "成果へのコミット", us: "目標設定・追跡あり", them: "納品して終わり" },
      { feature: "柔軟な対応", us: "随時プラン変更可", them: "契約変更に時間がかかる" },
      { feature: "レポーティング", us: "週次・月次レポート", them: "月次のみ" },
    ],
  }),
  "image-grid": () => ({
    id: uid(), type: "image-grid",
    heading: "導入事例", subheading: "Case Studies",
    items: [
      { imageUrl: "", title: "製造業A社 採用コスト50%削減", tag: "採用支援" },
      { imageUrl: "", title: "スタートアップB社 3ヶ月で新規事業立ち上げ", tag: "新規事業" },
      { imageUrl: "", title: "サービス業C社 業務時間30%短縮", tag: "業務改善" },
      { imageUrl: "", title: "IT企業D社 組織体制の全面再設計", tag: "コンサルティング" },
      { imageUrl: "", title: "飲食チェーンE社 パート採用を完全内製化", tag: "採用支援" },
      { imageUrl: "", title: "物流F社 DX推進で生産性2倍", tag: "DX推進" },
    ],
  }),
  banner: () => ({
    id: uid(), type: "banner",
    label: "NEW",
    text: "新サービス「エンタープライズプラン」の提供を開始しました。",
    linkText: "詳細を見る →",
  }),
  "hero-typo": () => ({
    id: uid(), type: "hero-typo",
    kanjiDecor: "革新",
    eyebrow: "Since 2015 — 東京・大阪",
    tagline: "あなたのビジネスに、\n新しい視点を。",
    taglineSub: "NEW PERSPECTIVE",
    body: "私たちは「当たり前」を問い直し、\nお客様と共に本質的な価値を生み出します。",
    buttonText: "私たちの仕事を見る", buttonUrl: "/services",
  }),
  "hero-asym": () => ({
    id: uid(), type: "hero-asym",
    eyebrow: "DESIGN × TECHNOLOGY",
    tagline: "世界を動かす\nデザインを、\nここから。",
    accentWord: "デザイン",
    body: "美しさと機能性を両立した\nデジタル体験を創造します。",
    buttonText: "実績を見る", buttonUrl: "/works",
    imageUrl: "",
  }),
  "hero-photo": () => ({
    id: uid(), type: "hero-photo",
    imageUrl: "https://picsum.photos/seed/hero-photo/1600/900",
    eyebrow: "VISUAL FIRST IMPRESSION",
    tagline: "一瞬で、心を\n動かすデザイン。",
    body: "写真の力と言葉が交わる場所で\n新しいブランドストーリーが始まります。",
    buttonText: "詳しく見る", buttonUrl: "/about",
    caption: "Photo by Our Creative Team",
  }),
  "hero-dark": () => ({
    id: uid(), type: "hero-dark",
    imageUrl: "https://picsum.photos/seed/hero-dark/1600/900",
    eyebrow: "PREMIUM QUALITY",
    tagline: "最高品質を、\nあなたの手に。",
    body: "業界トップクラスのクオリティで\nお客様のビジネスを加速させます。",
    buttonText: "サービスを見る", buttonUrl: "/services",
    stat1Value: "No.1", stat1Label: "顧客満足度",
    stat2Value: "15年", stat2Label: "業界実績",
  }),
  "hero-mosaic": () => ({
    id: uid(), type: "hero-mosaic",
    eyebrow: "CREATIVE WORKS",
    tagline: "アイデアを\n形にする\n専門集団。",
    body: "デザイン・開発・マーケティングを\nワンストップで提供します。",
    buttonText: "実績を見る", buttonUrl: "/works",
    image1: "https://picsum.photos/seed/mosaic1/800/600",
    image2: "https://picsum.photos/seed/mosaic2/800/600",
    image3: "https://picsum.photos/seed/mosaic3/800/600",
    image4: "https://picsum.photos/seed/mosaic4/800/600",
  }),
  "hero-japanese": () => ({
    id: uid(), type: "hero-japanese",
    imageUrl: "https://picsum.photos/seed/hero-jp/1200/900",
    kanjiLarge: "美",
    taglineJp: "本物の美しさは\n細部に宿る。",
    taglineEn: "TRUE BEAUTY LIES IN THE DETAILS",
    body: "日本の職人精神を受け継ぎ\n丁寧なものづくりをお届けします。",
    buttonText: "私たちの想い", buttonUrl: "/about",
  }),
  "hero-diagonal": () => ({
    id: uid(), type: "hero-diagonal",
    imageUrl: "https://picsum.photos/seed/hero-diag/1600/900",
    eyebrow: "INNOVATION FORWARD",
    tagline: "変化を恐れず、\n未来を切り拓く。",
    body: "テクノロジーと人間の感性が\n融合するとき、革新が生まれます。",
    buttonText: "始めましょう", buttonUrl: "/contact",
    buttonText2: "実績を見る", buttonUrl2: "/works",
  }),
  "hero-gradient": () => ({
    id: uid(), type: "hero-gradient",
    eyebrow: "YOUR BUSINESS PARTNER",
    tagline: "ビジネスの\n可能性を\n広げる。",
    body: "私たちは、最先端のテクノロジーと豊富な経験で\nお客様のビジネス成長を力強くサポートします。",
    buttonText: "無料相談を予約する", buttonUrl: "/contact",
    buttonText2: "サービスを見る", buttonUrl2: "/services",
    stats: [
      { value: "500+", label: "導入企業" },
      { value: "98%", label: "顧客満足度" },
      { value: "10年", label: "業界実績" },
    ],
  }),
  "hero-glass": () => ({
    id: uid(), type: "hero-glass",
    imageUrl: "https://picsum.photos/seed/hero-glass/1600/900",
    eyebrow: "CRAFTING TOMORROW",
    tagline: "未来を\nともに\nつくる。",
    body: "革新的なソリューションで、あなたのビジネスに\n新たな価値をお届けします。",
    buttonText: "私たちについて", buttonUrl: "/about",
    scrollLabel: "SCROLL",
  }),
  column: () => ({
    id: uid(), type: "column",
    heading: "コラム",
    subheading: "最新の記事・ノウハウをお届けします",
    maxItems: 6,
    viewAllUrl: "/column",
    viewAllText: "すべての記事を見る",
    layout: "grid",
  }),
};

// ─── ブロックのメタ情報（モーダル表示用） ─────────────────────
export const BLOCK_META: {
  type: BlockType;
  label: string;
  desc: string;
  category: string;
}[] = [
  { type: "hero",          label: "ファーストビュー", desc: "幾何学シェイプ + 大見出し",     category: "基本" },
  { type: "about",         label: "About",           desc: "会社・サービス紹介テキスト",    category: "基本" },
  { type: "why",           label: "Why Us",           desc: "画像 + テキスト（横並び）",    category: "基本" },
  { type: "services",      label: "サービス一覧",     desc: "番号付き 3サービスカード",      category: "基本" },
  { type: "contact",       label: "お問い合わせ",     desc: "マーキー + CTAボタン",         category: "基本" },
  { type: "footer",        label: "フッター",         desc: "ロゴ + ナビゲーション",        category: "基本" },
  { type: "split",             label: "スプリット",           desc: "画像 ← → テキスト 2分割",       category: "リッチ" },
  { type: "fullscreen-bg",     label: "全画面背景",           desc: "背景画像 + カードオーバーレイ",   category: "リッチ" },
  { type: "gallery",           label: "ギャラリー",           desc: "不規則グリッドの画像タイル",     category: "リッチ" },
  { type: "hero-split",        label: "HeroA：スプリット",    desc: "左画像／右グラデーション白文字",  category: "ヒーロー" },
  { type: "hero-video",        label: "HeroB：動画背景",      desc: "動画BG + 大タイポグラフィ",      category: "ヒーロー" },
  { type: "hero-interactive",  label: "HeroC：インタラクティブ", desc: "マウス追従シェイプアニメーション", category: "ヒーロー" },
  { type: "stats",        label: "実績・数字",     desc: "大きな数字で実績をアピール",      category: "コンテンツ" },
  { type: "features",     label: "特徴・強み",     desc: "アイコン付き6つの特徴グリッド",  category: "コンテンツ" },
  { type: "faq",          label: "FAQ",            desc: "アコーディオン形式のよくある質問", category: "コンテンツ" },
  { type: "team",         label: "チーム紹介",     desc: "メンバーカードグリッド",          category: "コンテンツ" },
  { type: "testimonials", label: "お客様の声",     desc: "引用スタイルのレビューカード",    category: "コンテンツ" },
  { type: "cta",          label: "CTAバナー",      desc: "大見出し + 2ボタンの行動喚起",   category: "コンテンツ" },
  { type: "hero-centered",  label: "HeroD：中央揃え",  desc: "全幅背景 + 中央テキスト + 2ボタン",    category: "ヒーロー" },
  { type: "hero-minimal",   label: "HeroE：ミニマル",  desc: "白背景 + 大タイポグラフィのみ",         category: "ヒーロー" },
  { type: "logo-cloud",     label: "ロゴ一覧",         desc: "クライアント・パートナーロゴ帯",         category: "コンテンツ" },
  { type: "steps",          label: "ステップ・流れ",   desc: "番号付き4ステップの横並びカード",        category: "コンテンツ" },
  { type: "pricing",        label: "料金プラン",       desc: "3プランの比較カード（中央ハイライト）",  category: "コンテンツ" },
  { type: "news",           label: "ニュース",         desc: "日付・カテゴリ付き記事カード",           category: "コンテンツ" },
  { type: "timeline",       label: "沿革・歴史",       desc: "縦線タイムライン",                       category: "コンテンツ" },
  { type: "two-col-cta",    label: "2列CTA",           desc: "法人向け / 個人向けの2カラムCTA",        category: "コンテンツ" },
  { type: "newsletter",     label: "メルマガ登録",     desc: "メールアドレス入力 + 登録ボタン",        category: "コンテンツ" },
  { type: "tabs",           label: "タブコンテンツ",   desc: "クリックで切り替わる詳細セクション",     category: "コンテンツ" },
  { type: "marquee-text",   label: "スクロールテキスト", desc: "キーワードが流れるアニメーション帯",   category: "コンテンツ" },
  { type: "video",          label: "動画セクション",   desc: "動画プレーヤー + 説明テキスト",          category: "リッチ" },
  { type: "comparison",     label: "比較表",           desc: "自社 vs 競合の機能比較テーブル",         category: "リッチ" },
  { type: "image-grid",     label: "事例グリッド",     desc: "ホバーで詳細が出る画像カード",           category: "リッチ" },
  { type: "banner",         label: "お知らせバナー",   desc: "ページ上部のアナウンスバー",             category: "リッチ" },
  { type: "column",         label: "コラム一覧",       desc: "記事管理のコラムを自動表示するグリッド", category: "コラム" },
  { type: "hero-gradient",  label: "HeroF：グラデーション", desc: "カラフルなグラデーション + 実績フローティングカード", category: "ヒーロー" },
  { type: "hero-glass",     label: "HeroG：グラスカード",   desc: "フルスクリーン画像 + グラスモーフィズムカード",     category: "ヒーロー" },
  { type: "hero-typo",      label: "HeroH：装飾文字",       desc: "背景に大きな漢字 + エディトリアルタイポグラフィ",  category: "ヒーロー" },
  { type: "hero-asym",      label: "HeroI：非対称スプリット", desc: "左カラー帯 + 右画像の非対称レイアウト",          category: "ヒーロー" },
  { type: "hero-photo",     label: "HeroJ：フォト",         desc: "フルブリード写真 + フローティングテキスト",    category: "ヒーロー" },
  { type: "hero-dark",      label: "HeroK：ダーク",         desc: "ダーク高級感 + 実績数値 + 写真",              category: "ヒーロー" },
  { type: "hero-mosaic",    label: "HeroL：モザイク",       desc: "4枚のモザイク写真グリッド + テキスト",        category: "ヒーロー" },
  { type: "hero-japanese",  label: "HeroM：日本的ミニマル", desc: "漢字一文字 + 縦書き風 + 和の余白",            category: "ヒーロー" },
  { type: "hero-diagonal",  label: "HeroN：ダイアゴナル",   desc: "斜めカットの写真 + ダイナミックレイアウト",    category: "ヒーロー" },
];

// ─── デフォルト設定 ────────────────────────────────────────────
export const defaultConfig: SiteConfig = {
  title: "Unicell",
  primaryColor: "#1a1a2e",
  accentColor: "#F5C842",
  fontFamily: "sans",
  catchCopy: "stand by your project.",
  sections: [
    BLOCK_DEFAULTS.hero(),
    BLOCK_DEFAULTS.about(),
    BLOCK_DEFAULTS.why(),
    BLOCK_DEFAULTS.services(),
    BLOCK_DEFAULTS.contact(),
    BLOCK_DEFAULTS.footer(),
  ],
  pages: [
    {
      id: uid(), slug: "about", title: "会社案内",
      sections: [BLOCK_DEFAULTS["hero-minimal"](), BLOCK_DEFAULTS.why(), BLOCK_DEFAULTS.team(), BLOCK_DEFAULTS.footer()],
    },
    {
      id: uid(), slug: "column", title: "コラム",
      sections: [BLOCK_DEFAULTS.column(), BLOCK_DEFAULTS.footer()],
    },
    {
      id: uid(), slug: "contact", title: "お問い合わせ",
      sections: [BLOCK_DEFAULTS.contact(), BLOCK_DEFAULTS.footer()],
    },
  ],
  articles: [
    {
      id: uid(), slug: "first-article",
      title: "アウトソーシングの新しい形—自律型チームが生み出す価値",
      date: "2025-03-15", category: "コラム", author: "編集部",
      excerpt: "従来のアウトソーシングとは一線を画す、目的達成型の新しい働き方についてご紹介します。",
      body: "<p>アウトソーシングといえば、「指示を出して、納品してもらうだけ」というイメージをお持ちの方も多いのではないでしょうか。</p><h2>変わりゆくアウトソーシングの形</h2><p>しかし、ビジネスを取り巻く環境が急速に変化する中で、そのような従来型のアウトソーシングでは対応できない課題が増えています。</p><p>私たちが提案するのは、「自律・経営型アウトソーシング」です。</p><h2>成果にコミットする姿勢</h2><p>目的を共有し、課題解決のために何をすべきかを一緒に考える。それが私たちのアプローチです。</p>",
      imageUrl: "", published: true,
    },
    {
      id: uid(), slug: "second-article",
      title: "採用コストを半減させた3つの戦略",
      date: "2025-03-01", category: "採用支援", author: "採用チーム",
      excerpt: "採用コストの最適化に成功した企業の実例をもとに、効果的な採用戦略を解説します。",
      body: "<p>採用コストの高騰は、多くの企業が直面している課題です。</p><h2>戦略1: 求人媒体の最適化</h2><p>闇雲に複数の媒体に掲載するのではなく、ターゲットとなる人材が集まる媒体を絞り込みましょう。</p><h2>戦略2: スカウト採用の活用</h2><p>待ちの採用から攻めの採用へ。スカウトメールを活用することで、より質の高い候補者にアプローチできます。</p><h2>戦略3: 採用ブランディング</h2><p>自社の魅力を正確に伝えることで、ミスマッチを減らし定着率を向上させます。</p>",
      imageUrl: "", published: true,
    },
  ],
  navLinks: [
    { id: uid(), label: "会社案内", url: "/about" },
    { id: uid(), label: "サービス", url: "/services" },
    { id: uid(), label: "コラム", url: "/column" },
    { id: uid(), label: "お問い合わせ", url: "/contact" },
  ],
};
