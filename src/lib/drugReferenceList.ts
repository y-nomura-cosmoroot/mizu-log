// このファイルは scripts/generate-drug-reference-list.js が
// docs/drugreference.csv から自動生成したものです。手で編集しないでください。
// 薬剤名を追加・修正するときは docs/drugreference.csv を編集してから再実行してください。

/** "generic_ingredient"(成分の一般名) / "brand_product"(先発品の販売名) / "generic_product"(後発品の製品名) */
export type DrugReferenceKind = "generic_ingredient" | "brand_product" | "generic_product";

export interface DrugReferenceEntry {
  name: string;
  kind: DrugReferenceKind;
  category: string;
}

/** OCR訂正段(GROQ_CONFIRM_MODEL)が実在薬剤名への訂正に使う照合リスト */
export const DRUG_REFERENCE_ENTRIES: DrugReferenceEntry[] = [
  {
    "name": "アーチスト錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "アザチオプリン",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "アザニン錠",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "アジルサルタン",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "アジルサルタン錠／OD錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "アジルバ錠／OD錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "アゾセミド",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "アゾセミド錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "アダラートCR錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "アダラートCR錠／カプセル",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "アテレック錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "アバプロ錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "アバプロ錠／イルベタン錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "アムロジピンベシル酸塩",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "アムロジピン錠／OD錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "アムロジン錠／OD錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "アルガトロバン水和物",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "アルガトロバン注射液",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "アルダクトンA錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "アルダクトンA錠／細粒",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "アルファカルシドール",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "アルファカルシドールカプセル／錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "アルファロールカプセル／ワンアルファ錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "アルファロールカプセル／内用液／散",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "アロプリノール",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "アロプリノール錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "イスコチン錠／原末",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "イソニアジド",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "イミダプリル塩酸塩",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "イミダプリル塩酸塩錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "イムラン錠",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "イムラン錠／アザニン錠",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "イルベサルタン",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "イルベサルタン錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "イルベタン錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "インダパミド",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "ウパシカルセトナトリウム水和物",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "ウパシタ静注透析用",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ウリアデック錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "エースコール錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "エサキセレノン",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "エスポー注射液／皮下用",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "エテルカルセチド塩酸塩",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "エナラプリルマレイン酸塩",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "エナラプリルマレイン酸塩錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "エナロイ錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "エナロデュスタット",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "エプレレノン",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "エプレレノン錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "エベレンゾ錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "エベロリムス",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "エポエチン アルファ（遺伝子組換え）",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "エポエチン ベータ ペゴル（遺伝子組換え）",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "エポエチン ベータ（遺伝子組換え）",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "エポエチンアルファBS注",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "エボカルセト",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "エポジン注",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "エルカルチンFF錠／内用液／静注",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "エンテカビル錠／OD錠",
    "kind": "generic_product",
    "category": "腎移植"
  },
  {
    "name": "エンテカビル水和物",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "エンパグリフロジン",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "エンレスト錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "オキサロール注",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "オキサロール軟膏・ローション（乾癬用）",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "オルケディア錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "オルメサルタン メドキソミル",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "オルメサルタン錠／OD錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "オルメテックOD錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "カナグリフロジン水和物",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "カナグル錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "カリエード散／プラス",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "カリメート散／経口液／ドライシロップ",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "カルシトリオール",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "カルシトリオールカプセル 等",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "カルタン錠／OD錠／細粒",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "カルチコール注射液",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "カルデナリン錠／OD錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "カルベジロール",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "カルベジロール錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "カルボキシマルトース第二鉄",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "ガンシクロビル",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "カンデサルタン シレキセチル",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "カンデサルタン錠／OD錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "キックリンカプセル／顆粒",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "キドミン輸液／ネオアミユー輸液",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "クエン酸第一鉄Na錠／ナトリウム錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "クエン酸第一鉄ナトリウム",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "クエン酸第二鉄水和物",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "グスペリムス塩酸塩",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "グラセプターカプセル",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "グラセプターカプセル（徐放性）",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "グルコン酸カルシウム水和物",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "クレメジンカプセル／細粒／速崩錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ケイキサレート散／ドライシロップ",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ケレンディア錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "コニール錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "コバシル錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "コルスバ静注透析用シリンジ",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "サーティカン錠",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "サイモグロブリン点滴静注用25mg",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "ザイロリック錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "サクビトリルバルサルタン ナトリウム水和物",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "サムスカ錠／OD錠／顆粒",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "サンディミュン点滴静注用／内用液",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "シクロスポリン",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "シクロスポリンカプセル 等",
    "kind": "generic_product",
    "category": "腎移植"
  },
  {
    "name": "シナカルセト塩酸塩",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "ジフェリケファリン酢酸塩",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "ジフルカンカプセル／静注液",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "シムレクト静注用20mg／小児用10mg",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "ジャディアンス錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ジルコニウムシクロケイ酸ナトリウム水和物",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "ジルチアゼム塩酸塩",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "ジルチアゼム塩酸塩錠 等",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "シルニジピン",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "シルニジピン錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "スクロオキシ水酸化鉄",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "スパニジン点滴静注用100mg",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "スピロノラクトン",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "スピロノラクトン錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "スルファメトキサゾール・トリメトプリム配合",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "スロンノンHI注",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "セパミット細粒／Rカプセル",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "セベラマー塩酸塩",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "セララ錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "セルセプトカプセル250／懸濁用散",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "ソル・メドロール静注用",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "ダーブロック錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ダイアート錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ダイフェン配合錠／配合顆粒",
    "kind": "generic_product",
    "category": "腎移植"
  },
  {
    "name": "タクロリムスカプセル／錠／顆粒",
    "kind": "generic_product",
    "category": "腎移植"
  },
  {
    "name": "タクロリムス水和物",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "タクロリムス水和物（徐放性製剤）",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "タケプロン、ネキシウム 等",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "タケプロンカプセル／OD錠",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "タナトリル錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ダパグリフロジンプロピレングリコール水和物",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "ダプロデュスタット",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "ダルテパリンNa静注",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "ダルテパリンナトリウム",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "ダルベポエチン アルファ（遺伝子組換え）",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "ダルベポエチンアルファBS注シリンジ",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "ダルベポエチンアルファ注シリンジ",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "ディオバン錠／OD錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "テナパノル塩酸塩",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "デノシン点滴静注用",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "デノシン点滴静注用500mg",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "テモカプリル塩酸塩",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "テモカプリル塩酸塩錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "デルイソマルトース第二鉄",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "テルミサルタン",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "テルミサルタン錠／OD錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "ドキサゾシンメシル酸塩",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "ドキサゾシン錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "ドチヌラド",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "トピロキソスタット",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "トピロリック錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "トピロリック錠／ウリアデック錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "トラセミド",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "トラセミド錠／OD錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "トリクロルメチアジド",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "トリクロルメチアジド錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "トルバプタン",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "トルバプタン錠／OD錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "ナトリックス錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ナトリックス錠／テナキシル錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ナファモスタットメシル酸塩",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "ナファモスタットメシル酸塩注射用 等",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "ナルフラフィン塩酸塩",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "ナルフラフィン塩酸塩カプセル／OD錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "ニフェジピン",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "ニフェジピン（徐放性）",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "ニフェジピンCR錠 等",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "ニューロタン錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ネオーラルカプセル／内用液",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "ネオーラルカプセル／内用液（注射：サンディミュン）",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "ネスプ注射液プラシリンジ",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ノバスタンHI注",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ノバスタンHI注／スロンノンHI注",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ノルバスク錠／OD錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ノルバスク錠／アムロジン錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "パーサビブ静注透析用",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "バイフィル（透析用）",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "バクタ配合錠／配合顆粒",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "バクタ配合錠／配合顆粒（注射：バクトラミン）",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "バクトラミン注／配合錠",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "バシリキシマブ（遺伝子組換え）",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "バダデュスタット",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "バフセオ錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "バラクルード錠0.5mg",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "バラシクロビル塩酸塩",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "バラシクロビル錠／顆粒 等",
    "kind": "generic_product",
    "category": "腎移植"
  },
  {
    "name": "バリキサ錠450mg／ドライシロップ",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "バルガンシクロビル塩酸塩",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "バルサルタン",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "バルサルタン錠／OD錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "バルトレックス錠／顆粒",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "ピートルチュアブル錠／顆粒",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ビキサロマー",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "ビソノテープ（経皮吸収型）",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ビソプロロールフマル酸塩",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "ビソプロロールフマル酸塩錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "ファレカルシトリオール",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "フィネレノン",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "フェインジェクト静注500mg",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "フェジン静注",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "フェブキソスタット",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "フェブキソスタット錠／OD錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "フェブリク錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "フェロミア錠／顆粒",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "フォシーガ錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "フォスブロック錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "フォゼベル錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "フラグミン静注",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "フルイトラン錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "フルコナゾール",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "フルコナゾールカプセル／静注 等",
    "kind": "generic_product",
    "category": "腎移植"
  },
  {
    "name": "ブレディニン錠／OD錠",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "プレドニゾロン",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "プレドニゾロン錠／散 等",
    "kind": "generic_product",
    "category": "腎移植"
  },
  {
    "name": "プレドニン錠（注射：水溶性プレドニン）",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "プレドニン錠／プレドニゾロン錠・散",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "プレバイミス錠240mg／点滴静注240mg",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "プログラフカプセル／顆粒／注射液",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "フロセミド",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "フロセミド錠／細粒／注 等",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "プロトンポンプ阻害薬（例：ランソプラゾール、エソメプラゾール）",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "ブロプレス錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ベニジピン塩酸塩",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "ベニジピン塩酸塩錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "ヘパフィルド透析用",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "ヘパフラッシュ",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "ヘパリンNa注 等",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "ヘパリンナトリウム",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "ヘパリンナトリウム注 等",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "ヘパリンナトリウム注（各社）",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ペリンドプリルエルブミン",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "ペリンドプリルエルブミン錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "ヘルベッサー錠／Rカプセル",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ヘルベッサー錠／Rカプセル／注",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ベンズブロマロン",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "ベンズブロマロン錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "ホーネル錠／フルスタン錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ホスカビル注24mg/mL",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "ホスカルネットナトリウム水和物",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "ホスレノールチュアブル錠／OD錠／顆粒",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ポリスチレンスルホン酸Ca経口ゼリー／散 等",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "ポリスチレンスルホン酸Na 等",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "ポリスチレンスルホン酸カルシウム",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "ポリスチレンスルホン酸ナトリウム",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "マキサカルシトール",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "マキサカルシトール静注透析用 等",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "マスーレッド錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ミカルディス錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ミコフェノール酸モフェチル",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "ミコフェノール酸モフェチルカプセル",
    "kind": "generic_product",
    "category": "腎移植"
  },
  {
    "name": "ミゾリビン",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "ミネブロ錠／OD錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ミルセラ注シリンジ",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "メイロン静注",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "メインテート錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "メインテート錠（貼付：ビソノテープ）",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "メチルプレドニゾロン",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "メチルプレドニゾロンコハク酸エステルナトリウム",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "メドロール錠",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "モノヴァー静注",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "モリデュスタットナトリウム",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "ユリス錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ユリノーム錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ラシックス錠／注",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ランソプラゾール",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "ランソプラゾールOD錠 等",
    "kind": "generic_product",
    "category": "腎移植"
  },
  {
    "name": "リオナ錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "リシノプリル錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "リシノプリル水和物",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "リツキサン点滴静注",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "リツキサン点滴静注100mg／500mg",
    "kind": "brand_product",
    "category": "腎移植"
  },
  {
    "name": "リツキシマブ（遺伝子組換え）",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "リツキシマブ（再掲）",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "リツキシマブBS点滴静注",
    "kind": "generic_product",
    "category": "腎移植"
  },
  {
    "name": "ルプラック錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "レグパラ錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "レテルモビル",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "レナジェル錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "レナジェル錠／フォスブロック錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "レニベース錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "レボカルニチン",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "レボカルニチン錠／内用液 等",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "レミッチカプセル／OD錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ロカルトロールカプセル",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ロカルトロールカプセル／注",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ロカルトロール注",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ロキサデュスタット",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "ロケルマ懸濁用散分包",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ロサルタンカリウム",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "ロサルタンカリウム錠／ロサルタンK錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "ロンゲス錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ロンゲス錠／ゼストリル錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "ワンアルファ錠",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "含糖酸化鉄",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "球形吸着炭",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "球形吸着炭細粒／カプセル",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "抗ヒト胸腺細胞ウサギ免疫グロブリン",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "抗ヒト胸腺細胞ウサギ免疫グロブリン（再掲）",
    "kind": "generic_ingredient",
    "category": "腎移植"
  },
  {
    "name": "重ソー（原末 等）",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "腎不全用アミノ酸製剤",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "炭カル錠",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "炭酸ランタンOD錠／チュアブル錠／顆粒",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "炭酸ランタン水和物",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "炭酸水素Na",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "炭酸水素ナトリウム",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "炭酸水素ナトリウム（原末・錠）",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "炭酸水素ナトリウム錠／原末（静注：メイロン）",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "注射用フサン",
    "kind": "brand_product",
    "category": "腎不全"
  },
  {
    "name": "沈降炭酸カルシウム",
    "kind": "generic_ingredient",
    "category": "腎不全"
  },
  {
    "name": "沈降炭酸カルシウム錠 等",
    "kind": "generic_product",
    "category": "腎不全"
  },
  {
    "name": "アスピリン腸溶錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "アスピリン（腸溶錠）",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "アセトアミノフェン",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "アセトアミノフェン錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "アトルバスタチンカルシウム水和物",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "アトルバスタチン錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "アピキサバン",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "アミティーザカプセル",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "アレグラ錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "アレロック錠／OD錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "アレンドロン酸ナトリウム水和物",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "アレンドロン酸錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "アログリプチン安息香酸塩",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "アログリプチン錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "イグザレルト錠／OD錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "インスリン アスパルト（遺伝子組換え）",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "インスリン グラルギン（遺伝子組換え）",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "インスリン デグルデク（遺伝子組換え）",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "インスリン リスプロ（遺伝子組換え）",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "インスリンアスパルトBS注 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "インスリングラルギンBS注 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "インスリンリスプロBS注 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "エクア錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "エスゾピクロン",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "エスゾピクロン錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "エゼチミブ",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "エゼチミブ錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "エソメプラゾールカプセル 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "エソメプラゾールマグネシウム水和物",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "エディロールカプセル",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "エドキサバントシル酸塩水和物",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "エフィエント錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "エリキュース錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "エルデカルシトール",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "エルデカルシトールカプセル 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "エロビキシバット水和物",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "オゼンピック皮下注／リベルサス錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "オロパタジン塩酸塩",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "オロパタジン塩酸塩錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "カロナール錠／細粒／坐剤",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ガスター錠／D錠／注",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ガスモチン錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "クラリチン錠／レディタブ",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "クレストール錠／OD錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "クロピドグレル硫酸塩",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "クロピドグレル錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "グルファスト錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "グーフィス錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "コルヒチン",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "コルヒチン錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ザイザル錠／シロップ",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "シタグリプチンリン酸塩水和物",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "シタグリプチン錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "シュアポスト錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "シロスタゾール",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "シロスタゾール錠／OD錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ジャヌビア錠／グラクティブ錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ジルテック錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "スボレキサント",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "セチリジン塩酸塩",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "セチリジン塩酸塩錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "セマグルチド",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "セレコキシブ",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "セレコキシブ錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "セレコックス錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "センノシド",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "センノシド錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ゼチーア錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ゾルピデム酒石酸塩",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "ゾルピデム酒石酸塩錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "タケキャブ錠／OD錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "タリオン錠／OD錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "タリージェ錠／OD錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ツムラ芍薬甘草湯エキス顆粒",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "テネリア錠／OD錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "テネリグリプチン臭化水素酸塩水和物",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "テネリグリプチン錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "デエビゴ錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "デザレックス錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "デスロラタジン",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "デノスマブ（遺伝子組換え）",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "デュラグルチド",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "トラゼンタ錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "トラマドール塩酸塩",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "トラマドール塩酸塩OD錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "トラマールOD錠／ワントラム錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "トルリシティ皮下注アテオス",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "トレシーバ注",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ネキシウムカプセル／懸濁用顆粒",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ネシーナ錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ノベルジン錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ノボラピッド注",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "バイアスピリン錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "パリエット錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "パルモディア錠／XR錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ヒューマログ注",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ヒルドイドソフト軟膏／ローション／フォーム",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ビラスチン",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "ビラスチン錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ビラノア錠／OD錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ビルダグリプチン",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "ビルダグリプチン錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ビ・シフロール錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ピコスルファートNa内用液 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ピコスルファートナトリウム水和物",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "ピタバスタチンカルシウム",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "ピタバスタチン錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ファモチジン",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "ファモチジン錠／OD錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "フェキソフェナジン塩酸塩",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "フェキソフェナジン塩酸塩錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ブロチゾラム",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "ブロチゾラム錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "プラスグレル塩酸塩",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "プラバスタチンNa錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "プラバスタチンナトリウム",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "プラビックス錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "プラミペキソール塩酸塩水和物",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "プラミペキソール塩酸塩錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "プラリア皮下注",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "プリンペラン錠／注",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "プルゼニド錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "プレガバリン",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "プレガバリンOD錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "プレタール錠／OD錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ヘパリン類似物質",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "ヘパリン類似物質油性クリーム／ローション 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ベポタスタチンベシル酸塩",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "ベポタスタチンベシル酸塩錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ベルソムラ錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ペマフィブラート",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "ボナロン錠／経口ゼリー（フォサマック錠）",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ボノプラザンフマル酸塩",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "マイスリー錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "マクロゴール4000配合",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "マグミット錠／細粒",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ミチグリニドカルシウム水和物",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "ミチグリニド錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ミロガバリンベシル酸塩",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "ムコスタ錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "メトクロプラミド",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "メトクロプラミド錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "メバロチン錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "モサプリドクエン酸塩水和物",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "モサプリドクエン酸塩錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "モニラック・シロップ／ラグノスNU経口ゼリー",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "モビコール配合内用剤",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ラキソベロン内用液／錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ラクツロース",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "ラクツロースシロップ 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ラベプラゾールNa錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ラベプラゾールナトリウム",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "ラメルテオン",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "ラメルテオン錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ランタス注ソロスター／XR注",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "リクシアナ錠／OD錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "リナクロチド",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "リナグリプチン",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "リバロ錠／OD錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "リバーロキサバン",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "リピトール錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "リリカカプセル／OD錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "リンゼス錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ルネスタ錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ルパタジンフマル酸塩",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "ルパフィン錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ルビプロストン",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "ルビプロストンカプセル 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "レバミピド",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "レバミピド錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "レパグリニド",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "レパグリニド錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "レボセチリジン塩酸塩",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "レボセチリジン塩酸塩錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "レンドルミン錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "レンボレキサント",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "ロキソニン錠／テープ",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ロキソプロフェンNa錠／テープ 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ロキソプロフェンナトリウム水和物",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "ロスバスタチンカルシウム",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "ロスバスタチン錠／OD錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ロゼレム錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ロラタジン",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "ロラタジン錠／OD錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ワルファリンK錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "ワルファリンカリウム",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "ワーファリン錠",
    "kind": "brand_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "芍薬甘草湯",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "芍薬甘草湯エキス顆粒（クラシエ 等）",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "酢酸亜鉛水和物",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "酢酸亜鉛錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  },
  {
    "name": "酸化マグネシウム",
    "kind": "generic_ingredient",
    "category": "支持療法・併存症"
  },
  {
    "name": "酸化マグネシウム錠 等",
    "kind": "generic_product",
    "category": "支持療法・併存症"
  }
];
