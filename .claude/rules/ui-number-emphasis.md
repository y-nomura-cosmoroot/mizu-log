---
paths:
  - "src/components/**/*.tsx"
  - "src/components/**/*.module.css"
---

# 数値の強調と単位の扱い

合計・小計・件数・完了数・用量など「数値を目立たせたい」表示では、**数値本体だけ**を大きく/太くし、
単位（`ml` `℃` `kg` `回` `回/分` `錠` 等）は数値と同じ要素の中に入れ子の
`<span className={...単位用の小さいクラス}>単位</span>` として書く。

```tsx
<b data-testid="water-day-total" className={styles.totalNum}>
  {dayTotalMl}
  <span className={styles.totalUnit}>ml</span>
</b>
```

```css
.totalNum {
  font-size: var(--fs-22);
  font-weight: var(--fw-black);
}

.totalUnit {
  font-size: var(--fs-14);
}
```

- 単位側の `font-weight` は明示的にリセットしない（親の `<b>`/太字クラスから継承させる）。
  サイズだけ落とせば「単位」として十分読める（`IntakePanel` の `この時間の飲水量` 表示のパターンに倣う）
- `{数値}単位` を1つの文字列として結合して返す関数（例: `` `${n}ml` ``）は書かない。
  数値と単位を別要素に分けられず、後から数値だけ強調できなくなる。単位付き文字列を返す既存のヘルパーは
  JSXを返すコンポーネントに置き換える
- `data-testid` は数値+単位をまとめて持つ親要素に付けてよい。Playwrightの `toHaveText` は
  結合後の `textContent` で比較するため、単位を入れ子spanに分けても `"150ml"` のような表示文字列としては変わらず、
  既存のE2Eアサーションを壊さない

## 経緯

[IntakePanel.tsx](../../src/components/home/IntakePanel.tsx) の「今日の合計」表示で
数値と `ml` が同じ大きさ・太さでひとまとまりになっていたのが最初の指摘。その後、同じ問題が
[WaterUrineHistory.tsx](../../src/components/history/WaterUrineHistory.tsx)（履歴の小計・1日の合計）、
[VitalHistory.tsx](../../src/components/history/VitalHistory.tsx)（🌡体温・体重・便/食事の回数）、
[MedsTab.tsx](../../src/components/meds/MedsTab.tsx)（きょうの分の完了数）、
[MedDoseList.tsx](../../src/components/meds/MedDoseList.tsx)（薬の用量）の計5箇所に残っていたため
横展開で修正した。新しく数値+単位を表示するコンポーネントを書くときは最初からこのパターンに従うこと。
（コード例はインラインstyle時代のものからCSS Modules移行後の形に更新済み）
