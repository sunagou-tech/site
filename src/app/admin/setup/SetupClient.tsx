"use client";

import "@material-symbols/font-400/rounded.css";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SiteConfig, GlobalStyle, uid } from "@/types/site";
import CanvasEditor from "@/components/canvas/CanvasEditor";
import { EditingContext } from "@/contexts/EditingContext";

type ChatMessage = { role: "user" | "assistant"; content: string };

const NAVY = "#1A365D";
type Phase = "form" | "generating" | "preview" | "html-preview";

// ── デモテンプレート ──────────────────────────────────────────
type DemoTemplate = {
  id: string; name: string; label: string; desc: string;
  mode?: "html" | "blocks"; // デフォルト: "html"
  thumb: { bg: string; accent: string; textColor: string; subColor: string; gradient?: string; };
  style: Partial<GlobalStyle>;
};

const DEMO_TEMPLATES: DemoTemplate[] = [
  {
    id: "juku-sakura",
    name: "サクラ進学塾",
    label: "パステル × 女の子向け",
    desc: "ピンク×パステルで温かみのある印象。女の子専門・中学受験特化塾に最適。",
    thumb: { bg: "#FDF2F8", accent: "#EC4899", textColor: "#111827", subColor: "#9CA3AF", gradient: "linear-gradient(160deg,#fff5f9 0%,#fce7f3 100%)" },
    style: {
      primaryColor: "#9D174D", accentColor: "#EC4899",
      heroBgColor: "#9D174D", bgColor: "#FDF2F8",
      cardBgColor: "#FCE7F3", buttonBgColor: "#EC4899",
      designStyle: "pastel-feminine",
      designNotes: "学習塾、女の子専門、中学受験、ピンク、パステル、桜、温かみ、親しみやすい、信頼感、保護者向け",
    },
  },
  {
    id: "juku-benesse",
    name: "ライズ学習塾",
    label: "クリーン × 信頼感",
    desc: "白ベース×赤CTAのベネッセ系デザイン。清潔感と信頼感で保護者に響く王道スタイル。",
    thumb: { bg: "#ffffff", accent: "#e50012", textColor: "#0c1530", subColor: "#666666", gradient: "linear-gradient(160deg,#ffffff 0%,#f2f2f2 100%)" },
    style: {
      primaryColor: "#0c1530", accentColor: "#e50012",
      heroBgColor: "#ffffff", bgColor: "#ffffff",
      cardBgColor: "#f7f9fc", buttonBgColor: "#e50012",
      designStyle: "clean-trusted",
      designNotes: "学習塾、個別指導、白背景、赤アクセント、青サブカラー、Noto Sans JP、清潔感、信頼感、保護者向け、フラットデザイン",
    },
  },
  {
    id: "juku-takeda",
    name: "逆転塾ルートアップ",
    label: "武田塾系 × 逆転合格",
    desc: "白×赤×イエローの武田塾系LP。授業をしない自学自習メソッドで難関大逆転合格を狙う受験専門塾に最適。",
    thumb: { bg: "#0d1f3c", accent: "#fff100", textColor: "#ffffff", subColor: "rgba(255,255,255,0.6)", gradient: "linear-gradient(160deg,#0d1f3c 0%,#142844 100%)" },
    style: {
      primaryColor: "#df2525", accentColor: "#fff972",
      heroBgColor: "#fcfbf6", bgColor: "#fcfbf6",
      cardBgColor: "#ffffff", buttonBgColor: "#df2525",
      designStyle: "exam-prep-bold",
      designNotes: "受験専門塾、自学自習、逆転合格、クリーム背景、赤アクセント、イエローハイライト、Noto Sans JP、武田塾系、大学受験",
    },
  },
];

// ── デモ用キャンバスブロック設定（静的・AI不使用）────────────
function buildDemoConfig(id: string): SiteConfig | null {
  if (id === "juku-benesse") {
    return {
      title: "ライズ学習塾", catchCopy: "一人ひとりの「わかった！」を積み上げる",
      primaryColor: "#005bab", accentColor: "#e50012", fontFamily: "sans",
      logoUrl: "", headerHtml: "", footerHtml: "",
      globalStyle: { primaryColor: "#005bab", accentColor: "#e50012", bgColor: "#ffffff", cardBgColor: "#f7f9fc", buttonBgColor: "#e50012", buttonTextColor: "#ffffff", buttonRadius: "6", cardBorderRadius: "16", sectionPaddingY: "80" },
      navLinks: [
        { id: uid(), label: "選ばれる理由", url: "#features" },
        { id: uid(), label: "コース紹介", url: "#course" },
        { id: uid(), label: "よくある質問", url: "#faq" },
        { id: uid(), label: "お問い合わせ", url: "/contact" },
      ],
      sections: [
        { id: uid(), type: "hero-centered", eyebrow: "2026年度 生徒募集中", tagline: "一人ひとりの\n「わかった！」を\n積み上げる個別指導", body: "あなたのペースで、あなただけのカリキュラム。苦手科目の克服から志望校合格まで、担任制の個別指導でしっかりサポートします。", buttonText: "無料体験授業を申し込む", buttonUrl: "/contact", buttonText2: "資料を請求する", buttonUrl2: "", imageUrl: "" },
        { id: uid(), type: "stats", heading: "選ばれる実績", items: [{ value: "98", suffix: "%", label: "成績向上率" }, { value: "15", suffix: "年", label: "指導実績" }, { value: "1,200", suffix: "名+", label: "累計卒業生" }, { value: "94", suffix: "%", label: "志望校合格率" }] },
        { id: uid(), type: "about", heading: "こんなお悩みありませんか？", body: "成績が伸び悩む原因は「一人ひとりに合った学習」の欠如です。集団授業では拾えない「つまずき」が、やがて大きな学力差を生みます。\n\n授業についていけない、何から手をつければいいかわからない、塾に通っても成績が上がらない——そんなお悩みをライズ学習塾がすべて解決します。", buttonText: "無料体験を申し込む", buttonUrl: "/contact" },
        { id: uid(), type: "features", heading: "成績が上がる、3つの仕組み", subheading: "15年の指導実績から生まれた確かな学習メソッド",
          items: [
            { icon: { kind: "lucide", value: "GraduationCap", size: 28 }, title: "専任担任制・完全個別カリキュラム", desc: "入塾時の学力診断から始まり、生徒一人ひとりに合わせたオリジナルカリキュラムを作成。苦手分野を集中的に克服できます。" },
            { icon: { kind: "lucide", value: "BarChart2", size: 28 }, title: "週次レポートで保護者と進捗共有", desc: "毎週の学習状況・理解度・宿題の定着率をレポートでお届け。保護者の方もリアルタイムで成長を確認できます。" },
            { icon: { kind: "lucide", value: "MessageCircle", size: 28 }, title: "自習室・質問対応でわからないを即解決", desc: "開塾時間中はいつでも自習室を利用可能。常駐スタッフへの質問も随時受付けているので、疑問をその日のうちに解消できます。" },
            { icon: { kind: "lucide", value: "BookOpen", size: 28 }, title: "定期テスト対策コース", desc: "テスト2週間前から5教科を集中対策。前回比で平均+18点アップの実績を誇ります。" },
            { icon: { kind: "lucide", value: "Target", size: 28 }, title: "高校受験専門コース", desc: "志望校別の入試対策・模擬試験・過去問演習・出願面接サポートまで。合格率94%の実績。" },
            { icon: { kind: "lucide", value: "Star", size: 28 }, title: "基礎力強化コース", desc: "つまずいた単元まで遡る反復演習で確実に定着。3ヶ月で苦手意識を解消します。" },
          ] as [{ icon: { kind: "lucide"; value: string; size: 28 }; title: string; desc: string }, { icon: { kind: "lucide"; value: string; size: 28 }; title: string; desc: string }, { icon: { kind: "lucide"; value: string; size: 28 }; title: string; desc: string }, { icon: { kind: "lucide"; value: string; size: 28 }; title: string; desc: string }, { icon: { kind: "lucide"; value: string; size: 28 }; title: string; desc: string }, { icon: { kind: "lucide"; value: string; size: 28 }; title: string; desc: string }]
        },
        { id: uid(), type: "steps", heading: "入塾の流れ", subheading: "まずは無料体験から気軽にスタートできます",
          items: [
            { number: "01", title: "無料体験申込", desc: "Webフォームまたはお電話でご予約" },
            { number: "02", title: "学力診断テスト", desc: "現在の学力と課題を把握" },
            { number: "03", title: "担任との授業体験", desc: "実際の授業スタイルをご体験" },
            { number: "04", title: "ご入塾・学習開始", desc: "カリキュラム作成後すぐにスタート" },
          ]
        },
        { id: uid(), type: "faq", heading: "よくある質問",
          items: [
            { question: "体験授業は本当に無料ですか？", answer: "はい、初回の体験授業（60分）は完全無料です。学力診断テストと授業がセットになっており、一切費用はかかりません。体験後に入塾を強制することもありませんので、お気軽にお申し込みください。" },
            { question: "授業は週に何回から通えますか？", answer: "週1回から通うことができます。学校の行事やクラブ活動に合わせてスケジュールを柔軟に組めますので、お子さまのペースに合わせてご相談ください。" },
            { question: "途中でコースを変更することはできますか？", answer: "もちろん可能です。受験が近づいてきたタイミングでコースを切り替えるご家庭も多いです。担任の先生と相談しながら最適な時期に変更できます。" },
            { question: "オンライン授業にも対応していますか？", answer: "はい、ZoomやGoogle Meetを使ったオンライン個別指導も行っています。通塾とオンラインを組み合わせることも可能です。" },
          ]
        },
        { id: uid(), type: "cta", heading: "まずは無料体験授業から", body: "入塾金0円・初回授業完全無料。担任制で一人ひとりに合わせた指導をご体験ください。", buttonText: "無料体験を申し込む", buttonUrl: "/contact", buttonText2: "資料請求はこちら", buttonUrl2: "" },
        { id: uid(), type: "contact", heading: "お問い合わせ", desc: "ご不明な点はお気軽にご相談ください。担当スタッフが丁寧にご案内します。", buttonUrl: "/contact" },
      ],
      pages: [],
    } as unknown as SiteConfig;
  }
  if (id === "design-creavo") {
    return {
      title: "CREAVO", catchCopy: "デザインで、ビジネスをワクワクに。",
      primaryColor: "#ED3A8C", accentColor: "#2DC7C0", fontFamily: "sans",
      logoUrl: "", headerHtml: "", footerHtml: "",
      globalStyle: { primaryColor: "#ED3A8C", accentColor: "#2DC7C0", bgColor: "#ffffff", cardBgColor: "#FFF2F6", buttonBgColor: "#ED3A8C", buttonTextColor: "#ffffff", buttonRadius: "999", cardBorderRadius: "24", sectionPaddingY: "80" },
      navLinks: [
        { id: uid(), label: "サービス", url: "#services" },
        { id: uid(), label: "実績", url: "#works" },
        { id: uid(), label: "料金", url: "#pricing" },
        { id: uid(), label: "FAQ", url: "#faq" },
        { id: uid(), label: "無料相談", url: "/contact" },
      ],
      sections: [
        { id: uid(), type: "hero-centered", eyebrow: "デザインスタジオ", tagline: "デザインで、\nビジネスを\nワクワクに。", body: "ブランディングからUI/UXまで、あなたのプロダクトをもっと楽しく、もっと愛される存在へ。一緒に、世界を驚かせましょう。", buttonText: "無料で相談する →", buttonUrl: "/contact", buttonText2: "サービスを見る", buttonUrl2: "", imageUrl: "" },
        { id: uid(), type: "stats", heading: "実績で選ばれています", items: [{ value: "150", suffix: "社+", label: "支援企業数" }, { value: "98", suffix: "%", label: "顧客満足度" }, { value: "2.3", suffix: "倍", label: "平均CVR改善" }, { value: "8", suffix: "年", label: "業界経験" }] },
        { id: uid(), type: "features", heading: "私たちのサービス", subheading: "Services",
          items: [
            { icon: { kind: "lucide", value: "Target", size: 28 }, title: "ブランディング", desc: "ロゴ・BI設計からブランドボイスまで、あなたの事業の「らしさ」を言語化・視覚化します。" },
            { icon: { kind: "lucide", value: "Star", size: 28 }, title: "UI/UXデザイン", desc: "ユーザーが直感的に動けるインターフェースを設計。体験ファーストのデザインで成果を最大化。" },
            { icon: { kind: "lucide", value: "Globe", size: 28 }, title: "Webサイト制作", desc: "表示速度・SEO・モバイル対応まで徹底。集客・採用・LP、目的に合ったWebを構築します。" },
            { icon: { kind: "lucide", value: "BarChart2", size: 28 }, title: "グロースサポート", desc: "公開後のA/Bテスト・分析・改善サイクルをご支援。データを武器にビジネスを加速させます。" },
            { icon: { kind: "lucide", value: "Lightbulb", size: 28 }, title: "コンサルティング", desc: "ビジネス課題を起点に、戦略・設計・制作まで一貫して伴走。本質的な課題解決を提供します。" },
            { icon: { kind: "lucide", value: "Users", size: 28 }, title: "チームサポート", desc: "デザイン組織の立ち上げ・採用・育成をサポート。インハウスデザイン体制を構築します。" },
          ] as [{ icon: { kind: "lucide"; value: string; size: 28 }; title: string; desc: string }, { icon: { kind: "lucide"; value: string; size: 28 }; title: string; desc: string }, { icon: { kind: "lucide"; value: string; size: 28 }; title: string; desc: string }, { icon: { kind: "lucide"; value: string; size: 28 }; title: string; desc: string }, { icon: { kind: "lucide"; value: string; size: 28 }; title: string; desc: string }, { icon: { kind: "lucide"; value: string; size: 28 }; title: string; desc: string }]
        },
        { id: uid(), type: "testimonials", heading: "お客様の声",
          items: [
            { quote: "デザインが変わっただけで問い合わせが倍に。スピードと提案力に感動しました！", name: "ECブランドオーナー", role: "田中 美咲" },
            { quote: "ユーザーインタビューから入ってくれたので、本当に使いやすいUIになりました。リピート確定です。", name: "SaaSスタートアップ CTO", role: "佐藤 健太" },
            { quote: "LP公開後にCVRが2.3倍に改善。コピーからデザインまでトータルで提案してくれて最高でした！", name: "オンラインスクール運営者", role: "中村 優子" },
          ]
        },
        { id: uid(), type: "steps", heading: "ご利用の流れ", subheading: "Flow",
          items: [
            { number: "01", title: "お問い合わせ", desc: "フォームまたはSNSからお気軽にご連絡ください。1営業日以内にご返信します。" },
            { number: "02", title: "ヒアリング・お見積もり", desc: "オンラインにて、ご状況・目的・ご予算をヒアリング。ご提案をお伝えします。" },
            { number: "03", title: "ご提案・デザイン制作", desc: "コンセプト・ワイヤーフレーム・デザインの順で進行。都度Figmaで確認いただけます。" },
            { number: "04", title: "制作・納品", desc: "修正を重ねながら最終仕上げへ。納品後もグロース支援をご用意しています。" },
          ]
        },
        { id: uid(), type: "faq", heading: "よくある質問",
          items: [
            { question: "どんな規模・業種でも対応できますか？", answer: "はい。個人事業主から上場企業まで、幅広い規模・業種のプロジェクトをご支援しています。まずはお気軽にご相談ください。" },
            { question: "納期はどのくらいかかりますか？", answer: "LP1ページであれば2〜4週間、Webサイト全体であれば1〜3ヶ月が目安です。急ぎの場合はご相談ください。" },
            { question: "途中で修正はできますか？", answer: "はい。Figmaを使いながら都度フィードバックをいただく進め方なので、認識のズレが生じにくく、スムーズに修正対応できます。" },
            { question: "コーディング・実装まで対応していますか？", answer: "GrowthプランおよびScaleプランではコーディングまで一貫対応。Starterプランはデザインデータの納品となります。" },
          ]
        },
        { id: uid(), type: "cta", heading: "一緒に、ワクワクする未来をつくりましょう！", body: "まずは無料相談から。お気軽にお声がけください。", buttonText: "無料で相談する →", buttonUrl: "/contact", buttonText2: "", buttonUrl2: "" },
        { id: uid(), type: "contact", heading: "お問い合わせ", desc: "ご不明な点はお気軽にご相談ください。担当スタッフが丁寧にご案内します。", buttonUrl: "/contact" },
      ],
      pages: [],
    } as unknown as SiteConfig;
  }
  if (id === "juku-sakura") {
    return {
      title: "サクラ進学塾", catchCopy: "女の子専門 中学受験特化",
      primaryColor: "#9D174D", accentColor: "#EC4899", fontFamily: "sans",
      logoUrl: "", headerHtml: "", footerHtml: "",
      globalStyle: { primaryColor: "#9D174D", accentColor: "#EC4899", bgColor: "#FDF2F8", cardBgColor: "#FCE7F3", buttonBgColor: "#EC4899", buttonTextColor: "#ffffff", buttonRadius: "100", cardBorderRadius: "20", sectionPaddingY: "80" },
      navLinks: [
        { id: uid(), label: "選ばれる理由", url: "#reason" },
        { id: uid(), label: "コース・料金", url: "#course" },
        { id: uid(), label: "よくある質問", url: "#faq" },
        { id: uid(), label: "お問い合わせ", url: "/contact" },
      ],
      sections: [
        { id: uid(), type: "hero-centered", eyebrow: "女の子専門 中学受験特化", tagline: "女の子専門\n中学受験塾\n『サクラ進学塾』", body: "「もっと自信を持って勉強したい」そんな女の子の気持ちを大切に。女性講師中心のやさしい環境で、第一志望合格を目指します。", buttonText: "無料体験授業を申し込む", buttonUrl: "/contact", buttonText2: "資料を請求する", buttonUrl2: "", imageUrl: "" },
        { id: uid(), type: "stats", heading: "選ばれる実績", items: [{ value: "95", suffix: "%", label: "志望校合格率" }, { value: "1,800", suffix: "名+", label: "累計卒業生" }, { value: "99", suffix: "%", label: "保護者満足度" }, { value: "600", suffix: "名+", label: "在籍講師数" }] },
        { id: uid(), type: "about", heading: "こんなお悩みはありませんか？", body: "女の子の特性に合わせた学習法がわからない。中学受験、何から始めたらいいかわからない。勉強嫌いになってしまわないか心配——サクラ進学塾がすべて解決します。", buttonText: "サクラの解決策を見る", buttonUrl: "" },
        { id: uid(), type: "features", heading: "サクラ進学塾の強み", subheading: "女の子のための細やかな指導環境",
          items: [
            { icon: { kind: "lucide", value: "Heart", size: 28 }, title: "女性講師中心の安心環境", desc: "女性講師が中心のやさしく温かみのある教室で、安心して学べる環境を整えています。" },
            { icon: { kind: "lucide", value: "GraduationCap", size: 28 }, title: "中学受験のプロフェッショナル", desc: "難関女子中学校への合格実績が豊富。各校の出題傾向を知り尽くした専門家が指導します。" },
            { icon: { kind: "lucide", value: "Smile", size: 28 }, title: "温かく親しみやすい学習環境", desc: "笑顔あふれる教室で、友達と切磋琢磨しながら楽しく学べます。講師との距離が近いのも特徴。" },
            { icon: { kind: "lucide", value: "Users", size: 28 }, title: "保護者様のご不安に寄り添うサポート", desc: "定期面談や日々の報告で、保護者の方が安心して任せられる体制を整えています。" },
            { icon: { kind: "lucide", value: "Star", size: 28 }, title: "「できた！」を育む授業スタイル", desc: "間違いを責めず、一歩ずつ前進する指導で自己肯定感と学力を同時に育てます。" },
            { icon: { kind: "lucide", value: "Award", size: 28 }, title: "完全個別カスタマイズカリキュラム", desc: "お子さまの目標・学力・性格に合わせたオリジナルカリキュラムを作成。確実な成長を約束します。" },
          ] as [{ icon: { kind: "lucide"; value: string; size: 28 }; title: string; desc: string }, { icon: { kind: "lucide"; value: string; size: 28 }; title: string; desc: string }, { icon: { kind: "lucide"; value: string; size: 28 }; title: string; desc: string }, { icon: { kind: "lucide"; value: string; size: 28 }; title: string; desc: string }, { icon: { kind: "lucide"; value: string; size: 28 }; title: string; desc: string }, { icon: { kind: "lucide"; value: string; size: 28 }; title: string; desc: string }]
        },
        { id: uid(), type: "steps", heading: "ご利用の流れ", subheading: "まずはお気軽にお問い合わせください",
          items: [
            { number: "01", title: "お問い合わせ", desc: "まずはお気軽にフォームもしくはお電話にてご連絡ください" },
            { number: "02", title: "学習相談・面談", desc: "現在の学習状況やお悩み、目標をじっくりお聞かせください" },
            { number: "03", title: "体験授業（無料）", desc: "実際に授業を受けて塾の雰囲気や指導スタイルをご確認ください" },
            { number: "04", title: "ご入塾・学習開始", desc: "ご納得いただいた上でご入塾。すぐに学習がスタートします" },
          ]
        },
        { id: uid(), type: "faq", heading: "よくある質問",
          items: [
            { question: "女の子専門とはどういう意味ですか？", answer: "女性講師が中心となり、女の子の学習スタイルや心理的特性に合わせた指導を行う塾です。男女混合の環境が苦手なお子さまも安心して通えます。" },
            { question: "中学受験以外の目的でも通えますか？", answer: "はい、学力向上や定期テスト対策など、受験以外の目的でもご利用いただけます。お子さまの状況に合わせてご提案します。" },
            { question: "体験授業は無料ですか？", answer: "はい、初回の体験授業は完全無料です。実際の授業スタイルをご体験の上、ご検討いただけます。" },
            { question: "オンライン受講は可能ですか？", answer: "はい、オンライン個別指導にも対応しています。通塾とオンラインを組み合わせることも可能です。" },
          ]
        },
        { id: uid(), type: "cta", heading: "まずは無料体験授業を", body: "女の子専門の個別指導塾サクラで、お子さまの可能性を最大限に引き出します。", buttonText: "無料体験を申し込む", buttonUrl: "/contact", buttonText2: "資料請求はこちら", buttonUrl2: "" },
        { id: uid(), type: "contact", heading: "お問い合わせ", desc: "ご不明な点はお気軽にご相談ください。女性スタッフが丁寧にご案内します。", buttonUrl: "/contact" },
      ],
      pages: [],
    } as unknown as SiteConfig;
  }
  return null;
}

// ── デモサムネイル（実際のHTMLをiframeで表示）────────────────
function DemoThumb({ t, W = 260, H = 155 }: { t: DemoTemplate; W?: number; H?: number }) {
  const IFRAME_W = 1280;
  const scale = W / IFRAME_W;
  const iframeH = Math.round(H / scale);
  return (
    <div style={{ width: W, height: H, overflow: "hidden", position: "relative",
      borderRadius: "10px 10px 0 0", background: t.thumb.bg, flexShrink: 0 }}>
      <iframe
        src={`/demos/${t.id}.html`}
        style={{ width: IFRAME_W, height: iframeH,
          transform: `scale(${scale})`, transformOrigin: "0 0",
          border: "none", pointerEvents: "none" }}
        scrolling="no"
        loading="lazy"
        title={t.name}
      />
    </div>
  );
}

const GEN_STEPS = [
  { pct: 10,  text: "参考サイトのデザインを解析中..." },
  { pct: 25,  text: "カラー・フォントを取り込み中..." },
  { pct: 42,  text: "ヒーローセクションを構築中..." },
  { pct: 58,  text: "強み・特徴カードを生成中..." },
  { pct: 72,  text: "お客様の声・FAQを作成中..." },
  { pct: 86,  text: "CTAとフッターを最適化中..." },
  { pct: 95,  text: "デザインを仕上げ中..." },
];

function MsIcon({ name, size = 20, color = NAVY, className = "" }: {
  name: string; size?: number; color?: string; className?: string;
}) {
  return (
    <span className={`material-symbols-rounded select-none leading-none ${className}`}
      style={{ fontSize: size, color }} aria-hidden="true">{name}</span>
  );
}

function FontLinks() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Montserrat:wght@600;700&display=swap" rel="stylesheet" />
    </>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════
export default function SetupClient() {
  const router = useRouter();

  const [phase,          setPhase]          = useState<Phase>("form");
  const [referenceUrl,   setReferenceUrl]   = useState("");
  const [isAnalyzing,    setIsAnalyzing]    = useState(false);
  const [analysisResult, setAnalysisResultState] = useState<GlobalStyle | null>(null);
  const analysisResultRef = useRef<GlobalStyle | null>(null);
  const chatDesignKeyRef = useRef<string>("");
  const [generatedConfig, setGeneratedConfig] = useState<SiteConfig | null>(null);
  const [error,          setError]          = useState("");
  const [urlError,       setUrlError]       = useState("");
  const [genPct,         setGenPct]         = useState(0);
  const [genText,        setGenText]        = useState(GEN_STEPS[0].text);

  const [businessName, setBusinessName] = useState("");
  const [serviceDesc,  setServiceDesc]  = useState("");
  const [target,       setTarget]       = useState("");
  const [strengths,    setStrengths]    = useState("");

  // ─── HTMLモード / デモモード ─────────────────────────────────
  const [mainTab,        setMainTab]      = useState<"chat" | "demo">("chat");
  const [genMode,        setGenMode]      = useState<"html" | "canvas">("html");
  const [htmlContent,    setHtmlContent]  = useState<string>("");
  const [blobUrl,        setBlobUrl]      = useState<string>("");
  const [selectedDemo,   setSelectedDemo] = useState<DemoTemplate | null>(null);
  const [demoBizName,    setDemoBizName]  = useState("");
  const [demoBizDesc,    setDemoBizDesc]  = useState("");
  const [htmlEditorOpen, setHtmlEditorOpen] = useState(false);
  const [editingHtml,    setEditingHtml]    = useState("");

  const [chatMessages,   setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput,      setChatInput]    = useState("");
  const [isChatLoading,  setIsChatLoading] = useState(false);
  const [chatInited,     setChatInited]   = useState(false);
  const [demoError,      setDemoError]    = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const sendingRef = useRef(false); // 二重送信防止（Stateは非同期なのでRefで管理）

  function setAnalysisResult(val: GlobalStyle | null) {
    analysisResultRef.current = val;
    setAnalysisResultState(val);
  }

  // ─── 参考サイト解析 ──────────────────────────────────────
  const analyzeUrl = useCallback(async () => {
    const url = referenceUrl.trim();
    if (!url || isAnalyzing) return;
    setIsAnalyzing(true);
    setUrlError("");
    setAnalysisResult(null);
    try {
      const res = await fetch("/api/analyze-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      let data: { error?: string; style?: unknown };
      try { data = await res.json(); } catch { throw new Error("解析に失敗しました。別のURLをお試しください。"); }
      if (!res.ok || data.error) {
        const msg = data.error ?? "";
        if (msg.includes("401") || msg.includes("403")) {
          throw new Error("このサイトはアクセス制限があり解析できませんでした。別のURLをお試しいただくか、URLなしで生成できます。");
        }
        if (msg.includes("404")) {
          throw new Error("URLが見つかりませんでした（404）。URLを確認してください。");
        }
        throw new Error(msg || "デザイン解析に失敗しました。URLなしで生成できます。");
      }
      setAnalysisResult(data.style as GlobalStyle);
    } catch (e) {
      setUrlError(e instanceof Error ? e.message : "URL解析に失敗しました");
    } finally {
      setIsAnalyzing(false);
    }
  }, [referenceUrl, isAnalyzing]);

  // ─── エディターへ直接遷移 ────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const goToEditor = useCallback((config: any) => {
    localStorage.setItem("site-config", JSON.stringify(config));
    sessionStorage.removeItem("site-mode");
    sessionStorage.removeItem("site-html");
    router.push("/admin");
  }, [router]);

  // ─── サイト生成 ──────────────────────────────────────────
  const generateSite = useCallback(async () => {
    setPhase("generating");
    setGenPct(0);
    setGenText(GEN_STEPS[0].text);

    GEN_STEPS.forEach(({ pct, text }, i) => {
      setTimeout(() => { setGenPct(pct); setGenText(text); }, i * 1600);
    });

    try {
      const res = await fetch("/api/setup-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "form-generate",
          formData: { businessName, serviceDesc, target, strengths },
          analysisResult: analysisResultRef.current ?? undefined,
        }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: { error?: string; config?: any };
      try { data = await res.json(); } catch { throw new Error("サーバーエラーが発生しました。もう一度お試しください。"); }
      if (!res.ok || data.error) throw new Error(data.error ?? "生成に失敗しました");

      setGenPct(100);
      setTimeout(() => { setGeneratedConfig(data.config); goToEditor(data.config); }, 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成に失敗しました");
      setPhase("form");
    }
  }, [businessName, serviceDesc, target, strengths, goToEditor]);

  // ─── HTML LP 生成 ──────────────────────────────────────────
  const generateHtml = useCallback(async () => {
    setPhase("generating");
    setGenPct(0);
    setGenText("AIがHTMLを設計中...");

    const HTML_STEPS = [
      { pct: 12, text: "デザインコンセプトを設計中..." },
      { pct: 28, text: "ヒーローセクションを構築中..." },
      { pct: 46, text: "各セクションをデザイン中..." },
      { pct: 64, text: "アニメーション・インタラクションを追加中..." },
      { pct: 80, text: "カラー・タイポグラフィを調整中..." },
      { pct: 93, text: "最終仕上げ中..." },
    ];
    HTML_STEPS.forEach(({ pct, text }, i) => {
      setTimeout(() => { setGenPct(pct); setGenText(text); }, i * 2200);
    });

    try {
      const res = await fetch("/api/generate-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          serviceDesc,
          target,
          strengths,
          globalStyle: analysisResultRef.current ?? undefined,
        }),
      });
      let data: { error?: string; html?: string };
      try { data = await res.json(); } catch { throw new Error("サーバーエラーが発生しました。もう一度お試しください。"); }
      if (!res.ok || data.error) throw new Error(data.error ?? "HTML生成に失敗しました");

      setGenPct(100);
      setTimeout(() => {
        setHtmlContent(data.html!);
        setPhase("html-preview");
      }, 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "HTML生成に失敗しました");
      setPhase("form");
    }
  }, [businessName, serviceDesc, target, strengths]);

  // ─── デモロード（mode別に分岐）────────────────────────────────
  const generateFromDemo = useCallback(async () => {
    if (!selectedDemo) return;
    setDemoError("");

    // ブロックモード: そのままadminへ
    if (selectedDemo.mode === "blocks") {
      const config = buildDemoConfig(selectedDemo.id);
      if (!config) { setDemoError("このデモは対応していません"); return; }
      setGeneratedConfig(config);
      goToEditor(config);
      return;
    }

    // HTMLモード: デモHTMLをそのままadminにロード
    try {
      const res = await fetch(`/demos/${selectedDemo.id}.html`);
      if (!res.ok) throw new Error("デモHTMLの取得に失敗しました");
      const html = await res.text();
      sessionStorage.setItem("site-mode", "html");
      sessionStorage.setItem("site-html", html);
      router.push("/admin");
    } catch {
      setDemoError("デモの読み込みに失敗しました。もう一度お試しください。");
    }
  }, [selectedDemo, router]);

  // ─── チャット: メッセージ送信 ────────────────────────────────
  const runChatGenerate = useCallback(async (msgs: ChatMessage[]) => {
    setPhase("generating");
    setGenPct(0);
    setGenText(GEN_STEPS[0].text);
    GEN_STEPS.forEach(({ pct, text }, i) => {
      setTimeout(() => { setGenPct(pct); setGenText(text); }, i * 1600);
    });
    try {
      const res = await fetch("/api/setup-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "generate",
          messages: msgs,
          analysisResult: analysisResultRef.current ?? undefined,
          designKey: chatDesignKeyRef.current || undefined,
        }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: { error?: string; config?: any };
      try { data = await res.json(); } catch { throw new Error("サーバーエラーが発生しました。もう一度お試しください。"); }
      if (!res.ok || data.error) throw new Error(data.error ?? "生成に失敗しました");
      setGenPct(100);
      setTimeout(() => { setGeneratedConfig(data.config); goToEditor(data.config); }, 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成に失敗しました");
      setPhase("form");
    }
  }, [goToEditor]);

  const sendChatMessage = useCallback(async (msgs: ChatMessage[]) => {
    setIsChatLoading(true);
    try {
      const res = await fetch("/api/setup-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "chat", messages: msgs }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setError(""); // 成功したらエラーをクリア
      const allMsgs: ChatMessage[] = [...msgs, { role: "assistant", content: data.reply }];
      setChatMessages(allMsgs);
      if (data.designKey) chatDesignKeyRef.current = data.designKey;
      if (data.shouldGenerate) {
        setTimeout(() => runChatGenerate(allMsgs), 600);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "チャットエラーが発生しました");
    } finally {
      sendingRef.current = false;
      setIsChatLoading(false);
      setTimeout(() => chatInputRef.current?.focus(), 100);
    }
  }, [runChatGenerate]);

  const handleSend = useCallback(() => {
    const text = chatInput.trim();
    if (!text || sendingRef.current) return;
    sendingRef.current = true;
    const newMsgs: ChatMessage[] = [...chatMessages, { role: "user", content: text }];
    setChatMessages(newMsgs);
    setChatInput("");
    sendChatMessage(newMsgs);
  }, [chatInput, chatMessages, sendChatMessage]);

  // チャットタブに切り替えた時に初回メッセージを取得（lazy init）
  useEffect(() => {
    if (mainTab === "chat" && !chatInited && chatMessages.length === 0 && !isChatLoading) {
      setChatInited(true);
      sendChatMessage([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainTab]);

  // 新メッセージが来たらスクロール
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatLoading]);

  // HTMLコンテンツ → Blob URL
  useEffect(() => {
    if (!htmlContent) return;
    const url = URL.createObjectURL(new Blob([htmlContent], { type: "text/html" }));
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [htmlContent]);

  const startEditing = useCallback(() => {
    if (!generatedConfig) return;
    goToEditor(generatedConfig);
  }, [generatedConfig, goToEditor]);

  const reset = useCallback(() => {
    setPhase("form");
    setGeneratedConfig(null);
    setReferenceUrl("");
    setAnalysisResult(null);
    setError("");
    setUrlError("");
    setChatMessages([]);
    setChatInput("");
  }, []);

  const canGenerate = !!businessName.trim() && !!serviceDesc.trim();

  // ══════════════════════════════════════════════════════════
  // PHASE: GENERATING
  // ══════════════════════════════════════════════════════════
  if (phase === "generating") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: "#F9FAFB", fontFamily: "'Noto Sans JP', sans-serif" }}>
        <FontLinks />

        <div className="relative w-36 h-36 mb-10">
          <div className="absolute inset-0 rounded-full border-[3px] border-[#E2E8F0]" />
          <div className="absolute inset-0 rounded-full border-[3px] border-t-[#1A365D] border-r-[#2B6CB0] border-b-transparent border-l-transparent"
            style={{ animation: "spin 1.2s linear infinite" }} />
          <div className="absolute inset-[10px] rounded-full border-[3px] border-t-transparent border-r-transparent border-b-[#D69E2E] border-l-[#ED8936]"
            style={{ animation: "spin 1.8s linear infinite reverse" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <MsIcon name="auto_awesome" size={36} color={NAVY} />
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-2 text-center" style={{ color: "#111827", letterSpacing: "-0.03em" }}>
          AIがサイトを生成中
        </h2>
        {referenceUrl && (
          <p className="text-xs mb-2 text-center px-6 truncate max-w-sm" style={{ color: "#9CA3AF" }}>
            {referenceUrl}
          </p>
        )}
        <p className="text-sm mb-10 text-center" style={{ color: "#6B7280" }}>{genText}</p>

        <div className="w-80 bg-[#E2E8F0] rounded-full h-1.5 mb-3 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${genPct}%`, background: `linear-gradient(90deg, ${NAVY}, #2B6CB0)` }} />
        </div>
        <p className="text-sm tabular-nums font-semibold" style={{ fontFamily: "'Montserrat', sans-serif", color: NAVY }}>
          {genPct}%
        </p>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // PHASE: PREVIEW（CanvasEditor）
  // ══════════════════════════════════════════════════════════
  if (phase === "preview" && generatedConfig) {
    const cfg = generatedConfig;
    const TOP_H = 60;

    return (
      <div style={{ minHeight: "100vh", background: "#F9FAFB", fontFamily: "'Noto Sans JP', sans-serif" }}>
        <FontLinks />
        <EditingContext.Provider value={true}>

          {/* ─── トップバー ─── */}
          <div className="sticky top-0 z-50 shadow-sm"
            style={{ background: "#FFFFFF", borderBottom: "1px solid #E2E8F0", height: TOP_H }}>
            <div className="max-w-7xl mx-auto px-5 h-full flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="ツクリエ" style={{ width: 30, height: 30, borderRadius: 9, objectFit: "cover" }} />
                <div>
                  <p className="font-bold text-sm leading-tight" style={{ color: "#111827" }}>サイトが完成しました！</p>
                  <p className="text-xs" style={{ color: "#6B7280" }}>テキストをクリックして直接編集できます</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={reset}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                  style={{ color: "#6B7280", border: "1px solid #E2E8F0", background: "#FFFFFF" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#FFFFFF"; }}>
                  <MsIcon name="refresh" size={14} color="#6B7280" />
                  やり直す
                </button>
                <button onClick={startEditing}
                  className="flex items-center gap-2 font-bold text-sm px-5 py-2 rounded-xl text-white transition-all shadow-md"
                  style={{ background: "#EA580C" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#C2410C"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#EA580C"; }}>
                  この内容で編集を始める
                  <MsIcon name="arrow_forward" size={16} color="#FFFFFF" />
                </button>
              </div>
            </div>
          </div>

          {/* ─── 2カラムレイアウト ─── */}
          <div className="flex max-w-7xl mx-auto">
            {/* 左：サマリー */}
            <aside className="shrink-0 overflow-y-auto p-6"
              style={{ width: 272, borderRight: "1px solid #E2E8F0", background: "#FFFFFF",
                position: "sticky", top: TOP_H, height: `calc(100vh - ${TOP_H}px)` }}>
              <div className="mb-6">
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: NAVY }}>生成されたサイト</p>
                <h2 className="text-lg font-bold leading-snug" style={{ color: "#111827" }}>{cfg.title}</h2>
                <p className="text-sm mt-1 leading-relaxed" style={{ color: "#6B7280" }}>{cfg.catchCopy}</p>
              </div>
              <div className="mb-6">
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>カラー</p>
                <div className="flex gap-3">
                  {[{ label: "メイン", color: cfg.primaryColor }, { label: "アクセント", color: cfg.accentColor }].map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: color, border: "2px solid #E2E8F0" }} />
                      <span className="text-xs" style={{ color: "#6B7280" }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>参考サイト</p>
                <p className="text-xs truncate" style={{ color: "#6B7280" }}>{referenceUrl || "（なし）"}</p>
              </div>
              <div className="pt-4" style={{ borderTop: "1px solid #E2E8F0" }}>
                <button onClick={startEditing}
                  className="w-full flex items-center justify-center gap-2 font-bold text-sm px-4 py-3 rounded-xl text-white transition-colors"
                  style={{ background: "#EA580C" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#C2410C"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#EA580C"; }}>
                  編集画面へ進む
                  <MsIcon name="arrow_forward" size={14} color="#FFFFFF" />
                </button>
              </div>
            </aside>

            {/* 右：CanvasEditor プレビュー */}
            <main className="flex-1 overflow-hidden flex flex-col">
              <CanvasEditor config={cfg} onChange={setGeneratedConfig} />
            </main>
          </div>

        </EditingContext.Provider>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // PHASE: HTML-PREVIEW
  // ══════════════════════════════════════════════════════════
  if (phase === "html-preview" && htmlContent) {
    const downloadHtml = () => {
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${(businessName || "landing-page").replace(/\s+/g, "-")}.html`;
      a.click();
    };

    const openEditor = () => {
      setEditingHtml(htmlContent);
      setHtmlEditorOpen(true);
    };

    const applyEdit = () => {
      setHtmlContent(editingHtml);
    };

    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0D0D0D", fontFamily: "'Noto Sans JP', sans-serif" }}>
        <FontLinks />

        {/* トップバー */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 20px", background: "#18181B", borderBottom: "1px solid #27272A", flexShrink: 0, gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ツクリエ" style={{ width: 28, height: 28, borderRadius: 8, objectFit: "cover" }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#FFFFFF" }}>LPが完成しました</p>
              <p className="text-xs" style={{ color: "#71717A" }}>{businessName}</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={reset}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors"
              style={{ color: "#A1A1AA", border: "1px solid #3F3F46", background: "transparent" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#27272A"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <MsIcon name="refresh" size={14} color="#A1A1AA" />
              やり直す
            </button>
            {/* 編集パネル トグル */}
            <button
              onClick={() => htmlEditorOpen ? setHtmlEditorOpen(false) : openEditor()}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors"
              style={{
                color: htmlEditorOpen ? "#FFFFFF" : "#A1A1AA",
                border: `1px solid ${htmlEditorOpen ? "#6366F1" : "#3F3F46"}`,
                background: htmlEditorOpen ? "#4F46E5" : "transparent",
              }}>
              <MsIcon name="edit" size={14} color={htmlEditorOpen ? "#FFFFFF" : "#A1A1AA"} />
              HTMLを編集
            </button>
            <button onClick={downloadHtml}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all"
              style={{ background: "#FFFFFF", color: "#111827" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F3F4F6"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#FFFFFF"; }}>
              <MsIcon name="download" size={16} color="#111827" />
              HTMLをダウンロード
            </button>
          </div>
        </div>

        {/* メインエリア: エディタ + プレビュー */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* 左: HTMLエディタパネル */}
          {htmlEditorOpen && (
            <div style={{
              width: 480, flexShrink: 0, display: "flex", flexDirection: "column",
              background: "#1E1E2E", borderRight: "1px solid #27272A",
            }}>
              {/* エディタヘッダ */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 14px", background: "#16161E", borderBottom: "1px solid #27272A", flexShrink: 0 }}>
                <span className="text-xs font-mono" style={{ color: "#7C7C9E" }}>index.html</span>
                <button
                  onClick={applyEdit}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                  style={{ background: "#4F46E5", color: "#FFFFFF" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#4338CA"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#4F46E5"; }}>
                  <MsIcon name="check" size={12} color="#FFFFFF" />
                  適用してプレビュー更新
                </button>
              </div>

              {/* テキストエリア */}
              <textarea
                value={editingHtml}
                onChange={e => setEditingHtml(e.target.value)}
                spellCheck={false}
                style={{
                  flex: 1, resize: "none", border: "none", outline: "none",
                  background: "#1E1E2E", color: "#CDD6F4",
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                  fontSize: 12, lineHeight: 1.7, padding: "14px 16px",
                  tabSize: 2,
                }}
              />

              {/* エディタフッタ */}
              <div style={{ padding: "6px 14px", background: "#16161E", borderTop: "1px solid #27272A",
                display: "flex", alignItems: "center", gap: 12 }}>
                <span className="text-[10px]" style={{ color: "#585878" }}>
                  {editingHtml.split("\n").length} 行 / {editingHtml.length.toLocaleString()} 文字
                </span>
                <span className="text-[10px]" style={{ color: "#585878" }}>
                  ※ 編集後「適用してプレビュー更新」を押してください
                </span>
              </div>
            </div>
          )}

          {/* 右: iframeプレビュー */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            {blobUrl && (
              <iframe
                src={blobUrl}
                style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                title="生成されたLP"
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // PHASE: FORM
  // ══════════════════════════════════════════════════════════
  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden", background: "#F9FAFB", fontFamily: "'Noto Sans JP', sans-serif" }}>
      <FontLinks />

      {/* ─── 左サイドバー ─── */}
      <aside style={{ width: 300, height: "100vh", background: "#FFFFFF", borderRight: "1px solid #E2E8F0",
        flexShrink: 0, display: "flex", flexDirection: "column", padding: "36px 28px", gap: 28, overflowY: "auto" }}
        className="hidden lg:flex">

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ツクリエ" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover" }} />
          <span className="font-bold text-base" style={{ color: "#111827" }}>ツクリエ</span>
        </div>

        {/* URL解析 */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <MsIcon name="travel_explore" size={16} color={NAVY} />
            <p className="text-sm font-bold" style={{ color: "#111827" }}>参考サイトのURLを入力</p>
          </div>
          <p className="text-xs mb-3 leading-relaxed" style={{ color: "#6B7280" }}>
            真似したいサイトのURLを入れると、その配色・フォントをサイトに反映します
          </p>
          <input type="url" value={referenceUrl} onChange={e => setReferenceUrl(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.nativeEvent.isComposing) analyzeUrl(); }}
            placeholder="https://example.com"
            className="w-full text-xs rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-200 mb-2"
            style={{ border: "1px solid #E2E8F0", background: "#F9FAFB", color: "#111827" }} />
          <button onClick={analyzeUrl} disabled={isAnalyzing || !referenceUrl.trim()}
            className="w-full text-sm py-2.5 rounded-lg font-semibold transition-opacity disabled:opacity-40"
            style={{ background: NAVY, color: "#FFFFFF" }}>
            {isAnalyzing
              ? <span className="flex items-center justify-center gap-2"><MsIcon name="hourglass_top" size={14} color="#FFFFFF" />解析中...</span>
              : "このデザインを取り込む"}
          </button>

          {urlError && (
            <div className="mt-2 p-3 rounded-xl" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
              <p className="text-xs leading-relaxed" style={{ color: "#DC2626" }}>{urlError}</p>
              <p className="text-xs mt-1" style={{ color: "#991B1B" }}>↓ URLなしでもサイト生成できます</p>
            </div>
          )}

          {analysisResult && (
            <div className="mt-3 p-3 rounded-xl" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "#059669" }}>✓ デザイン解析完了</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {[
                  { key: "primaryColor", label: "メイン" }, { key: "accentColor", label: "アクセント" },
                  { key: "heroBgColor",  label: "Hero" },   { key: "bgColor",       label: "背景" },
                  { key: "cardBgColor",  label: "カード" }, { key: "buttonBgColor", label: "ボタン" },
                ].map(({ key, label }) => {
                  const color = (analysisResult as Record<string, string>)[key];
                  if (!color) return null;
                  return (
                    <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 5, backgroundColor: color, border: "1.5px solid rgba(0,0,0,0.12)" }} />
                      <span style={{ fontSize: 9, color: "#9CA3AF" }}>{label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysisResult.headingFont && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#EBF4FF", color: NAVY }}>{analysisResult.headingFont}</span>
                )}
                {analysisResult.designStyle && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#FFF7ED", color: "#92400E" }}>{analysisResult.designStyle}</span>
                )}
                {analysisResult.designNotes && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#F0FFF4", color: "#065F46" }}>{analysisResult.designNotes}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 使い方 */}
        <div style={{ paddingTop: 20, borderTop: "1px solid #E2E8F0" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "#9CA3AF" }}>使い方</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { num: "01", text: "真似したいサイトのURLを入力してデザインを取り込む" },
              { num: "02", text: "あなたの事業情報を入力する" },
              { num: "03", text: "AIがプロ品質のサイトを自動生成" },
              { num: "04", text: "ブロックをクリックして自由に編集" },
            ].map(step => (
              <div key={step.num} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span className="font-bold text-xs shrink-0" style={{ color: NAVY, fontFamily: "'Montserrat', sans-serif" }}>{step.num}</span>
                <span className="text-xs leading-relaxed" style={{ color: "#374151" }}>{step.text}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ─── メインエリア ─── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

        {/* トップバー */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 24px", borderBottom: "1px solid #E2E8F0", background: "#FFFFFF", flexShrink: 0, gap: 16 }}>
          <div className="flex items-center gap-2 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ツクリエ" style={{ width: 28, height: 28, borderRadius: 8, objectFit: "cover" }} />
            <span className="text-sm font-bold" style={{ color: "#111827" }}>ツクリエ</span>
          </div>

          {/* タブ切替 */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#F3F4F6" }}>
            {([
              ["chat", "AIとチャット", "chat"],
              ["demo", "デモから作成", "grid_view"],
            ] as const).map(([tab, label, icon]) => (
              <button key={tab} onClick={() => { setMainTab(tab); setError(""); setDemoError(""); }}
                className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-lg font-medium transition-all"
                style={{
                  background: mainTab === tab ? "#FFFFFF" : "transparent",
                  color: mainTab === tab ? "#111827" : "#6B7280",
                  boxShadow: mainTab === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}>
                <MsIcon name={icon} size={14} color={mainTab === tab ? NAVY : "#9CA3AF"} />
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {error && (
              <span className="text-xs flex items-center gap-1.5" style={{ color: "#DC2626" }}>
                <MsIcon name="error" size={14} color="#DC2626" />
                {error}
              </span>
            )}
            <a href="/admin" className="text-xs px-3 py-1.5 rounded-lg"
              style={{ color: "#6B7280", border: "1px solid #E2E8F0", background: "#FFFFFF" }}>
              スキップして編集へ →
            </a>
          </div>
        </div>

        {/* ════ デモから作成タブ ════ */}
        {mainTab === "demo" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", background: "#F9FAFB" }}>
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="font-bold mb-1" style={{ fontSize: 20, color: "#111827", letterSpacing: "-0.02em" }}>
                  デモサイトから作成
                </h2>
                <p className="text-sm" style={{ color: "#6B7280" }}>
                  お好みのデザインを選ぶと、そのまま編集できる状態で開きます。
                </p>
              </div>

              {/* デモカードグリッド */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
                {DEMO_TEMPLATES.map(demo => (
                  <button key={demo.id}
                    onClick={() => setSelectedDemo(prev => prev?.id === demo.id ? null : demo)}
                    className="text-left transition-all"
                    style={{
                      background: "#FFFFFF",
                      border: `2px solid ${selectedDemo?.id === demo.id ? NAVY : "#E2E8F0"}`,
                      borderRadius: 14,
                      overflow: "hidden",
                      boxShadow: selectedDemo?.id === demo.id ? `0 0 0 3px ${NAVY}22` : "0 1px 4px rgba(0,0,0,0.06)",
                      cursor: "pointer",
                    }}>
                    <DemoThumb t={demo} W={260} H={150} />
                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span className="text-xs font-bold" style={{ color: "#111827" }}>{demo.name}</span>
                        {selectedDemo?.id === demo.id && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: NAVY, color: "#FFFFFF" }}>選択中</span>
                        )}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium inline-block mb-2"
                        style={{ background: "#F3F4F6", color: "#6B7280" }}>{demo.label}</span>
                      <p className="text-xs leading-relaxed" style={{ color: "#9CA3AF" }}>{demo.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* 選択後の確認 */}
              {selectedDemo && (
                <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1.5px solid ${NAVY}33`, padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: NAVY }} />
                    <p className="text-sm font-bold" style={{ color: "#111827" }}>
                      「{selectedDemo.name}」をそのまま使います
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "#EFF6FF", color: NAVY }}>{selectedDemo.label}</span>
                  </div>
                  <p className="text-xs mb-4" style={{ color: "#6B7280" }}>
                    サムネイルと同じデザインがそのまま開きます。テキストをクリックして直接編集、セクションはドラッグで並び替えできます。
                  </p>
                  {demoError && (
                    <div className="flex items-start gap-2 p-3 rounded-xl mb-4"
                      style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                      <MsIcon name="error" size={14} color="#DC2626" />
                      <p className="text-xs leading-relaxed" style={{ color: "#DC2626" }}>{demoError}</p>
                    </div>
                  )}
                  <button
                    onClick={generateFromDemo}
                    className="flex items-center justify-center gap-2 font-bold text-sm py-3 rounded-xl text-white transition-all w-full"
                    style={{
                      background: `linear-gradient(135deg, ${NAVY}, #2B6CB0)`,
                      boxShadow: "0 4px 16px rgba(26,54,93,0.3)",
                    }}>
                    <MsIcon name="edit" size={16} color="#FFFFFF" />
                    このデザインで編集を始める
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ チャット ════ */}
        {mainTab === "chat" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* メッセージ一覧 */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
            {chatMessages.length === 0 && !isChatLoading && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                <p className="text-sm" style={{ color: "#9CA3AF" }}>AIが接続中...</p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                {msg.role === "assistant" && (
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: NAVY,
                    display: "flex", alignItems: "center", justifyContent: "center", marginRight: 8, flexShrink: 0, marginTop: 4 }}>
                    <MsIcon name="auto_awesome" size={14} color="#FFFFFF" />
                  </div>
                )}
                <div style={{
                  maxWidth: "72%",
                  padding: "10px 14px",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
                  background: msg.role === "user" ? NAVY : "#FFFFFF",
                  color: msg.role === "user" ? "#FFFFFF" : "#111827",
                  border: msg.role === "assistant" ? "1px solid #E2E8F0" : "none",
                  fontSize: 14,
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: NAVY,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MsIcon name="auto_awesome" size={14} color="#FFFFFF" />
                </div>
                <div style={{ display: "flex", gap: 5, padding: "10px 14px", background: "#FFFFFF",
                  borderRadius: "4px 18px 18px 18px", border: "1px solid #E2E8F0" }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#CBD5E1",
                      animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* 入力エリア */}
          <div style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", background: "#FFFFFF", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", maxWidth: 720, margin: "0 auto" }}>
              <input ref={chatInputRef}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); handleSend(); } }}
                placeholder="メッセージを入力… (Enterで送信)"
                disabled={isChatLoading}
                className="flex-1 text-sm outline-none"
                style={{ padding: "10px 16px", borderRadius: 14,
                  border: "1.5px solid #E2E8F0", background: "#F9FAFB", color: "#111827" }} />
              <button onClick={handleSend} disabled={!chatInput.trim() || isChatLoading}
                className="flex items-center justify-center transition-opacity disabled:opacity-40"
                style={{ width: 42, height: 42, borderRadius: 12,
                  background: NAVY, border: "none", cursor: "pointer", flexShrink: 0 }}>
                <MsIcon name="send" size={18} color="#FFFFFF" />
              </button>
            </div>
            <p className="text-center text-xs mt-2" style={{ color: "#9CA3AF" }}>
              AIの質問に答えるとサイトが自動生成されます
            </p>
          </div>
        </div>
        )}
      </main>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
